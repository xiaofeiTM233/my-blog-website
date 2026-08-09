'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface FeedFilters {
  keyword: string;
  channel: string;
  type: string;
  tag: string;
}

const SEARCH_DEBOUNCE_MS = 400;

export function useFeedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<FeedFilters>(() => {
    return {
      keyword: searchParams.get('keyword') ?? '',
      channel: searchParams.get('channel') ?? '',
      type: searchParams.get('type') ?? '',
      tag: searchParams.get('tag') ?? '',
    };
  }, [searchParams]);

  const [draftKeyword, setDraftKeyword] = useState(filters.keyword);
  const patch = useCallback(
    (next: Partial<FeedFilters>) => {
      const merged = { ...filters, ...next };
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(merged)) {
        if (value) qs.set(key, value);
      }
      const query = qs.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  useEffect(() => {
    setDraftKeyword(filters.keyword);
  }, [filters.keyword]);

  useEffect(() => {
    if (draftKeyword === filters.keyword) return;
    const timer = setTimeout(() => patch({ keyword: draftKeyword }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draftKeyword, filters.keyword, patch]);

  const reset = useCallback(() => {
    setDraftKeyword('');
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    filters,
    draftKeyword,
    setDraftKeyword,
    patch,
    reset,
    isDefault:
      filters.keyword === '' && filters.channel === '' && filters.type === '' && filters.tag === '',
  };
}
