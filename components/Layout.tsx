// components/Layout.tsx
'use client';

import {
  ControlOutlined,
  EditOutlined,
  SendOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { MenuDataItem } from '@ant-design/pro-components';
import { PageContainer, ProLayout } from '@ant-design/pro-components';
import { App, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const menuData: MenuDataItem[] = [
  { path: '/feeds/index', name: '动态流', icon: <UnorderedListOutlined /> },
  { path: '/editor', name: '写动态', icon: <EditOutlined /> },
  { path: '/feeds/manage', name: '内容管理', icon: <ControlOutlined /> },
];

function BootingShell() {
  return (
    <div
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}
    >
      <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #f0f0f0' }} />
      <div style={{ flex: 1, padding: 24 }}>
        <div
          style={{
            height: 120,
            background: '#fff',
            borderRadius: 16,
            animation: 'boot-pulse 1.4s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <BootingShell />;
  }

  return (
    <ConfigProvider locale={zhCN} theme={{ token: { motion: false } }}>
      <App>
        <div style={{ height: '100vh' }}>
          <ProLayout
            title="My Blog"
            logo={<SendOutlined style={{ fontSize: 22, color: '#1677ff' }} />}
            layout="mix"
            route={{ path: '/', routes: menuData }}
            location={{ pathname }}
            menuItemRender={(item, dom) => (item.path ? <Link href={item.path}>{dom}</Link> : dom)}
          >
            <PageContainer header={{ title: undefined, breadcrumb: undefined }}>
              {children}
            </PageContainer>
          </ProLayout>
        </div>
      </App>
    </ConfigProvider>
  );
}
