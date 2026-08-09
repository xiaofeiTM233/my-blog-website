import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import {
  DEFAULT_PAGE_SIZE,
  type FeedType,
  isFeedPriority,
  isFeedStatus,
  isFeedType,
  MAX_PAGE_SIZE,
} from '@/lib/feeds/constants';
import type {
  FeedDetail,
  FeedDto,
  FeedListItem,
  FeedListResult,
  FeedOptions,
} from '@/lib/feeds/types';
import Feed, { type IContent, type IFeed, type IFeedDoc, type IMeta } from '@/lib/models/Feed';

export class FeedError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = 'FeedError';
  }
}

export interface FeedListQuery {
  page?: string | null;
  pageSize?: string | null;
  channel?: string | null;
  type?: string | null;
  status?: string | null;
  priority?: string | null;
  tag?: string | null;
  keyword?: string | null;
  viewer?: string | null;
}

type StoredDoc = IFeed & {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function toFeedDto(doc: StoredDoc): FeedDto {
  const iso = (value?: Date | string) => (value ? new Date(value).toISOString() : undefined);

  return {
    _id: doc._id.toString(),
    meta: doc.meta,
    content: doc.content,
    interaction: doc.interaction,
    extra: doc.extra,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new FeedError(`非法的 ID：${id}`, 400);
  }
  return new mongoose.Types.ObjectId(id);
}

function readInt(value: string | null | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function buildMatch(query: FeedListQuery): Record<string, unknown> {
  const match: Record<string, unknown> = {};
  if (query.channel) match['meta.channel'] = query.channel;

  if (query.type) {
    if (!isFeedType(query.type)) throw new FeedError(`未知的类型：${query.type}`, 400);
    match['meta.type'] = query.type;
  }

  if (query.priority) {
    if (!isFeedPriority(query.priority)) {
      throw new FeedError(`未知的优先级：${query.priority}`, 400);
    }
    match['meta.priority'] = query.priority;
  }

  if (query.status) {
    if (!isFeedStatus(query.status)) throw new FeedError(`未知的状态：${query.status}`, 400);
    match['meta.status'] = query.status;
  } else {
    match['meta.status'] = { $ne: 'deleted' };
  }

  if (query.tag) match['content.tags'] = query.tag;

  const keyword = query.keyword?.trim().slice(0, 100);
  if (keyword) {
    const rx = new RegExp(escapeRegex(keyword), 'i');
    match.$or = [
      { 'content.title': rx },
      { 'content.summary': rx },
      { 'content.body': rx },
      { 'content.author.name': rx },
    ];
  }

  return match;
}

const COUNT_PROJECTION = {
  meta: 1,
  content: 1,
  likeCount: { $size: { $ifNull: ['$interaction.likes', []] } },
  commentCount: { $size: { $ifNull: ['$interaction.comments', []] } },
  viewCount: { $size: { $ifNull: ['$interaction.views', []] } },
};

export async function listFeeds(query: FeedListQuery): Promise<FeedListResult> {
  await dbConnect();

  const page = readInt(query.page, 1, 1, 10_000);
  const pageSize = readInt(query.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
  const match = buildMatch(query);
  const viewer = query.viewer?.slice(0, 64) ?? '';

  const [total, rows] = await Promise.all([
    Feed.countDocuments(match),
    Feed.aggregate<Omit<FeedListItem, '_id'> & { _id: mongoose.Types.ObjectId }>([
      { $match: match },
      { $sort: { 'meta.timestamp': -1, _id: -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      {
        $project: {
          ...COUNT_PROJECTION,
          likedByViewer: viewer
            ? {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: { $ifNull: ['$interaction.likes', []] },
                        as: 'item',
                        cond: { $eq: ['$$item.id', viewer] },
                      },
                    },
                  },
                  0,
                ],
              }
            : { $literal: false },
        },
      },
    ]),
  ]);

  return {
    list: rows.map((row) => ({
      _id: row._id.toString(),
      meta: row.meta,
      content: row.content,
      likeCount: row.likeCount,
      commentCount: row.commentCount,
      viewCount: row.viewCount,
      likedByViewer: row.likedByViewer,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasMore: page * pageSize < total,
    },
  };
}

export async function getFeed(id: string, viewer?: string | null): Promise<FeedDetail> {
  await dbConnect();
  const doc = await Feed.findById(toObjectId(id)).lean().exec();
  if (!doc) throw new FeedError('动态不存在', 404);

  const interaction = doc.interaction ?? { likes: [], comments: [], views: [] };
  const { _id, meta, content, extra } = doc as unknown as IFeedDoc & {
    _id: mongoose.Types.ObjectId;
  };

  return {
    _id: _id.toString(),
    meta,
    content,
    extra,
    likes: interaction.likes.map((log) => ({ id: log.id, timestamp: log.timestamp })),
    comments: interaction.comments.map((log) => ({
      _id: log._id ? String(log._id) : undefined,
      id: log.id,
      timestamp: log.timestamp,
      body: log.body,
    })),
    likeCount: interaction.likes.length,
    commentCount: interaction.comments.length,
    viewCount: interaction.views.length,
    likedByViewer: viewer ? interaction.likes.some((log) => log.id === viewer) : false,
  };
}

function requireString(value: unknown, field: string, max = 2000): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new FeedError(`${field} 必填`, 422);
  }
  if (value.length > max) {
    throw new FeedError(`${field} 超出 ${max} 字上限`, 422);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string, max = 2000): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return requireString(value, field, max);
}

function normalizeStringArray(
  value: unknown,
  field: string,
  { maxLength = 40, maxItems = 20 }: { maxLength?: number; maxItems?: number } = {},
): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new FeedError(`${field} 必须是字符串数组`, 422);
  return value
    .map((item) => requireString(item, field, maxLength))
    .filter((item, index, arr) => arr.indexOf(item) === index)
    .slice(0, maxItems);
}

