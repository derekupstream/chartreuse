import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Space, Tag, Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import { SlateEditor } from 'components/common/SlateEditor';
import type { PageProps } from 'pages/_app';

const EMPTY_CONTENT = [{ type: 'paragraph', children: [{ text: '' }] }];

type Doc = {
  id: string;
  title: string;
  slug: string;
  content: any;
  status: string;
  publishedAt: string | null;
};

type Props = {
  user: DashboardUser;
  doc: Doc | null;
  isNew: boolean;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const { docId } = context.params as { docId: string };

  if (docId === 'new') {
    return { props: serializeJSON({ user, doc: null, isNew: true }) };
  }

  const doc = await prisma.methodologyDocument.findUnique({ where: { id: docId } });
  if (!doc) return { notFound: true };

  return { props: serializeJSON({ user, doc, isNew: false }) };
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function AdminMethodologyEditorPage({ doc, isNew }: Props) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [content, setContent] = useState<any>(doc?.content || EMPTY_CONTENT);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(doc?.status ?? 'draft');

  async function handleSave(values: { title: string; slug: string }) {
    setSaving(true);
    try {
      const body = { title: values.title, slug: values.slug, content };

      if (isNew) {
        const res = await fetch('/api/admin/methodology', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to save');
        }
        const created = await res.json();
        message.success('Document created');
        router.replace(`/admin/methodology/${created.id}`);
      } else {
        const res = await fetch(`/api/admin/methodology/${doc!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Failed to save');
        message.success('Saved');
      }
    } catch (e: any) {
      message.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    if (isNew) return;
    const newStatus = status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/methodology/${doc!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
      setStatus(newStatus);
      message.success(newStatus === 'published' ? 'Published' : 'Reverted to draft');
    } catch {
      message.error('Failed to update status');
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} href='/admin/methodology' />
          <Typography.Title level={2} style={{ margin: 0 }}>
            {isNew ? 'New document' : 'Edit document'}
          </Typography.Title>
          {!isNew && <Tag color={status === 'published' ? 'green' : 'default'}>{status}</Tag>}
        </Space>
        <Space>
          {!isNew && <Button onClick={handleTogglePublish}>{status === 'published' ? 'Unpublish' : 'Publish'}</Button>}
          <Button type='primary' icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>
            Save
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout='vertical'
        initialValues={{ title: doc?.title ?? '', slug: doc?.slug ?? '' }}
        onFinish={handleSave}
      >
        <Card style={{ marginBottom: 16 }}>
          <Form.Item name='title' label='Title' rules={[{ required: true, message: 'Title is required' }]}>
            <Input
              size='large'
              placeholder='e.g. Emissions calculations'
              onChange={e => {
                if (isNew) {
                  form.setFieldValue('slug', slugify(e.target.value));
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name='slug'
            label='Slug'
            rules={[
              { required: true, message: 'Slug is required' },
              { pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers, and hyphens only' }
            ]}
            extra={
              form.getFieldValue('slug')
                ? `Public URL: /methodology/${form.getFieldValue('slug')}`
                : 'URL-friendly identifier'
            }
          >
            <Input placeholder='emissions-calculations' />
          </Form.Item>
        </Card>

        <Card title='Content'>
          <SlateEditor value={content} onChange={setContent} />
        </Card>
      </Form>
    </>
  );
}

AdminMethodologyEditorPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='admin/methodology' title='Methodology'>
    {page}
  </AdminLayout>
);

export default AdminMethodologyEditorPage;
