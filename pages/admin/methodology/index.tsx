import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { Button, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import { formatDateShort } from 'lib/dates';
import type { PageProps } from 'pages/_app';

type Section = {
  id: string;
  title: string;
  status: string;
  order: number;
  updatedAt: string;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const sections = await prisma.methodologyDocument.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, title: true, status: true, order: true, updatedAt: true }
  });

  return { props: serializeJSON({ user, sections }) };
};

function AdminMethodologyPage({ sections: initial }: { user: DashboardUser; sections: Section[] }) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(initial);
  const [reordering, setReordering] = useState(false);

  async function patchSection(id: string, data: Record<string, any>) {
    await fetch(`/api/admin/methodology/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sections.length) return;
    setReordering(true);
    try {
      const a = sections[index];
      const b = sections[swapIndex];
      await Promise.all([patchSection(a.id, { order: b.order }), patchSection(b.id, { order: a.order })]);
      const updated = [...sections];
      updated[index] = { ...a, order: b.order };
      updated[swapIndex] = { ...b, order: a.order };
      updated.sort((x, y) => x.order - y.order);
      setSections(updated);
    } catch {
      message.error('Reorder failed');
    } finally {
      setReordering(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/admin/methodology/${id}`, { method: 'DELETE' });
      setSections(prev => prev.filter(s => s.id !== id));
      message.success('Subsection deleted');
    } catch {
      message.error('Failed to delete');
    }
  }

  async function handlePublishAll(status: 'published' | 'draft') {
    const targets = sections.filter(s => s.status !== status);
    if (targets.length === 0) {
      message.info(`All subsections are already ${status}`);
      return;
    }
    try {
      await Promise.all(targets.map(s => patchSection(s.id, { status })));
      setSections(prev => prev.map(s => ({ ...s, status })));
      message.success(status === 'published' ? 'All subsections published' : 'All subsections unpublished');
    } catch {
      message.error('Failed to update status');
    }
  }

  const columns: ColumnsType<Section> = [
    {
      title: '#',
      key: 'order',
      width: 48,
      render: (_, __, i) => (
        <Typography.Text type='secondary' style={{ fontSize: 13 }}>
          {i + 1}
        </Typography.Text>
      )
    },
    {
      title: 'Title',
      dataIndex: 'title',
      render: (title: string, row: Section) => (
        <a href={`/admin/methodology/${row.id}`}>
          <strong>{title}</strong>
        </a>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => <Tag color={status === 'published' ? 'green' : 'default'}>{status}</Tag>
    },
    {
      title: 'Last updated',
      dataIndex: 'updatedAt',
      width: 130,
      render: (v: string) => formatDateShort(v as any)
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_, row: Section, i: number) => (
        <Space size={4}>
          <Button
            size='small'
            icon={<ArrowUpOutlined />}
            disabled={i === 0 || reordering}
            onClick={() => handleMove(i, 'up')}
          />
          <Button
            size='small'
            icon={<ArrowDownOutlined />}
            disabled={i === sections.length - 1 || reordering}
            onClick={() => handleMove(i, 'down')}
          />
          <Button size='small' icon={<EditOutlined />} href={`/admin/methodology/${row.id}`} />
          <Popconfirm
            title='Delete this subsection?'
            onConfirm={() => handleDelete(row.id)}
            okText='Delete'
            okButtonProps={{ danger: true }}
          >
            <Button size='small' icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Methodologies
          </Typography.Title>
          <Typography.Text type='secondary' style={{ fontSize: 13 }}>
            Subsections are merged into one public page in the order shown below.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<GlobalOutlined />} href='/methodology' target='_blank' rel='noreferrer'>
            View public page
          </Button>
          <Button type='primary' icon={<PlusOutlined />} href='/admin/methodology/new'>
            Add Subsection
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={sections}
        rowKey='id'
        pagination={false}
        locale={{ emptyText: 'No subsections yet — click "Add Subsection" to get started.' }}
      />

      {sections.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button onClick={() => handlePublishAll('published')}>Publish All</Button>
          <Button onClick={() => handlePublishAll('draft')}>Unpublish All</Button>
        </div>
      )}
    </>
  );
}

AdminMethodologyPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='admin/methodology' title='Methodology'>
    {page}
  </AdminLayout>
);

export default AdminMethodologyPage;
