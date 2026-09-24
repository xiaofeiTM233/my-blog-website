import type {
  ApiEnvelope,
  CreateFeedPayload,
  FeedDetail,
  FeedDto,
  FeedListResult,
  FeedOptions,
  UpdateFeedPayload,
} from '@/lib/feeds/types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(`服务返回了非 JSON 响应 (${res.status})`, res.status);
  }

  if (!res.ok || !payload.success) {
    throw new ApiError(payload.message ?? `请求失败 (${res.status})`, res.status);
  }
  return payload.data as T;
}

export interface FeedQuery {
  page?: number;
  pageSize?: number;
  channel?: string;
  type?: string;
  status?: string;
  priority?: string;
  tag?: string;
  keyword?: string;
}

function toSearch(params: FeedQuery): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    sp.set(key, String(value));
  }
  return sp.toString();
}

export const feedsApi = {
  list: (params: FeedQuery) => request<FeedListResult>(`/api/feeds?${toSearch(params)}`),

  options: () => request<FeedOptions>('/api/feeds/options'),

  detail: (id: string) => request<FeedDetail>(`/api/feeds/${id}`),

  create: (payload: CreateFeedPayload) =>
    request<FeedDto>('/api/feeds', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: UpdateFeedPayload) =>
    request<FeedDto | null>(`/api/feeds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  remove: (id: string, mode: 'soft' | 'hard' | 'restore' = 'soft') =>
    request<unknown>(
      `/api/feeds/${id}${mode === 'restore' ? '?restore=1' : mode === 'hard' ? '?hard=1' : ''}`,
      {
        method: 'DELETE',
      },
    ),

  setLiked: (id: string, liked: boolean) =>
    request<{ likeCount: number; likedByViewer: boolean }>(`/api/feeds/${id}/likes`, {
      method: 'POST',
      body: JSON.stringify({ liked }),
    }),

  comment: (id: string, body: string) =>
    request<{
      commentCount: number;
      comments: { id?: string; timestamp: number; body?: string }[];
    }>(`/api/feeds/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  recordView: (id: string) =>
    request<{ recorded: boolean }>(`/api/feeds/${id}/view`, { method: 'POST' }),
};

export const feedKeys = {
  all: ['feeds'] as const,
  listAll: ['feeds', 'list'] as const,
  list: (params: FeedQuery) => ['feeds', 'list', params] as const,
  options: ['feeds', 'options'] as const,
  detail: (id: string) => ['feeds', 'detail', id] as const,
};
