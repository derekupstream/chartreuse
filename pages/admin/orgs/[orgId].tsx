import { DownloadOutlined } from '@ant-design/icons';
import type { Account, Org, Project, User } from '@prisma/client';
import { Button, Card, Col, Descriptions, Row, Statistic, Table, Tabs, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import { formatDateShort } from 'lib/dates';
import { requestDownload } from 'lib/files';
import type { PageProps } from 'pages/_app';

interface OrgDetail extends Org {
  users: Pick<User, 'id' | 'name' | 'email' | 'role' | 'createdAt'>[];
  accounts: Pick<Account, 'id' | 'name' | 'createdAt' | 'accountContactEmail'>[];
  projects: Pick<Project, 'id' | 'name' | 'category' | 'createdAt' | 'isTemplate'>[];
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const orgId = context.params?.orgId as string;

  const org = await prisma.org.findUnique({
    where: { id: orgId },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      accounts: { select: { id: true, name: true, createdAt: true, accountContactEmail: true } },
      projects: {
        where: { isTemplate: false },
        select: { id: true, name: true, category: true, createdAt: true, isTemplate: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!org) return { notFound: true };

  return { props: serializeJSON({ user, org }) };
};

const userColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (name: string | null, row: any) => name || <Typography.Text type='secondary'>{row.email}</Typography.Text>
  },
  { title: 'Email', dataIndex: 'email', key: 'email' },
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
    render: (v: string) => formatDateShort(v as any)
  }
];

const projectColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (name: string, row: any) => (
      <a href={`/projects/${row.id}/projections`} target='_blank' rel='noreferrer'>
        {name}
      </a>
    )
  },
  {
    title: 'Category',
    dataIndex: 'category',
    key: 'category',
    render: (cat: string) => <Tag>{cat === 'event' ? 'Event' : 'Projections'}</Tag>
  },
  {
    title: 'Created',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (v: string) => formatDateShort(v as any)
  }
];

const accountColumns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Contact', dataIndex: 'accountContactEmail', key: 'email' },
  {
    title: 'Created',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (v: string) => formatDateShort(v as any)
  }
];

function AdminOrgDetailPage({ user, org }: { user: DashboardUser; org: OrgDetail }) {
  const tabs = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Card title='Organization details'>
              <Descriptions column={1} size='small'>
                <Descriptions.Item label='ID'>
                  <code>{org.id}</code>
                </Descriptions.Item>
                <Descriptions.Item label='Created'>{formatDateShort(org.createdAt as any)}</Descriptions.Item>
                <Descriptions.Item label='Currency'>{org.currency}</Descriptions.Item>
                <Descriptions.Item label='Metric system'>{org.useMetricSystem ? 'Yes' : 'No'}</Descriptions.Item>
                <Descriptions.Item label='Upstream org'>
                  {org.isUpstream ? <Tag color='gold'>Yes</Tag> : 'No'}
                </Descriptions.Item>
                {org.stripeCustomerId && (
                  <Descriptions.Item label='Stripe customer'>{org.stripeCustomerId}</Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={[12, 12]}>
              <Col span={24}>
                <Card>
                  <Statistic title='Users' value={org.users.length} />
                </Card>
              </Col>
              <Col span={24}>
                <Card>
                  <Statistic title='Accounts' value={org.accounts.length} />
                </Card>
              </Col>
              <Col span={24}>
                <Card>
                  <Statistic title='Projects' value={org.projects.length} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      )
    },
    {
      key: 'users',
      label: `Users (${org.users.length})`,
      children: (
        <Card>
          <Table
            columns={userColumns}
            dataSource={org.users}
            rowKey='id'
            pagination={{ hideOnSinglePage: true }}
            size='small'
          />
        </Card>
      )
    },
    {
      key: 'projects',
      label: `Projects (${org.projects.length})`,
      children: (
        <Card>
          <Table
            columns={projectColumns}
            dataSource={org.projects}
            rowKey='id'
            pagination={{ pageSize: 25, hideOnSinglePage: true }}
            size='small'
          />
        </Card>
      )
    },
    {
      key: 'accounts',
      label: `Accounts (${org.accounts.length})`,
      children: (
        <Card>
          <Table
            columns={accountColumns}
            dataSource={org.accounts}
            rowKey='id'
            pagination={{ hideOnSinglePage: true }}
            size='small'
          />
        </Card>
      )
    }
  ];

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
          gap: 8,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <Typography.Text type='secondary'>
            <a href='/admin/orgs'>Organizations</a> /
          </Typography.Text>
          <Typography.Title level={2} style={{ margin: '4px 0 0' }}>
            {org.name}
            {org.isUpstream && (
              <Tag color='gold' style={{ marginLeft: 8, fontSize: 12 }}>
                Upstream
              </Tag>
            )}
          </Typography.Title>
        </div>
        <Button
          icon={<DownloadOutlined />}
          onClick={() =>
            requestDownload({ api: `/api/org/${org.id}/export`, title: `Chart-Reuse Export: ${org.name}` })
          }
        >
          Export data
        </Button>
      </div>

      <Tabs items={tabs} />
    </>
  );
}

AdminOrgDetailPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='admin/orgs' title='Organization Detail'>
    {page}
  </AdminLayout>
);

export default AdminOrgDetailPage;
