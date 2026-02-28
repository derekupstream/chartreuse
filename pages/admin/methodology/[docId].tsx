import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Space, Tag, Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

// TipTap uses browser APIs — load client-side only
const TipTapEditor = dynamic(() => import('components/common/TipTapEditor'), { ssr: false });

type Doc = {
  id: string;
  title: string;
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
  const [content, setContent] = useState<any>(doc?.content ?? null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(doc?.status ?? 'draft');

  async function handleSave(values: { title: string }) {
    setSaving(true);
    try {
      const slug = slugify(values.title) || `subsection-${Date.now()}`;
      const body = { title: values.title, slug, content };

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
        message.success('Subsection created');
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
            {isNew ? 'New subsection' : 'Edit subsection'}
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

      <Form form={form} layout='vertical' initialValues={{ title: doc?.title ?? '' }} onFinish={handleSave}>
        <Card style={{ marginBottom: 16 }}>
          <Form.Item name='title' label='Subsection title' rules={[{ required: true, message: 'Title is required' }]}>
            <Input size='large' placeholder='e.g. Emission Factors' />
          </Form.Item>
        </Card>

        <Card title='Content' bodyStyle={{ padding: 0 }}>
          <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder='Write the methodology for this subsection...'
          />
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
