'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  AutoComplete,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  theme,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { feedKeys, feedsApi } from '@/lib/api/client';
import type { FeedType } from '@/lib/feeds/constants';
import { FEED_TYPE_META, FEED_TYPES } from '@/lib/feeds/constants';
import MarkdownEditor from './MarkdownEditor';

interface FormValues {
  title?: string;
  body?: string;
  channel: string;
  type: FeedType;
  tags?: string[];
}

const TYPE_OPTIONS = FEED_TYPES.map((value) => ({
  value,
  label: FEED_TYPE_META[value].label,
}));

export default function EditorWorkbench() {
  const { token } = theme.useToken();
  const { message } = AntdApp.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);

  const { data: options } = useQuery({
    queryKey: feedKeys.options,
    queryFn: () => feedsApi.options(),
    staleTime: 60_000,
  });

  useEffect(() => {
    const first = options?.channels[0]?.value;
    if (first && !form.getFieldValue('channel')) {
      form.setFieldValue('channel', first);
    }
  }, [options, form]);

  const publish = async () => {
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const text = values.body?.trim() ?? '';
    if (!values.title?.trim() && !text) {
      void message.warning('标题和正文至少写一个');
      return;
    }

    setSaving(true);
    try {
      await feedsApi.create({
        meta: { channel: values.channel, type: values.type },
        content: {
          title: values.title?.trim() || undefined,
          body: text || undefined,
          tags: values.tags,
          author: { name: '我' },
        },
      });
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      void message.success('已发布');
      router.push('/feeds/index');
    } catch (error) {
      void message.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      styles={{ body: { padding: 20 } }}
      title="写动态"
      extra={
        <Space>
          <Button onClick={() => router.push('/feeds/index')}>取消</Button>
          <Button type="primary" loading={saving} onClick={publish}>
            发布
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ type: 'activity' }}
      >
        <Form.Item name="title" label="标题">
          <Input placeholder="可选，留空则只显示正文" maxLength={200} />
        </Form.Item>

        <Form.Item name="body" label="正文">
          <MarkdownEditor editorId="editor-page" height={480} placeholder="支持 Markdown 语法" />
        </Form.Item>

        <Space size={12} wrap style={{ marginTop: token.marginMD }}>
          <Form.Item
            name="channel"
            label="频道"
            style={{ width: 220 }}
            rules={[{ required: true, message: '请选择或输入频道' }]}
          >
            <AutoComplete
              options={(options?.channels ?? []).map((c) => ({ value: c.value }))}
              placeholder="选择或输入新频道"
            />
          </Form.Item>
          <Form.Item name="type" label="类型" style={{ width: 140 }}>
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="tags" label="标签" style={{ minWidth: 260 }}>
            <Select
              mode="tags"
              open={false}
              placeholder="回车确认，可自由输入"
              tokenSeparators={[',', ' ']}
            />
          </Form.Item>
        </Space>
      </Form>
    </Card>
  );
}
