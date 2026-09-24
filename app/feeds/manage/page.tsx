'use client';

import { DeleteOutlined, EditOutlined, RedoOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App as AntdApp, Button, Popconfirm, Tag, Tooltip } from 'antd';
import { useMemo, useRef, useState } from 'react';
import FeedEditorModal from '@/components/feeds/FeedEditorModal';
import { useFeedOptions } from '@/components/feeds/FeedRails';
import { feedsApi } from '@/lib/api/client';
import {
  FEED_PRIORITY_META,
  FEED_STATUS_META,
  FEED_STATUSES,
  FEED_TYPE_META,
  FEED_TYPES,
} from '@/lib/feeds/constants';
import { formatDateTime } from '@/lib/feeds/format';
import type { FeedListItem, FeedListResult } from '@/lib/feeds/types';

const TYPE_VALUE_ENUM = Object.fromEntries(
  FEED_TYPES.map((type) => [
    type,
    { text: FEED_TYPE_META[type].label, status: type === 'security' ? 'Error' : undefined },
  ]),
);

const STATUS_VALUE_ENUM = Object.fromEntries(
  FEED_STATUSES.map((status) => [status, { text: FEED_STATUS_META[status].label }]),
);

export default function FeedsManagePage() {
  const { message } = AntdApp.useApp();
  const actionRef = useRef<ActionType>(null);
  const [editing, setEditing] = useState<FeedListItem | 'create' | null>(null);

  const { data: options } = useFeedOptions();
  const channelValueEnum = useMemo(
    () => Object.fromEntries((options?.channels ?? []).map((c) => [c.value, { text: c.value }])),
    [options],
  );

  const runAction = async (fn: () => Promise<unknown>, successText: string) => {
    try {
      await fn();
      void message.success(successText);
      actionRef.current?.reload();
    } catch (error) {
      void message.error((error as Error).message);
    }
  };

  const columns: ProColumns<FeedListItem>[] = [
    {
      title: '关键字',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '标题 / 正文 / 作者' },
    },
    {
      title: '频道',
      dataIndex: 'channel',
      hideInTable: true,
      valueType: 'select',
      valueEnum: channelValueEnum,
    },
    {
      title: '类型',
      dataIndex: 'type',
      hideInTable: true,
      valueType: 'select',
      valueEnum: TYPE_VALUE_ENUM,
    },
    {
      title: '状态',
      dataIndex: 'status',
      hideInTable: true,
      valueType: 'select',
      valueEnum: STATUS_VALUE_ENUM,
    },
    {
      title: '标题',
      dataIndex: ['content', 'title'],
      search: false,
      ellipsis: true,
      width: 280,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.content.title || '（无标题）'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.content.author?.name || '匿名用户'}
          </div>
        </div>
      ),
    },
    {
      title: '频道',
      dataIndex: ['meta', 'channel'],
      search: false,
      width: 100,
    },
    {
      title: '类型',
      dataIndex: ['meta', 'type'],
      search: false,
      width: 90,
      render: (_, record) => {
        const meta = FEED_TYPE_META[record.meta.type] ?? FEED_TYPE_META.other;
        return (
          <Tag variant="filled" color={meta.color}>
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: ['meta', 'status'],
      search: false,
      width: 90,
      render: (_, record) => (
        <Tag color={FEED_STATUS_META[record.meta.status]?.color}>
          {FEED_STATUS_META[record.meta.status]?.label ?? record.meta.status}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: ['meta', 'priority'],
      search: false,
      width: 90,
      render: (_, record) =>
        record.meta.priority ? (
          <Tag color={FEED_PRIORITY_META[record.meta.priority]?.color}>
            {FEED_PRIORITY_META[record.meta.priority]?.label}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '互动',
      search: false,
      width: 140,
      render: (_, record) => (
        <span style={{ color: '#888', fontSize: 13 }}>
          {record.likeCount} 赞 · {record.commentCount} 评 · {record.viewCount} 浏览
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: ['meta', 'timestamp'],
      search: false,
      width: 120,
      render: (_, record) => formatDateTime(record.meta.timestamp),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => setEditing(record)}
        >
          编辑
        </Button>,
        record.meta.status === 'deleted' ? (
          <Button
            key="restore"
            type="link"
            size="small"
            icon={<RedoOutlined />}
            onClick={() => runAction(() => feedsApi.remove(record._id, 'restore'), '已恢复')}
          >
            恢复
          </Button>
        ) : (
          <Popconfirm
            key="soft"
            title="删除这条动态？"
            description="软删除，可在状态筛选里恢复"
            onConfirm={() => runAction(() => feedsApi.remove(record._id), '已删除')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        ),
        <Popconfirm
          key="hard"
          title="彻底删除？"
          description="直接从数据库移除，不可恢复"
          onConfirm={() => runAction(() => feedsApi.remove(record._id, 'hard'), '已彻底删除')}
        >
          <Tooltip title="彻底删除">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer header={{ title: '动态管理', breadcrumb: {} }}>
      <ProTable<FeedListItem, { keyword?: string }>
        rowKey="_id"
        actionRef={actionRef}
        columns={columns}
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        search={{ labelWidth: 'auto' }}
        headerTitle="动态列表"
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={() => setEditing('create')}>
            新建动态
          </Button>,
        ]}
        request={async (params) => {
          const { current, pageSize, keyword, channel, type, status } = params as {
            current?: number;
            pageSize?: number;
            keyword?: string;
            channel?: string;
            type?: string;
            status?: string;
          };
          try {
            const res: FeedListResult = await feedsApi.list({
              page: current,
              pageSize,
              keyword,
              channel,
              type,
              status,
            });
            return { data: res.list, total: res.pagination.total, success: true };
          } catch (error) {
            void message.error((error as Error).message);
            return { data: [], total: 0, success: false };
          }
        }}
      />

      <FeedEditorModal
        target={editing}
        onClose={() => setEditing(null)}
        onSaved={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
}
