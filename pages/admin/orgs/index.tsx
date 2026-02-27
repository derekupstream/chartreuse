import { DeleteOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { Org } from '@prisma/client';
import { Button, Input, Popconfirm, Space, Table, Tag, Tooltip, Typography, message } from 'antd';
import type { ColumnType } from 'antd/lib/table/interface';
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
import { requestDownload } from 'lib/files';
import chartreuseClient from 'lib/chartreuseClient';
import type { PageProps } from 'pages/_app';

export interface OrgSummary extends Org {
  _count: { accounts: number; projects: number; users: number };
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });

  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const orgs = await prisma.org.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { accounts: true, projects: true, users: true } } }
  });

  return { props: serializeJSON({ user, orgs }) };
};

function AdminOrgsPage({ user, orgs }: { user: DashboardUser; orgs: OrgSummary[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  function handleDelete(org: OrgSummary) {
    chartreuseClient
      .deleteOrganization(org.id)
      .then(() => {
        message.success('Organization deleted');
        router.replace(router.asPath);
      })
      .catch(err => message.error((err as Error)?.message));
  }

  const columns: ColumnType<OrgSummary>[] = [
    {
      title: 'Name',
      key: 'name',
      sorter: (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
      render: (_: any, org: OrgSummary) => (
        <a href={`/admin/orgs/${org.id}`}>
          <strong>{org.name}</strong>
        </a>
      )
    },
    {
      title: 'Type',
      key: 'type',
      render: (_: any, org: OrgSummary) => (org.isUpstream ? <Tag color='gold'>Upstream</Tag> : <Tag>Customer</Tag>)
    },
    {
      title: 'Signed up',
      key: 'createdAt',
      align: 'right',
      defaultSortOrder: 'descend',
      sorter: (a, b) => (a.createdAt < b.createdAt ? -1 : 1),
      render: (_: any, org: OrgSummary) => formatDateShort(org.createdAt as any)
    },
    {
      title: 'Accounts',
      dataIndex: ['_count', 'accounts'],
      key: 'accounts',
      align: 'right',
      sorter: (a, b) => a._count.accounts - b._count.accounts
    },
    {
      title: 'Users',
      dataIndex: ['_count', 'users'],
      key: 'users',
      align: 'right',
      sorter: (a, b) => a._count.users - b._count.users
    },
    {
      title: 'Projects',
      dataIndex: ['_count', 'projects'],
      key: 'projects',
      align: 'right',
      sorter: (a, b) => a._count.projects - b._count.projects
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, org: OrgSummary) => (
        <Space>
          <Tooltip title='Export data'>
            <Button
              size='small'
              icon={<DownloadOutlined />}
              onClick={() =>
                requestDownload({ api: `/api/org/${org.id}/export`, title: `Chart-Reuse Export: ${org.name}` })
              }
            />
          </Tooltip>
          {!org.isUpstream && (
            <Popconfirm
              title={<>Delete &quot;{org.name}&quot;? This cannot be undone.</>}
              onConfirm={() => handleDelete(org)}
              okText='Delete'
              okButtonProps={{ danger: true }}
            >
              <Tooltip title='Delete'>
                <Button size='small' icon={<DeleteOutlined />} danger />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8
        }}
      >
        <Typography.Title level={2} style={{ margin: 0 }}>
          Organizations{' '}
          <Typography.Text type='secondary' style={{ fontSize: 16 }}>
            ({filtered.length})
          </Typography.Text>
        </Typography.Title>
        <Space>
          <Input
            placeholder='Search by name'
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              requestDownload({ api: '/api/admin/export?type=users', title: 'Chart-Reuse Export: All Users' })
            }
          >
            Export all users
          </Button>
        </Space>
      </div>
      {/* @ts-ignore */}
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey='id'
        pagination={{ pageSize: 50, hideOnSinglePage: true }}
      />
    </>
  );
}

AdminOrgsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='admin/orgs' title='Organizations'>
    {page}
  </AdminLayout>
);

export default AdminOrgsPage;
