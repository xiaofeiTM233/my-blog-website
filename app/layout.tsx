// app/layout.tsx
import { AntdRegistry } from '@ant-design/nextjs-registry';
import type { Metadata } from 'next';
import './globals.css';
import Layout from '@/components/Layout';
import QueryProvider from '@/components/QueryProvider';

export const metadata: Metadata = {
  title: {
    default: 'My Blog',
    template: '%s · My Blog',
  },
  description: '一个把动态流、文章画廊等多个板块聚合在一起的社区站点',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <QueryProvider>
            <Layout>{children}</Layout>
          </QueryProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
