'use client';

import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EllipsisOutlined,
  EyeOutlined,
  LikeFilled,
  LikeOutlined,
  MessageOutlined,
  ShareAltOutlined,
  UpOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { App as AntdApp, Avatar, Button, Divider, Dropdown, theme } from 'antd';
import { useState } from 'react';
import { feedsApi } from '@/lib/api/client';
import { FEED_TYPE_META } from '@/lib/feeds/constants';
import { formatFeedTime } from '@/lib/feeds/format';
import type { FeedListItem } from '@/lib/feeds/types';
import FeedComments from './FeedComments';
import FeedEditorModal from './FeedEditorModal';
import FeedImages from './FeedImages';
import Markdown from './Markdown';
import { useInvalidateFeeds } from './mutations';

interface Props {
  feed: FeedListItem;
  onToggleLike: (id: string, liked: boolean) => void;
  likePending?: boolean;
}

const CLAMP_LENGTH = 160;

const ACTION_BASE = {
  display: 'inline-flex' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  flex: 1,
  padding: '4px 0',
  border: 'none',
  background: 'transparent',
  font: 'inherit',
  fontSize: 14,
  cursor: 'pointer',
};

const ICON_STYLE = { fontSize: 18 } as const;

export default function FeedCard({ feed, onToggleLike, likePending }: Props) {
  const { token } = theme.useToken();
  const { message, modal } = AntdApp.useApp();
  const invalidateFeeds = useInvalidateFeeds();
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);

  const typeMeta = FEED_TYPE_META[feed.meta.type] ?? FEED_TYPE_META.other;
  const body = feed.content.body ?? feed.content.summary ?? '';
  const needsClamp = body.length > CLAMP_LENGTH;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feeds/index#feed-${feed._id}`);
      void message.success('链接已复制');
    } catch {
      void message.error('浏览器拒绝了剪贴板访问，请手动复制地址栏');
    }
  };

  const confirmDelete = () => {
    modal.confirm({
      title: '删除这条动态？',
      content: '软删除，之后可以在「内容管理」里恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await feedsApi.remove(feed._id);
          invalidateFeeds();
          void message.success('已删除');
        } catch (error) {
          void message.error((error as Error).message);
        }
      },
    });
  };

  const menuItems: MenuProps['items'] = [
    { key: 'edit', icon: <EditOutlined />, label: '编辑' },
    {
      key: 'comments',
      icon: <MessageOutlined />,
      label: showComments ? '收起评论' : '查看评论',
    },
    { key: 'share', icon: <ShareAltOutlined />, label: '复制链接' },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
  ];

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'edit') setEditing(true);
    else if (key === 'comments') setShowComments((prev) => !prev);
    else if (key === 'share') void copyLink();
    else if (key === 'delete') confirmDelete();
  };

  return (
    <article
      id={`feed-${feed._id}`}
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        padding: '14px 16px',
        marginBottom: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <header style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Avatar
          size={42}
          src={feed.content.author?.avatar || undefined}
          icon={!feed.content.author?.avatar ? <UserOutlined /> : undefined}
        />
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {feed.content.author?.name || '匿名用户'}
          </div>
          <div style={{ fontSize: 12, color: token.colorTextTertiary, marginTop: 2 }}>
            {formatFeedTime(feed.meta.timestamp)}
            <span style={{ margin: '0 6px' }}>·</span>
            <span style={{ color: typeMeta.color }}>{typeMeta.label}</span>
          </div>
        </div>
        <Dropdown
          menu={{ items: menuItems, onClick: onMenuClick }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" size="small" icon={<EllipsisOutlined />} />
        </Dropdown>
      </header>

      <div style={{ marginTop: 10 }}>
        {feed.content.title && (
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.6 }}>{feed.content.title}</div>
        )}

        {body && (
          <div style={{ marginTop: 4 }}>
            <div
              className="feed-md"
              style={
                needsClamp && !expanded
                  ? {
                      maxHeight: 140,
                      overflow: 'hidden',
                      WebkitMaskImage: 'linear-gradient(180deg,#000 60%,transparent)',
                      maskImage: 'linear-gradient(180deg,#000 60%,transparent)',
                    }
                  : undefined
              }
            >
              <Markdown source={body} editorId={`feed-${feed._id}`} />
            </div>
            {needsClamp && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                style={{
                  ...ACTION_BASE,
                  flex: 'none',
                  padding: 0,
                  marginLeft: 6,
                  color: token.colorTextTertiary,
                }}
              >
                {expanded ? '收起' : '展开'}
                {expanded ? <UpOutlined /> : <DownOutlined />}
              </button>
            )}
          </div>
        )}
      </div>

      <FeedImages content={feed.content} alt={feed.content.title || '动态配图'} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        <span
          style={{
            fontSize: 12,
            padding: '2px 10px',
            borderRadius: 999,
            color: token.colorPrimary,
            background: token.colorPrimaryBg,
          }}
        >
          {feed.meta.channel}
        </span>
        {(feed.content.tags ?? []).map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 12,
              padding: '2px 10px',
              borderRadius: 999,
              color: token.colorTextSecondary,
              background: token.colorFillTertiary,
            }}
          >
            #{tag}
          </span>
        ))}
      </div>

      <Divider style={{ margin: '12px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 8 }}>
        <span
          style={{
            ...ACTION_BASE,
            cursor: 'default',
            color: token.colorTextTertiary,
          }}
        >
          <EyeOutlined style={ICON_STYLE} />
          {feed.viewCount}
        </span>
        <button
          type="button"
          onClick={() => setShowComments((prev) => !prev)}
          style={{
            ...ACTION_BASE,
            borderLeft: `1px solid ${token.colorBorderSecondary}`,
            color: showComments ? token.colorPrimary : token.colorTextTertiary,
          }}
        >
          <MessageOutlined style={ICON_STYLE} />
          {feed.commentCount}
        </button>
        <button
          type="button"
          disabled={likePending}
          onClick={() => onToggleLike(feed._id, !feed.likedByViewer)}
          style={{
            ...ACTION_BASE,
            borderLeft: `1px solid ${token.colorBorderSecondary}`,
            color: feed.likedByViewer ? token.colorError : token.colorTextTertiary,
          }}
        >
          {feed.likedByViewer ? (
            <LikeFilled style={ICON_STYLE} />
          ) : (
            <LikeOutlined style={ICON_STYLE} />
          )}
          {feed.likeCount}
        </button>
      </div>

      {showComments && <FeedComments feedId={feed._id} />}

      <FeedEditorModal
        target={editing ? feed : null}
        onClose={() => setEditing(false)}
        onSaved={invalidateFeeds}
      />
    </article>
  );
}
