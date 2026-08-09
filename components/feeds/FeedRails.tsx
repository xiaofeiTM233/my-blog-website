'use client';

import { ThunderboltOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Card, Skeleton, Tag, theme } from 'antd';
import { feedKeys, feedsApi } from '@/lib/api/client';

interface RailProps {
  activeChannel: string;
  activeTag: string;
  activeType: string;
  onSelectChannel: (channel: string) => void;
  onSelectTag: (tag: string) => void;
  onSelectType: (type: string) => void;
}

export function useFeedOptions() {
  return useQuery({
    queryKey: feedKeys.options,
    queryFn: () => feedsApi.options(),
    staleTime: 60_000,
  });
}

export function ChannelRail({ activeChannel, onSelectChannel }: RailProps) {
  const { data, isPending } = useFeedOptions();
  const { token } = theme.useToken();

  return (
    <Card
      title="频道"
      size="small"
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: '4px 0' } }}
    >
      {isPending && <Skeleton active paragraph={{ rows: 3 }} style={{ padding: '0 16px' }} />}

      {!isPending && (
        <div>
          {[
            { value: '', label: '全部动态', count: data?.totals.all ?? 0 },
            ...(data?.channels ?? []),
          ].map((item) => {
            const active = activeChannel === item.value;
            return (
              <button
                key={item.value || '__all'}
                type="button"
                onClick={() => onSelectChannel(item.value)}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  width: '100%',
                  cursor: 'pointer',
                  border: 'none',
                  font: 'inherit',
                  textAlign: 'left',
                  padding: '8px 16px',
                  color: active ? token.colorPrimary : token.colorText,
                  background: active ? token.colorFillTertiary : 'transparent',
                  fontWeight: active ? 500 : undefined,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.label || '未分类'}
                </span>
                <span style={{ fontSize: 12, color: token.colorTextTertiary }}>{item.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function StatsRail({ activeTag, onSelectTag }: RailProps) {
  const { data, isPending } = useFeedOptions();
  const { token } = theme.useToken();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card
        title="概览"
        size="small"
        style={{ borderRadius: 12 }}
        extra={<ThunderboltOutlined style={{ color: token.colorPrimary }} />}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: token.colorTextTertiary }}>动态总数</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{data?.totals.all ?? 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: token.colorTextTertiary }}>未读</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{data?.totals.unread ?? 0}</div>
          </div>
        </div>
      </Card>

      <Card
        title="热门标签"
        size="small"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 12 } }}
      >
        {isPending && <Skeleton active paragraph={{ rows: 2 }} />}
        {!isPending && !data?.tags.length && (
          <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>还没有标签</span>
        )}
        {!isPending && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data?.tags.map((tag) => (
              <Tag
                key={tag.value}
                variant={activeTag === tag.value ? 'solid' : 'filled'}
                style={{ cursor: 'pointer', marginInlineEnd: 0 }}
                onClick={() => onSelectTag(activeTag === tag.value ? '' : tag.value)}
              >
                #{tag.value} {tag.count}
              </Tag>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
