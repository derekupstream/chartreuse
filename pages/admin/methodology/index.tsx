import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import { formatDateShort } from 'lib/dates';
import type { PageProps } from 'pages/_app';

type Doc = {
  id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  publishedAt: string | null;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const docs = await prisma.methodologyDocument.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, slug: true, status: true, createdAt: true, publishedAt: true }
  });

  return { props: serializeJSON({ user, docs }) };
};

function AdminMethodologyPage({ docs: initialDocs }: { user: DashboardUser; docs: Doc[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/admin/methodology/${id}`, { method: 'DELETE' });
      message.success('Deleted');
      router.replace(router.asPath);
    } catch {
      message.error('Failed to delete');
    }
  }

  async function togglePublish(doc: Doc) {
    const newStatus = doc.status === 'published' ? 'draft' : 'published';
    try {
      await fetch(`/api/admin/methodology/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      message.success(newStatus === 'published' ? 'Published' : 'Reverted to draft');
      router.replace(router.asPath);
    } catch {
      message.error('Failed to update status');
    }
  }

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, row: Doc) => (
        <a href={`/admin/methodology/${row.id}`}>
          <strong>{title}</strong>
        </a>
      )
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug: string, row: Doc) =>
        row.status === 'published' ? (
          <a href={`/methodology/${slug}`} target='_blank' rel='noreferrer'>
            /methodology/{slug}
          </a>
        ) : (
          <Typography.Text type='secondary'>/methodology/{slug}</Typography.Text>
        )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'published' ? 'green' : 'default'}>{status}</Tag>
    },
    {
      title: 'Last updated',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDateShort(v as any)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, row: Doc) => (
        <Space>
          <Button size='small' onClick={() => togglePublish(row)}>
            {row.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
          <Button size='small' icon={<EditOutlined />} href={`/admin/methodology/${row.id}`} />
          <Popconfirm
            title='Delete this document?'
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
        <Typography.Title level={2} style={{ margin: 0 }}>
          Methodology docs
        </Typography.Title>
        <Button type='primary' icon={<PlusOutlined />} href='/admin/methodology/new'>
          New document
        </Button>
      </div>
      <Table columns={columns} dataSource={initialDocs} rowKey='id' pagination={{ hideOnSinglePage: true }} />
    </>
  );
}

AdminMethodologyPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='admin/methodology' title='Methodology'>
    {page}
  </AdminLayout>
);

export default AdminMethodologyPage;
