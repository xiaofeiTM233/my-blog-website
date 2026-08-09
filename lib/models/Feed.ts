// lib/models/Feed.ts
import mongoose, { type Document, type Model, Schema } from 'mongoose';

export interface ILog {
  id?: string;
  timestamp: number;
  body?: string;
}

export interface IMeta {
  channel: string;
  type: 'system' | 'interaction' | 'transaction' | 'security' | 'activity' | 'other';
  status: 'unread' | 'read' | 'deleted';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: number;
  expirein?: number;
}

export interface IAuthor {
  name?: string;
  avatar?: string;
}

export interface IContent {
  title: string;
  summary?: string;
  body?: string;
  author?: IAuthor;
  cover?: string;
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

export interface IFeedDoc extends IFeed, Document {}

const LogSchema = new Schema<ILog>(
  {
    id: String,
    timestamp: { type: Number, required: true },
    body: String,
  },
  { _id: false },
);

const MetaSchema = new Schema<IMeta>(
  {
    channel: { type: String, required: true },
    type: {
      type: String,
      enum: ['system', 'interaction', 'transaction', 'security', 'activity', 'other'],
      required: true,
    },
    status: { type: String, enum: ['unread', 'read', 'deleted'], required: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'low' },
    timestamp: { type: Number, required: true },
    expirein: Number,
  },
  { _id: false },
);

const AuthorSchema = new Schema<IAuthor>({ name: String, avatar: String }, { _id: false });

const ContentSchema = new Schema<IContent>(
  {
    title: { type: String, required: true },
    summary: String,
    body: String,
    author: { type: AuthorSchema, default: () => ({}) },
    cover: String,
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