function normalizeImageUrls(value: unknown, field: string): string[] | undefined {
  const list = normalizeStringArray(value, field, { maxLength: 500, maxItems: 9 });
  if (!list) return list;
  for (const url of list) {
    let protocol = '';
    try {
      protocol = new URL(url).protocol;
    } catch {
      throw new FeedError(`${field} 不是合法的 URL：${url}`, 422);
    }
    if (protocol !== 'http:' && protocol !== 'https:') {
      throw new FeedError(`${field} 只接受 http/https 图片地址`, 422);
    }
  }
  return list;
}

function normalizeMeta(raw: unknown, { partial }: { partial: boolean }): Partial<IMeta> {
  if (raw === undefined) {
    if (partial) return {};
    throw new FeedError('meta 必填', 422);
  }
  if (typeof raw !== 'object' || raw === null) throw new FeedError('meta 格式不正确', 422);

  const src = raw as Record<string, unknown>;
  const out: Partial<IMeta> = {};

  if (src.channel !== undefined) out.channel = requireString(src.channel, 'meta.channel', 40);
  else if (!partial) out.channel = requireString(src.channel, 'meta.channel', 40);

  if (src.type !== undefined) {
    if (!isFeedType(src.type)) throw new FeedError(`未知的类型：${String(src.type)}`, 422);
    out.type = src.type;
  } else if (!partial) {
    out.type = 'other';
  }

  if (src.status !== undefined) {
    if (!isFeedStatus(src.status)) {
      throw new FeedError(`未知的状态：${String(src.status)}`, 422);
    }
    out.status = src.status;
  } else if (!partial) {
    out.status = 'unread';
  }

  if (src.priority !== undefined) {
    if (!isFeedPriority(src.priority)) {
      throw new FeedError(`未知的优先级：${String(src.priority)}`, 422);
    }
    out.priority = src.priority;
  }

  if (src.timestamp !== undefined) {
    const ts = Number(src.timestamp);
    if (!Number.isFinite(ts)) throw new FeedError('meta.timestamp 必须是数字', 422);
    out.timestamp = Math.floor(ts);
  } else if (!partial) {
    out.timestamp = Math.floor(Date.now() / 1000);
  }

  if (src.expirein !== undefined) {
    const exp = Number(src.expirein);
    if (Number.isFinite(exp)) out.expirein = Math.floor(exp);
  }

  return out;
}

