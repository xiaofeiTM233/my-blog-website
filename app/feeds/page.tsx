// app/feeds/page.tsx
'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { useRef } from 'react';
import type { IFeed } from '@/lib/models/Feed';

const typeMap: Record<string, { color: string; text: string }> = {
  system: { color: 'purple', text: '系统' },
  interaction: { color: 'blue', text: '互动' },
  transaction: { color: 'green', text: '交易' },
  security: { color: 'red', text: '安全' },
  activity: { color: 'orange', text: '活动' },
  other: { color: 'default', text: '其他' },
};

const statusMap: Record<string, { color: string; text: string }> = {
  unread: { color: 'processing', text: '未读' },
  read: { color: 'default', text: '已读' },
  deleted: { color: 'error', text: '已删除' },
};

const priorityMap: Record<string, { color: string; text: string }> = {
  low: { color: 'default', text: '低' },
  normal: { color: 'blue', text: '普通' },
  high: { color: 'orange', text: '高' },
  urgent: { color: 'red', text: '紧急' },
};

export default function FeedsPage() {
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<IFeed>[] = [
    {
      title: 'ID',
      dataIndex: '_id',
      width: 200,
      ellipsis: true,
      copyable: true,
    },
    {
      title: '标题',
      dataIndex: ['content', 'title'],
      width: 200,
      ellipsis: true,
    },
    {
      title: '频道',
      dataIndex: ['meta', 'channel'],
      width: 100,
    },
    {
      title: '类型',
      dataIndex: ['meta', 'type'],
      width: 90,
      valueType: 'select',
      valueEnum: {
        system: { text: '系统' },
        interaction: { text: '互动' },
        transaction: { text: '交易' },
        security: { text: '安全' },
        activity: { text: '活动' },
        other: { text: '其他' },
      },
      render: (_, r) => {
        const t = typeMap[r.meta.type] || { color: 'default', text: r.meta.type };
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: ['meta', 'status'],
      width: 90,
      valueType: 'select',
      valueEnum: {
        unread: { text: '未读' },
        read: { text: '已读' },
        deleted: { text: '已删除' },
      },
      render: (_, r) => {
        const s = statusMap[r.meta.status] || { color: 'default', text: r.meta.status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: ['meta', 'priority'],
      width: 80,
      valueType: 'select',
      valueEnum: {
        low: { text: '低' },
        normal: { text: '普通' },
        high: { text: '高' },
        urgent: { text: '紧急' },
      },
      render: (_, r) => {
        if (!r.meta.priority) return '-';
        const p = priorityMap[r.meta.priority] || { color: 'default', text: r.meta.priority };
        return <Tag color={p.color}>{p.text}</Tag>;
      },
    },
    {
      title: '标签',
      dataIndex: ['content', 'tags'],
      width: 180,
      search: false,
      render: (_, r) => (
        <Space size={[0, 4]} wrap>
          {(r.content.tags || []).map((tag: string) => (
            <Tag key={tag} color="blue">
              {tag}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '浏览/评论/点赞',
      search: false,
      width: 180,
      render: (_, r) => (
        <Space size="small">
          <span>👁 {r.interaction.views.length}</span>
          <span>💬 {r.interaction.comments.length}</span>
          <span>❤ {r.interaction.likes.length}</span>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: ['meta', 'timestamp'],
      width: 170,
      valueType: 'dateTime',
      search: false,
      render: (_, r) =>
        r.meta.timestamp ? dayjs.unix(r.meta.timestamp).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  return (
      <ProTable<IFeed>
        headerTitle="动态流"
        actionRef={actionRef}
        rowKey="_id"
        columns={columns}
        search={{ labelWidth: 'auto', span: 6 }}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          const q = new URLSearchParams();
          q.set('page', String(current || 1));
          q.set('pageSize', String(pageSize || 10));
          ['channel', 'type', 'status', 'priority'].forEach((k) => {
            if (rest[k]) q.set(k, String(rest[k]));
          });
          if (rest['content.title']) q.set('keyword', String(rest['content.title']));
          try {
            const res = await fetch(`/api/feeds?${q.toString()}`);
            const json = await res.json();
            if (json.success)
              return { data: json.data.list, success: true, total: json.data.pagination.total };
            return { data: [], success: false, total: 0 };
          } catch {
            return { data: [], success: false, total: 0 };
          }
        }}
      />
  );
}
