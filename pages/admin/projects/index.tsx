import { ProjectOutlined, SearchOutlined } from '@ant-design/icons';
import { Badge, Card, Input, Radio, Switch, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import { formatDateShort } from 'lib/dates';
import type { PageProps } from 'pages/_app';

const { Title } = Typography;

type ProjectRow = {
  id: string;
  name: string;
  category: string;
  isTemplate: boolean;
  createdAt: string;
  org: { id: string; name: string };
  account: { id: string; name: string } | null;
  tags: { tagId: string; tag: { label: string; color: string } }[];
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

function AdminProjectsPage({ user }: { user: DashboardUser }) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const params = new URLSearchParams();
  if (categoryFilter !== 'all') params.set('category', categoryFilter);
  if (search) params.set('search', search);
  if (showTemplates) params.set('showTemplates', 'true');

  const { data, isLoading } = useSWR<{ projects: ProjectRow[] }>(`/api/admin/projects?${params.toString()}`, fetcher);
  const projects = data?.projects ?? [];

  const columns: ColumnsType<ProjectRow> = [
    {
      title: 'Project',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, row: ProjectRow) => (
        <Link href={`/projects/${row.id}`} target='_blank'>
          <strong>{name}</strong>
        </Link>
      )
    },
    {
      title: 'Organization',
      key: 'org',
      sorter: (a, b) => a.org.name.localeCompare(b.org.name),
      render: (_: any, row: ProjectRow) => <Link href={`/admin/orgs/${row.org.id}`}>{row.org.name}</Link>
    },
    {
      title: 'Type',
      key: 'type',
      width: 120,
      sorter: (a, b) => a.category.localeCompare(b.category),
      render: (_: any, row: ProjectRow) => {
        if (row.isTemplate) return <Tag color='purple'>Template</Tag>;
        if (row.category === 'event') return <Badge color='blue' text='Actuals' />;
        return <Badge color='green' text='Projections' />;
      }
    },
    {
      title: 'Tags',
      key: 'tags',
      render: (_: any, row: ProjectRow) =>
        row.tags.length > 0 ? (
          row.tags.map(t => (
            <Tag key={t.tagId} color={t.tag?.color ?? 'default'} style={{ marginBottom: 2 }}>
              {t.tag?.label}
            </Tag>
          ))
        ) : (
          <Typography.Text type='secondary'>—</Typography.Text>
        )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (v: string) => formatDateShort(v as any)
    }
  ];

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          <ProjectOutlined style={{ marginRight: 8 }} />
          All Projects
          <Typography.Text type='secondary' style={{ fontSize: 14, fontWeight: 400, marginLeft: 8 }}>
            {projects.length.toLocaleString()} projects across all organizations
          </Typography.Text>
        </Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Radio.Group
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            optionType='button'
            buttonStyle='solid'
            size='small'
          >
            <Radio.Button value='all'>All</Radio.Button>
            <Radio.Button value='default'>Projections</Radio.Button>
            <Radio.Button value='event'>Actuals</Radio.Button>
          </Radio.Group>

          <Input
            placeholder='Search by project or org name...'
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Switch size='small' checked={showTemplates} onChange={setShowTemplates} />
            Show templates
          </label>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={projects}
          rowKey='id'
          loading={isLoading}
          size='small'
          pagination={{ pageSize: 50, showSizeChanger: true, showTotal: total => `${total} projects` }}
        />
      </Card>
    </>
  );
}

AdminProjectsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='admin/projects' title='All Projects'>
    {page}
  </AdminLayout>
);

export default AdminProjectsPage;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};