function normalizeContent(
  raw: unknown,
  { partial }: { partial: boolean },
): Partial<IContent> | undefined {
  if (raw === undefined) {
    if (partial) return undefined;
    throw new FeedError('content 必填', 422);
  }
  if (typeof raw !== 'object' || raw === null) throw new FeedError('content 格式不正确', 422);

  const src = raw as Record<string, unknown>;
  const out: Partial<IContent> = {};

  if (src.title !== undefined && src.title !== null) {
    out.title =
      String(src.title).trim() === '' ? '' : requireString(src.title, 'content.title', 200);
  }

  for (const field of ['summary', 'body', 'cover'] as const) {
    const value = src[field];
    if (value === undefined) continue;
    const max = field === 'body' ? 20_000 : 500;
    out[field] =
      value === null || value === '' ? '' : requireString(value, `content.${field}`, max);
  }

  const author = src.author;
  if (author !== undefined) {
    if (author === null) out.author = { name: '', avatar: '' };
    else if (typeof author !== 'object') throw new FeedError('content.author 格式不正确', 422);
    else {
      const a = author as Record<string, unknown>;
      out.author = {
        name: optionalString(a.name, 'content.author.name', 60) ?? '',
        avatar: optionalString(a.avatar, 'content.author.avatar', 500) ?? '',
      };
    }
  }

  const tags = normalizeStringArray(src.tags, 'content.tags');
  if (tags !== undefined) out.tags = tags;

  const images = normalizeImageUrls(src.images, 'content.images');
  if (images !== undefined) out.images = images;

  const entities = normalizeStringArray(src.entities, 'content.entities');
  if (entities !== undefined) out.entities = entities;

  return out;
}

export async function createFeed(body: unknown): Promise<FeedDto> {
  await dbConnect();
  if (typeof body !== 'object' || body === null) throw new FeedError('请求体必须是对象', 422);
  const src = body as Record<string, unknown>;

  const meta = normalizeMeta(src.meta, { partial: false });
  const content = normalizeContent(src.content, { partial: false });
  if (!meta.channel || !meta.type || !meta.status || meta.timestamp === undefined) {
    throw new FeedError('meta 字段不完整', 422);
  }
  if (!content?.title && !content?.body && !content?.summary) {
    throw new FeedError('标题、摘要、正文至少填一个', 422);
  }

  const doc = await Feed.create({
    meta: meta as IMeta,
    content: content as IContent,
    extra: (src.extra as Record<string, unknown> | undefined) ?? {},
  });

  return toFeedDto(doc.toObject());
}

export async function updateFeed(id: string, body: unknown): Promise<FeedDto | null> {
  await dbConnect();
  if (typeof body !== 'object' || body === null) throw new FeedError('请求体必须是对象', 422);
  const src = body as Record<string, unknown>;

  const update: Record<string, unknown> = {};
  const meta = normalizeMeta(src.meta, { partial: true });
  for (const [key, value] of Object.entries(meta)) {
    if (value !== undefined) update[`meta.${key}`] = value;
  }

  const content = normalizeContent(src.content, { partial: true });
  for (const [key, value] of Object.entries(content ?? {})) {
    update[`content.${key}`] = value;
  }

  if (src.extra !== undefined) update.extra = src.extra;

  if (Object.keys(update).length === 0) throw new FeedError('没有需要更新的字段', 422);

  const doc = await Feed.findByIdAndUpdate(toObjectId(id), { $set: update }, { new: true })
    .lean()
    .exec();

  return doc ? toFeedDto(doc as unknown as StoredDoc) : null;
}

