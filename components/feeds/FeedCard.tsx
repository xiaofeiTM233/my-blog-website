'use client';

import {
  DownOutlined,
  EyeOutlined,
  LikeFilled,
  LikeOutlined,
  MessageOutlined,
  UpOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Divider, theme } from 'antd';
import { useState } from 'react';
import { FEED_TYPE_META } from '@/lib/feeds/constants';
import { formatFeedTime } from '@/lib/feeds/format';
import type { FeedListItem } from '@/lib/feeds/types';
import FeedComments from './FeedComments';
import FeedImages from './FeedImages';

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
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const typeMeta = FEED_TYPE_META[feed.meta.type] ?? FEED_TYPE_META.other;
  const body = feed.content.body ?? feed.content.summary ?? '';
  const needsClamp = body.length > CLAMP_LENGTH;
  const shownBody = needsClamp && !expanded ? `${body.slice(0, CLAMP_LENGTH)}…` : body;

  return (
    <article
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
      </header>

      <div style={{ marginTop: 10 }}>
        {feed.content.title && (
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.6 }}>{feed.content.title}</div>
        )}

        {shownBody && (
          <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {shownBody}
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
    </article>
  );
}
