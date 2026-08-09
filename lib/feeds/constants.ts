export const FEED_TYPES = [
  'system',
  'interaction',
  'transaction',
  'security',
  'activity',
  'other',
] as const;

export const FEED_STATUSES = ['unread', 'read', 'deleted'] as const;

export const FEED_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

export type FeedType = (typeof FEED_TYPES)[number];
export type FeedStatus = (typeof FEED_STATUSES)[number];
export type FeedPriority = (typeof FEED_PRIORITIES)[number];

export const FEED_TYPE_META: Record<FeedType, { label: string; color: string }> = {
  system: { label: '系统', color: '#722ed1' },
  interaction: { label: '互动', color: '#1677ff' },
  transaction: { label: '交易', color: '#52c41a' },
  security: { label: '安全', color: '#ff4d4f' },
  activity: { label: '活动', color: '#fa8c16' },
  other: { label: '其他', color: '#8c8c8c' },
};

export const FEED_STATUS_META: Record<FeedStatus, { label: string; color: string }> = {
  unread: { label: '未读', color: 'processing' },
  read: { label: '已读', color: 'default' },
  deleted: { label: '已删除', color: 'error' },
};

export const FEED_PRIORITY_META: Record<FeedPriority, { label: string; color: string }> = {
  low: { label: '低', color: 'default' },
  normal: { label: '普通', color: 'blue' },
  high: { label: '高', color: 'orange' },
  urgent: { label: '紧急', color: 'red' },
};

export function isFeedType(value: unknown): value is FeedType {
  return typeof value === 'string' && (FEED_TYPES as readonly string[]).includes(value);
}

export function isFeedStatus(value: unknown): value is FeedStatus {
  return typeof value === 'string' && (FEED_STATUSES as readonly string[]).includes(value);
}

export function isFeedPriority(value: unknown): value is FeedPriority {
  return typeof value === 'string' && (FEED_PRIORITIES as readonly string[]).includes(value);
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