export async function removeFeed(id: string, hard = false): Promise<void> {
  await dbConnect();
  const objectId = toObjectId(id);
  if (hard) {
    const res = await Feed.findByIdAndDelete(objectId).lean().exec();
    if (!res) throw new FeedError('动态不存在', 404);
    return;
  }
  const res = await Feed.updateOne(
    { _id: objectId, 'meta.status': { $ne: 'deleted' } },
    { $set: { 'meta.status': 'deleted' } },
  );
  if (res.matchedCount === 0) throw new FeedError('动态不存在或已删除', 404);
}

export async function restoreFeed(id: string): Promise<FeedDto | null> {
  await dbConnect();
  const doc = await Feed.findOneAndUpdate(
    { _id: toObjectId(id), 'meta.status': 'deleted' },
    { $set: { 'meta.status': 'unread' } },
    { new: true },
  )
    .lean()
    .exec();

  return doc ? toFeedDto(doc as unknown as StoredDoc) : null;
}

export async function setLiked(id: string, viewer: string, liked: boolean) {
  await dbConnect();
  const actor = requireString(viewer, 'viewer', 64);
  const objectId = toObjectId(id);

  if (liked) {
    await Feed.updateOne(
      { _id: objectId, 'meta.status': { $ne: 'deleted' } },
      {
        $push: {
          'interaction.likes': { id: actor, timestamp: Math.floor(Date.now() / 1000) },
        },
      },
    );
  } else {
    await Feed.updateOne({ _id: objectId }, { $pull: { 'interaction.likes': { id: actor } } });
  }

  const doc = await Feed.findById(objectId).select('interaction.likes').lean().exec();
  if (!doc) throw new FeedError('动态不存在', 404);
  return {
    likeCount: doc.interaction.likes.length,
    likedByViewer: doc.interaction.likes.some((log) => log.id === actor),
  };
}

export async function addComment(id: string, viewer: string, body: string) {
  await dbConnect();
  const actor = requireString(viewer, 'viewer', 64);
  const text = requireString(body, 'body', 500);
  const objectId = toObjectId(id);

  await Feed.updateOne(
    { _id: objectId, 'meta.status': { $ne: 'deleted' } },
    {
      $push: {
        'interaction.comments': { id: actor, timestamp: Math.floor(Date.now() / 1000), body: text },
      },
    },
  );

  const doc = await Feed.findById(objectId).select('interaction.comments').lean().exec();
  if (!doc) throw new FeedError('动态不存在', 404);
  return {
    commentCount: doc.interaction.comments.length,
    comments: doc.interaction.comments.slice(-50),
  };
}

export async function recordView(id: string, viewer: string) {
  await dbConnect();
  const actor = requireString(viewer, 'viewer', 64);
  await Feed.updateOne(
    { _id: toObjectId(id), 'interaction.views.id': { $ne: actor } },
    { $push: { 'interaction.views': { id: actor, timestamp: Math.floor(Date.now() / 1000) } } },
  );
}

export async function getFeedOptions(): Promise<FeedOptions> {
  await dbConnect();
  const [channels, tags, types, all, unread] = await Promise.all([
    Feed.aggregate<{ _id: string; count: number }>([
      { $match: { 'meta.status': { $ne: 'deleted' } } },
      { $group: { _id: '$meta.channel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]),
    Feed.aggregate<{ _id: string; count: number }>([
      { $match: { 'meta.status': { $ne: 'deleted' } } },
      { $unwind: '$content.tags' },
      { $group: { _id: '$content.tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 },
    ]),
    Feed.aggregate<{ _id: FeedType; count: number }>([
      { $match: { 'meta.status': { $ne: 'deleted' } } },
      { $group: { _id: '$meta.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Feed.countDocuments({ 'meta.status': { $ne: 'deleted' } }),
    Feed.countDocuments({ 'meta.status': 'unread' }),
  ]);

  return {
    channels: channels.map((c) => ({ value: c._id, label: c._id, count: c.count })),
    tags: tags.map((t) => ({ value: t._id, count: t.count })),
    types: types.map((t) => ({ value: t._id, count: t.count })),
    totals: { all, unread },
  };
}
