'use client';

import { App as AntdApp, AutoComplete, Form, Input, Modal, Select, Space } from 'antd';
import { useEffect, useState } from 'react';
import MarkdownEditor from '@/components/editor/MarkdownEditor';
import { feedsApi } from '@/lib/api/client';
import {
  FEED_PRIORITIES,
  FEED_PRIORITY_META,
  FEED_STATUS_META,
  FEED_STATUSES,
  FEED_TYPE_META,
  FEED_TYPES,
  type FeedPriority,
  type FeedStatus,
  type FeedType,
} from '@/lib/feeds/constants';
import type { FeedListItem } from '@/lib/feeds/types';
import { useFeedOptions } from './FeedRails';

interface Props {
  target: FeedListItem | 'create' | null;
  onClose: () => void;
  onSaved: () => void;
}

interface EditValues {
  title?: string;
  summary?: string;
  body?: string;
  channel: string;
  type: FeedType;
  status: FeedStatus;
  priority: FeedPriority;
  tags?: string[];
  images?: string[];
  authorName?: string;
}

export default function FeedEditorModal({ target, onClose, onSaved }: Props) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<EditValues>();
  const [saving, setSaving] = useState(false);
  const { data: options } = useFeedOptions();
  const isCreate = target === 'create';

  useEffect(() => {
    if (!target) return;
    if (isCreate) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      title: target.content.title,
      summary: target.content.summary,
      body: target.content.body,
      channel: target.meta.channel,
      type: target.meta.type,
      status: target.meta.status,
      priority: target.meta.priority ?? 'normal',
      tags: target.content.tags,
      images: target.content.images,
      authorName: target.content.author?.name,
    });
  }, [target, isCreate, form]);

  const submit = async () => {
    if (!target) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        meta: {
          channel: values.channel,
          type: values.type,
          status: values.status,
          priority: values.priority,
        },
        content: {
          title: values.title,
          summary: values.summary,
          body: values.body,
          tags: values.tags,
          images: values.images,
          author: { name: values.authorName },
        },
      };

      if (isCreate) await feedsApi.create(payload);
      else await feedsApi.update(target._id, payload);

      void message.success(isCreate ? '已创建' : '已保存');
      onClose();
      onSaved();
    } catch (error) {
      void message.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(target)}
      title={isCreate ? '新建动态' : '编辑动态'}
      width={680}
      confirmLoading={saving}
      onCancel={onClose}
      onOk={submit}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题">
          <Input placeholder="可选，留空则只显示正文" />
        </Form.Item>
        <Form.Item name="summary" label="摘要">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="body" label="正文" extra="支持 Markdown 语法">
          <MarkdownEditor editorId="manage-body" />
        </Form.Item>
        <Space orientation="vertical" style={{ width: '100%' }} size={0}>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item
              name="channel"
              label="频道"
              style={{ width: 200 }}
              rules={[{ required: true }]}
            >
              <AutoComplete
                options={(options?.channels ?? []).map((c) => ({ value: c.value }))}
                placeholder="选择或输入新频道"
              />
            </Form.Item>
            <Form.Item name="type" label="类型" style={{ width: 140 }}>
              <Select
                options={FEED_TYPES.map((t) => ({ value: t, label: FEED_TYPE_META[t].label }))}
              />
            </Form.Item>
            <Form.Item name="status" label="状态" style={{ width: 140 }}>
              <Select
                options={FEED_STATUSES.map((s) => ({ value: s, label: FEED_STATUS_META[s].label }))}
              />
            </Form.Item>
            <Form.Item name="priority" label="优先级" style={{ width: 140 }}>
              <Select
                options={FEED_PRIORITIES.map((p) => ({
                  value: p,
                  label: FEED_PRIORITY_META[p].label,
                }))}
              />
            </Form.Item>
          </Space>
          <Form.Item name="tags" label="标签">
            <Select
              mode="tags"
              placeholder="回车确认，可自由输入"
              open={false}
              tokenSeparators={[',', ' ']}
            />
          </Form.Item>
          <Form.Item name="images" label="图片链接" extra="每行一个，最多 9 张">
            <Select mode="tags" open={false} tokenSeparators={[',', ' ']} />
          </Form.Item>
          <Form.Item name="authorName" label="作者">
            <Input />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}
