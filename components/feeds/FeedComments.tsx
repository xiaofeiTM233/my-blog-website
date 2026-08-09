'use client';

import { UserOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntdApp, Avatar, Button, Empty, Input, Skeleton, theme } from 'antd';
import { useEffect, useState } from 'react';
import { feedKeys, feedsApi } from '@/lib/api/client';
import { formatDateTime } from '@/lib/feeds/format';

interface Props {
  feedId: string;
}

export default function FeedComments({ feedId }: Props) {
  const { token } = theme.useToken();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data, isPending } = useQuery({
    queryKey: feedKeys.detail(feedId),
    queryFn: () => feedsApi.detail(feedId),
  });

  useEffect(() => {
    void feedsApi.recordView(feedId).catch(() => undefined);
  }, [feedId]);

  const submit = useMutation({
    mutationFn: (body: string) => feedsApi.comment(feedId, body),
    onSuccess: (result) => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: feedKeys.detail(feedId) });
      queryClient.invalidateQueries({ queryKey: feedKeys.listAll });
      void message.success(`评论已发布，共 ${result.commentCount} 条`);
    },
    onError: (error: Error) => void message.error(error.message),
  });

  const comments = data?.comments ?? [];

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        background: token.colorFillQuaternary,
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          size="small"
          value={draft}
          placeholder="轻敲键盘，发一条有爱的评论吧"
          maxLength={500}
          disabled={submit.isPending}
          onChange={(e) => setDraft(e.target.value)}
          onPressEnter={() => draft.trim() && submit.mutate(draft)}
        />
        <Button
          size="small"
          type="primary"
          shape="round"
          loading={submit.isPending}
          disabled={!draft.trim()}
          onClick={() => submit.mutate(draft)}
        >
          发布
        </Button>
      </div>

      {isPending && <Skeleton active avatar paragraph={false} style={{ marginTop: 12 }} />}

      {!isPending && comments.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="还没有评论"
          style={{ margin: '12px 0 0' }}
        />
      )}

      {!isPending && comments.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {comments.map((comment) => (
            <div
              key={comment._id ?? `${comment.id}-${comment.timestamp}`}
              style={{ display: 'flex', gap: 8, marginBottom: 12 }}
            >
              <Avatar size={28} icon={<UserOutlined />} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: token.colorTextTertiary }}>
                  {comment.id ?? '匿名'} · {formatDateTime(comment.timestamp)}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {comment.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
