'use client';

import { PictureOutlined, UserOutlined } from '@ant-design/icons';
import { App as AntdApp, Avatar, Button, Select, Space, Tooltip, Typography, theme } from 'antd';
import { useState } from 'react';
import { feedsApi } from '@/lib/api/client';
import type { FeedType } from '@/lib/feeds/constants';
import { FEED_TYPE_META, FEED_TYPES } from '@/lib/feeds/constants';
import MarkdownEditor from './MarkdownEditor';

interface Props {
  channels: string[];
  onCreated: () => void;
}

const TYPE_OPTIONS = FEED_TYPES.map((value) => ({
  value,
  label: FEED_TYPE_META[value].label,
}));

export default function FeedComposer({ channels, onCreated }: Props) {
  const { message } = AntdApp.useApp();
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<string | undefined>(undefined);
  const [type, setType] = useState<FeedType>('activity');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const activeChannel = channel ?? channels[0];

  const reset = () => {
    setTitle('');
    setBody('');
    setTags([]);
    setExpanded(false);
  };

  const submit = async () => {
    const text = body.trim();
    if (!title.trim() && !text) {
      void message.warning('说点什么吧');
      return;
    }
    if (!activeChannel) {
      void message.warning('还没有频道可选，请先在管理台建一条动态');
      return;
    }

    setSubmitting(true);
    try {
      await feedsApi.create({
        meta: { channel: activeChannel, type },
        content: {
          title: title.trim() || undefined,
          body: text || undefined,
          tags,
          author: { name: '我' },
        },
      });
      reset();
      onCreated();
      void message.success('已发布');
    } catch (error) {
      void message.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${expanded ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        padding: '14px 16px 10px',
        marginBottom: 12,
        boxShadow: expanded
          ? `0 0 0 ${token.controlOutlineWidth}px ${token.controlOutline}`
          : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar size={44} icon={<UserOutlined />} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {expanded && (
            <input
              className="composer__title"
              placeholder="添加标题（可选）"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          )}
          <MarkdownEditor
            value={body}
            onChange={setBody}
            editorId="composer"
            compact
            placeholder="有什么新鲜事想分享给大家？支持 Markdown 语法"
            onFocus={() => setExpanded(true)}
          />
        </div>
      </div>

      {expanded && (
        <Space size={8} wrap style={{ marginTop: 8, marginLeft: 56 }}>
          <Select
            size="small"
            style={{ minWidth: 110 }}
            placeholder="频道"
            value={activeChannel}
            onChange={setChannel}
            options={channels.map((value) => ({ value, label: value }))}
            notFoundContent="暂无频道"
            showSearch
          />
          <Select
            size="small"
            style={{ width: 96 }}
            value={type}
            onChange={setType}
            options={TYPE_OPTIONS}
          />
          <Select
            size="small"
            mode="tags"
            style={{ minWidth: 160 }}
            placeholder="# 标签"
            open={false}
            value={tags}
            onChange={setTags}
            tokenSeparators={[',', ' ']}
          />
        </Space>
      )}

      <div
        style={{
          marginTop: 12,
          paddingTop: 8,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Tooltip title="图片上传待接入">
          <Button type="text" size="small" icon={<PictureOutlined />} disabled />
        </Tooltip>

        <div style={{ flex: 1 }} />

        {body.length > 0 && (
          <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 12 }}>
            {body.length} 字
          </Typography.Text>
        )}
        {expanded && (
          <Button type="text" size="small" onClick={reset} style={{ marginRight: 8 }}>
            取消
          </Button>
        )}
        <Button
          type="primary"
          shape="round"
          loading={submitting}
          disabled={!body.trim() && !title.trim()}
          onClick={submit}
        >
          发送
        </Button>
      </div>
    </div>
  );
}
