import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@ant-design/pro-components',
    '@ant-design/pro-layout',
    '@ant-design/pro-table',
    '@ant-design/pro-form',
    '@ant-design/pro-utils',
    '@ant-design/icons',
    'antd',
  ],
};

export default nextConfig;
