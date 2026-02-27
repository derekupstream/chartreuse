import { LoginOutlined, SearchOutlined } from '@ant-design/icons';
import type { Org, User } from '@prisma/client';
import { Button, Card, Input, Table, Tag, Tooltip, Typography, message } from 'antd';
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
import type { PageProps } from 'pages/_app';

type UserWithOrg = User & { org: Pick<Org, 'id' | 'name' | 'isUpstream'> };

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { org: { select: { id: true, name: true, isUpstream: true } } }
  });

  return { props: serializeJSON({ user, users }) };
};

function AdminUsersPage({ users }: { user: DashboardUser; users: UserWithOrg[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name ?? '').toLowerCase().includes(q) ||
      u.org.name.toLowerCase().includes(q)
    );
  });

  async function handleImpersonate(targetUserId: string) {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      router.push('/projects');
    } catch (err: any) {
      message.error(err.message ?? 'Failed to impersonate user');
    }
  }

  const columns: ColumnType<UserWithOrg>[] = [
    {
      title: 'Name',
      key: 'name',
      render: (_: any, u: UserWithOrg) => u.name || <Typography.Text type='secondary'>—</Typography.Text>
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Organization',
      key: 'org',
      render: (_: any, u: UserWithOrg) => <a href={`/admin/orgs/${u.org.id}`}>{u.org.name}</a>
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag>{role}</Tag>
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      defaultSortOrder: 'descend',
      sorter: (a: UserWithOrg, b: UserWithOrg) => (a.createdAt < b.createdAt ? -1 : 1),
      render: (v: string) => formatDateShort(v as any)
    },
    {
      title: '',
      key: 'actions',
      render: (_: any, u: UserWithOrg) =>
        u.org.isUpstream ? null : (
          <Tooltip title='Login as this user'>
            <Button size='small' icon={<LoginOutlined />} onClick={() => handleImpersonate(u.id)}>
              Login as
            </Button>
          </Tooltip>
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
          Users{' '}
          <Typography.Text type='secondary' style={{ fontSize: 16 }}>
            ({filtered.length})
          </Typography.Text>
        </Typography.Title>
        <Input
          placeholder='Search by name, email, or org'
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
      </div>
      <Card>
        {/* @ts-ignore */}
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey='id'
          pagination={{ pageSize: 50, hideOnSinglePage: true }}
          size='small'
        />
      </Card>
    </>
  );
}

AdminUsersPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='admin/users' title='Users'>
    {page}
  </AdminLayout>
);

export default AdminUsersPage;
