// components/Layout.tsx
'use client';

import { SendOutlined } from '@ant-design/icons';
import { PageContainer, ProLayout } from '@ant-design/pro-components';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProLayout
      title="My Blog"
      logo={<SendOutlined style={{ fontSize: 22, color: '#1677ff' }} />}
      layout="mix"
      menuRender={false}
      footerRender={() => (
        <div
          style={{
            textAlign: 'center',
            paddingBlock: 12,
            color: 'rgba(0,0,0,0.45)',
            fontSize: 13,
          }}
        >
          My Blog ©{new Date().getFullYear()}
        </div>
      )}
    >
      <PageContainer>{children}</PageContainer>
    </ProLayout>
  );
}
