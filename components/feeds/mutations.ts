'use client';

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { feedKeys, feedsApi } from '@/lib/api/client';
import type { FeedDetail, FeedListItem, FeedListResult } from '@/lib/feeds/types';

function patchItem(
  data: InfiniteData<FeedListResult> | undefined,
  id: string,
  patcher: (item: FeedListItem) => FeedListItem,
): InfiniteData<FeedListResult> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      list: page.list.map((item) => (item._id === id ? patcher(item) : item)),
    })),
  };
}

export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) => feedsApi.setLiked(id, liked),
    onMutate: async ({ id, liked }) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.listAll });
      const listSnapshot = queryClient.getQueriesData<InfiniteData<FeedListResult>>({
        queryKey: feedKeys.listAll,
      });
      const detailKey = feedKeys.detail(id);
      const detailSnapshot = queryClient.getQueryData<FeedDetail>(detailKey);

      const shift = (likeCount: number, wasLiked: boolean) =>
        Math.max(0, likeCount + (liked ? 1 : 0) - (wasLiked ? 1 : 0));

      queryClient.setQueriesData<InfiniteData<FeedListResult>>(
        { queryKey: feedKeys.listAll },
        (old) =>
          patchItem(old, id, (item) => ({
            ...item,
            likedByViewer: liked,
            likeCount: shift(item.likeCount, item.likedByViewer),
          })),
      );

      queryClient.setQueryData<FeedDetail>(detailKey, (old) =>
        old
          ? { ...old, likedByViewer: liked, likeCount: shift(old.likeCount, old.likedByViewer) }
          : old,
      );

      return {
        rollback: () => {
          listSnapshot.forEach(([key, data]) => {
            queryClient.setQueryData(key, data);
          });
          if (detailSnapshot) queryClient.setQueryData(detailKey, detailSnapshot);
        },
      };
    },
    onError: (_error, _vars, context) => {
      context?.rollback();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.listAll });
      queryClient.invalidateQueries({ queryKey: ['feeds', 'detail'] });
    },
  });
}

export function useInvalidateFeeds() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: feedKeys.all });
  }, [queryClient]);
}
