import type { FeedPriority, FeedStatus, FeedType } from '@/lib/feeds/constants';
import type { IContent, IInteraction, IMeta } from '@/lib/models/Feed';

export type { FeedPriority, FeedStatus, FeedType };

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface FeedListItem {
  _id: string;
  meta: IMeta;
  content: IContent;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  likedByViewer: boolean;
}

export interface FeedDetail extends FeedListItem {
  likes: { id?: string; timestamp: number }[];
  comments: { _id?: string; id?: string; timestamp: number; body?: string }[];
  extra?: Record<string, unknown>;
}

export interface FeedDto {
  _id: string;
  meta: IMeta;
  content: IContent;
  interaction: IInteraction;
  extra?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedListResult {
  list: FeedListItem[];
  pagination: Pagination;
}

export interface FeedOptions {
  channels: { value: string; label: string; count: number }[];
  tags: { value: string; count: number }[];
  types: { value: FeedType; count: number }[];
  totals: { all: number; unread: number };
}

export interface FeedMetaInput {
  channel?: string;
  type?: FeedType;
  status?: FeedStatus;
  priority?: FeedPriority;
  timestamp?: number;
  expirein?: number;
}

export interface FeedContentInput {
  title?: string;
  summary?: string;
  body?: string;
  cover?: string;
  images?: string[];
  author?: { name?: string; avatar?: string };
  tags?: string[];
  entities?: string[];
}

export interface CreateFeedPayload {
  meta: FeedMetaInput;
  content: FeedContentInput;
  extra?: Record<string, unknown>;
}

export type UpdateFeedPayload = Partial<CreateFeedPayload>;

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}
