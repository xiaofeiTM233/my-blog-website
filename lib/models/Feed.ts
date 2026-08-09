// lib/models/Feed.ts
import mongoose, { type Document, type Model, Schema } from 'mongoose';
import {
  FEED_PRIORITIES,
  FEED_STATUSES,
  FEED_TYPES,
  type FeedPriority,
  type FeedStatus,
  type FeedType,
} from '@/lib/feeds/constants';

export interface ILog {
  _id?: string;
  id?: string;
  timestamp: number;
  body?: string;
}

export interface IMeta {
  channel: string;
  type: FeedType;
  status: FeedStatus;
  priority?: FeedPriority;
  timestamp: number;
  expirein?: number;
}

export interface IAuthor {
  name?: string;
  avatar?: string;
}

export interface IContent {
  title?: string;
  summary?: string;
  body?: string;
  author?: IAuthor;
  cover?: string;
  images?: string[];
  tags?: string[];
  entities?: string[];
}

export interface IInteraction {
  views: ILog[];
  likes: ILog[];
  comments: ILog[];
}

export interface IFeed {
  meta: IMeta;
  content: IContent;
  interaction: IInteraction;
  extra?: Record<string, unknown>;
}

export interface IFeedDoc extends IFeed, Document {
  _id: mongoose.Types.ObjectId;
}

const LogSchema = new Schema<ILog>({
  id: String,
  timestamp: { type: Number, required: true },
  body: String,
});

const MetaSchema = new Schema<IMeta>(
  {
    channel: { type: String, required: true },
    type: { type: String, enum: FEED_TYPES, required: true },
    status: { type: String, enum: FEED_STATUSES, required: true },
    priority: { type: String, enum: FEED_PRIORITIES, default: 'normal' },
    timestamp: { type: Number, required: true },
    expirein: Number,
  },
  { _id: false },
);

const AuthorSchema = new Schema<IAuthor>({ name: String, avatar: String }, { _id: false });

const ContentSchema = new Schema<IContent>(
  {
    title: String,
    summary: String,
    body: String,
    author: { type: AuthorSchema, default: () => ({}) },
    cover: String,
    images: [String],
    tags: [String],
    entities: [String],
  },
  { _id: false },
);

const InteractionSchema = new Schema<IInteraction>(
  {
    views: { type: [LogSchema], default: [], required: true },
    likes: { type: [LogSchema], default: [], required: true },
    comments: { type: [LogSchema], default: [], required: true },
  },
  { _id: false },
);

const FeedSchema = new Schema<IFeedDoc>(
  {
    meta: { type: MetaSchema, required: true },
    content: { type: ContentSchema, required: true },
    interaction: {
      type: InteractionSchema,
      required: true,
      default: () => ({ views: [], likes: [], comments: [] }),
    },
    extra: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true, collection: 'feeds' },
);

FeedSchema.index({ 'meta.status': 1, 'meta.timestamp': -1 });
FeedSchema.index({ 'meta.channel': 1 });
FeedSchema.index({ 'meta.type': 1 });
FeedSchema.index({ 'content.tags': 1 });

const Feed: Model<IFeedDoc> = mongoose.models.Feed || mongoose.model<IFeedDoc>('Feed', FeedSchema);
export default Feed;
