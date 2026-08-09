'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Alert, Button, Empty, Skeleton, Spin, theme } from 'antd';
import { useCallback, useEffect, useRef } from 'react';
import { type FeedQuery, feedKeys, feedsApi } from '@/lib/api/client';
import FeedCard from './FeedCard';

const PAGE_SIZE = 20;

interface Props {
  filters: FeedQuery;
  onToggleLike: (id: string, liked: boolean) => void;
  pendingLikeId?: string;
}

function ListSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ padding: 16, marginBottom: 12, background: '#fff', borderRadius: 8 }}>
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        </div>
      ))}
    </>
  );
}

export default function FeedsStream({ filters, onToggleLike, pendingLikeId }: Props) {
  const { token } = theme.useToken();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, error, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: feedKeys.list(filters),
      queryFn: ({ pageParam }) =>
        feedsApi.list({ ...filters, page: pageParam, pageSize: PAGE_SIZE }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.pagination.hasMore ? allPages.length + 1 : undefined,
      placeholderData: (previous) => previous,
    });

  const items = data?.pages.flatMap((page) => page.list) ?? [];

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: '240px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  if (isPending) return <ListSkeleton />;

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="动态加载失败"
        description={error.message}
        action={
          <Button size="small" onClick={() => void refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <Empty
        description="还没有符合条件的动态"
        style={{ padding: '64px 0', background: token.colorBgContainer, borderRadius: 8 }}
      />
    );
  }

  return (
    <div>
      {items.map((feed) => (
        <FeedCard
          key={feed._id}
          feed={feed}
          onToggleLike={onToggleLike}
          likePending={pendingLikeId === feed._id}
        />
      ))}

      <div ref={sentinelRef} style={{ padding: '8px 0 24px', textAlign: 'center' }}>
        {isFetchingNextPage ? (
          <Spin description="加载更多…" />
        ) : hasNextPage ? (
          <Button onClick={loadMore}>加载更多</Button>
        ) : (
          <span style={{ color: token.colorTextQuaternary, fontSize: 13 }}>没有更多动态了</span>
        )}
      </div>
    </div>
  );
}
