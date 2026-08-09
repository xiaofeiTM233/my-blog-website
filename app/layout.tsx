// app/layout.tsx
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import type { Metadata } from 'next';
import 'dayjs/locale/zh-cn';
import './globals.css';
import Layout from '@/components/Layout';

dayjs.locale('zh-cn');

export const metadata: Metadata = {
  title: 'My Blog Website',
  description: '这是一个基于 Next.js 的博客网站',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ConfigProvider locale={zhCN}>
            <Layout>{children}</Layout>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
