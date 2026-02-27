import { TeamOutlined, UserOutlined, ProjectOutlined, RiseOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic, Table, Typography } from 'antd';
import type { GetServerSideProps } from 'next';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import { formatDateShort } from 'lib/dates';
import type { PageProps } from 'pages/_app';

interface AdminOverviewData {
  orgCount: number;
  userCount: number;
  projectCount: number;
  recentOrgs: { id: string; name: string; createdAt: string; _count: { users: number; projects: number } }[];
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });

  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const [orgCount, userCount, projectCount, recentOrgs] = await Promise.all([
    prisma.org.count({ where: { isUpstream: false } }),
    prisma.user.count(),
    prisma.project.count({ where: { isTemplate: false } }),
    prisma.org.findMany({
      where: { isUpstream: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        _count: { select: { users: true, projects: true } }
      }
    })
  ]);

  return {
    props: serializeJSON({ user, data: { orgCount, userCount, projectCount, recentOrgs } })
  };
};

const columns = [
  {
    title: 'Organization',
    dataIndex: 'name',
    key: 'name',
    render: (name: string, row: any) => (
      <a href={`/admin/orgs/${row.id}`}>
        <strong>{name}</strong>
      </a>
    )
  },
  {
    title: 'Signed up',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (v: string) => formatDateShort(v as any)
  },
  { title: 'Users', dataIndex: ['_count', 'users'], key: 'users', align: 'right' as const },
  { title: 'Projects', dataIndex: ['_count', 'projects'], key: 'projects', align: 'right' as const }
];

function AdminOverviewPage({ user, data }: { user: DashboardUser; data: AdminOverviewData }) {
  return (
    <>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        Admin Overview
      </Typography.Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title='Organizations' value={data.orgCount} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title='Users' value={data.userCount} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title='Projects' value={data.projectCount} prefix={<ProjectOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title='Avg projects / org'
              value={(data.projectCount / (data.orgCount || 1)).toFixed(1)}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Typography.Title level={4} style={{ marginBottom: 12 }}>
        Recent signups
      </Typography.Title>
      <Card>
        <Table columns={columns} dataSource={data.recentOrgs} rowKey='id' pagination={false} size='small' />
      </Card>
    </>
  );
}

AdminOverviewPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='admin' title='Admin Overview'>
    {page}
  </AdminLayout>
);

export default AdminOverviewPage;
