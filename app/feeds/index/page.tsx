// app/feeds/index/page.tsx

import { Skeleton } from 'antd';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import FeedsBrowser from '@/components/feeds/FeedsBrowser';

export const metadata: Metadata = {
  title: '动态流',
  description: '按频道聚合的社区动态时间线',
};

export default function FeedsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24, background: '#fff', borderRadius: 12 }}>
          <Skeleton active avatar paragraph={{ rows: 3 }} />
        </div>
      }
    >
      <FeedsBrowser />
    </Suspense>
  );
}
