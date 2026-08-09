'use client';

import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { App as AntdApp, Button, Col, Input, Row, Tabs, theme } from 'antd';
import { feedKeys, feedsApi } from '@/lib/api/client';
import { FEED_TYPE_META, FEED_TYPES } from '@/lib/feeds/constants';
import FeedComposer from './FeedComposer';
import { ChannelRail, StatsRail } from './FeedRails';
import FeedsStream from './FeedsStream';
import { useInvalidateFeeds, useLikeMutation } from './mutations';
import { useFeedFilters } from './useFeedFilters';

const TAB_ITEMS = [
  { key: 'all', label: '全部' },
  ...FEED_TYPES.map((type) => ({ key: type, label: FEED_TYPE_META[type].label })),
];

export default function FeedsBrowser() {
  const { message } = AntdApp.useApp();
  const { token } = theme.useToken();
  const { filters, draftKeyword, setDraftKeyword, patch, reset, isDefault } = useFeedFilters();
  const likeMutation = useLikeMutation();
  const invalidateFeeds = useInvalidateFeeds();

  const { data: options } = useQuery({
    queryKey: feedKeys.options,
    queryFn: () => feedsApi.options(),
    staleTime: 60_000,
  });

  const channels = (options?.channels ?? []).map((channel) => channel.value);

  const toggleLike = (id: string, liked: boolean) =>
    likeMutation.mutate({ id, liked }, { onError: (error) => void message.error(error.message) });

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={5}>
        <div style={{ position: 'sticky', top: 16 }}>
          <ChannelRail
            activeChannel={filters.channel}
            activeTag={filters.tag}
            activeType={filters.type}
            onSelectChannel={(channel) => patch({ channel })}
            onSelectTag={(tag) => patch({ tag })}
            onSelectType={(type) => patch({ type })}
          />
        </div>
      </Col>

      <Col xs={24} lg={14}>
        <FeedComposer channels={channels} onCreated={invalidateFeeds} />

        <div
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 12,
            padding: '0 12px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Tabs
            activeKey={filters.type || 'all'}
            items={TAB_ITEMS}
            onChange={(key) => patch({ type: key === 'all' ? '' : key })}
            tabBarStyle={{ margin: 0, flex: 1 }}
          />
          <Input
            size="small"
            allowClear
            prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
            placeholder="搜索"
            value={draftKeyword}
            onChange={(e) => setDraftKeyword(e.target.value)}
            onPressEnter={() => patch({ keyword: draftKeyword })}
            style={{ width: 160, marginBottom: 8 }}
          />
        </div>

        {!isDefault && (
          <div style={{ marginBottom: 8, textAlign: 'right' }}>
            <Button type="link" size="small" onClick={reset}>
              清除筛选
            </Button>
          </div>
        )}

        <FeedsStream
          filters={filters}
          pendingLikeId={likeMutation.isPending ? likeMutation.variables?.id : undefined}
          onToggleLike={toggleLike}
        />
      </Col>

      <Col xs={24} lg={5}>
        <div style={{ position: 'sticky', top: 16 }}>
          <StatsRail
            activeChannel={filters.channel}
            activeTag={filters.tag}
            activeType={filters.type}
            onSelectChannel={(channel) => patch({ channel })}
            onSelectTag={(tag) => patch({ tag })}
            onSelectType={(type) => patch({ type })}
          />
        </div>
      </Col>
    </Row>
  );
}
