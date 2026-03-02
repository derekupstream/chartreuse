import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Badge, Card, Col, Row, Select, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

const fetcher = (url: string) => fetch(url).then(r => r.json());

type RunRow = {
  id: string;
  createdAt: string;
  runType: string;
  status: string;
  orgId: string | null;
  projectId: string | null;
  startedAt: string;
  finishedAt: string | null;
  errorText: string | null;
  org: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  snapshot: { id: string; name: string; status: string } | null;
  _count: { results: number; milestones: number };
};

const STATUS_TAG: Record<string, React.ReactNode> = {
  running: (
    <Tag icon={<LoadingOutlined />} color='processing'>
      running
    </Tag>
  ),
  success: (
    <Tag icon={<CheckCircleOutlined />} color='success'>
      success
    </Tag>
  ),
  failed: (
    <Tag icon={<CloseCircleOutlined />} color='error'>
      failed
    </Tag>
  )
};

const RUN_TYPE_COLOR: Record<string, string> = {
  projection: 'blue',
  scenario: 'purple',
  test: 'cyan',
  actuals_ingest: 'green',
  backfill: 'orange'
};

function durationLabel(start: string, end: string | null): string {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

type Props = { user: DashboardUser };

export default function RunHistoryPage({ user }: Props) {
  const [runTypeFilter, setRunTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const params = new URLSearchParams();
  if (runTypeFilter) params.set('runType', runTypeFilter);
  if (statusFilter) params.set('status', statusFilter);

  const { data, isLoading } = useSWR<{ runs: RunRow[]; total: number }>(
    `/api/admin/compute-runs?${params.toString()}`,
    fetcher
  );

  const runs = data?.runs ?? [];
  const total = data?.total ?? 0;

  const successCount = runs.filter(r => r.status === 'success').length;
  const failedCount = runs.filter(r => r.status === 'failed').length;

  const columns: ColumnsType<RunRow> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string, row: RunRow) => (
        <Link href={`/admin/data-science/runs/${row.id}`}>{new Date(v).toLocaleString()}</Link>
      ),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Type',
      dataIndex: 'runType',
      width: 130,
      render: (t: string) => <Tag color={RUN_TYPE_COLOR[t] ?? 'default'}>{t}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (s: string) => STATUS_TAG[s] ?? <Tag>{s}</Tag>
    },
    {
      title: 'Organization',
      key: 'org',
      render: (_: any, row: RunRow) =>
        row.org ? <Link href={`/admin/orgs/${row.org.id}`}>{row.org.name}</Link> : <Text type='secondary'>—</Text>
    },
    {
      title: 'Project',
      key: 'project',
      render: (_: any, row: RunRow) =>
        row.project ? (
          <Link href={`/projects/${row.project.id}`} target='_blank'>
            {row.project.name}
          </Link>
        ) : (
          <Text type='secondary'>—</Text>
        )
    },
    {
      title: 'Snapshot',
      key: 'snapshot',
      render: (_: any, row: RunRow) =>
        row.snapshot ? (
          <Link href='/admin/data-science/snapshots'>
            <Tag color={row.snapshot.status === 'published' ? 'green' : 'blue'}>{row.snapshot.name}</Tag>
          </Link>
        ) : (
          <Text type='secondary'>—</Text>
        )
    },
    {
      title: 'Outputs',
      key: 'outputs',
      width: 90,
      render: (_: any, row: RunRow) => (
        <Text type='secondary' style={{ fontSize: 12 }}>
          {row._count.results} results, {row._count.milestones} milestones
        </Text>
      )
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 90,
      render: (_: any, row: RunRow) => (
        <Text type='secondary' style={{ fontSize: 12 }}>
          {durationLabel(row.startedAt, row.finishedAt)}
        </Text>
      )
    },
    {
      title: 'Error',
      dataIndex: 'errorText',
      render: (err: string | null) =>
        err ? (
          <Text type='danger' style={{ fontSize: 11 }}>
            {err.length > 60 ? err.slice(0, 60) + '…' : err}
          </Text>
        ) : null
    }
  ];

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          Run History
        </Title>
        <Paragraph type='secondary' style={{ margin: 0 }}>
          Every computation event — projections, scenario runs, test runs, actuals ingestion — is logged here with its
          methodology snapshot and outputs.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title='Total (filtered view)' value={total} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title='Success'
              value={successCount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title='Failed'
              value={failedCount}
              valueStyle={{ color: failedCount > 0 ? '#cf1322' : undefined }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title='Running' value={runs.filter(r => r.status === 'running').length} />
          </Card>
        </Col>
      </Row>

      <Card
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              placeholder='Filter by type'
              allowClear
              style={{ width: 160 }}
              value={runTypeFilter || undefined}
              onChange={v => setRunTypeFilter(v ?? '')}
              options={[
                { value: 'projection', label: 'Projection' },
                { value: 'scenario', label: 'Scenario' },
                { value: 'test', label: 'Test' },
                { value: 'actuals_ingest', label: 'Actuals Ingest' },
                { value: 'backfill', label: 'Backfill' }
              ]}
            />
            <Select
              placeholder='Filter by status'
              allowClear
              style={{ width: 140 }}
              value={statusFilter || undefined}
              onChange={v => setStatusFilter(v ?? '')}
              options={[
                { value: 'success', label: 'Success' },
                { value: 'failed', label: 'Failed' },
                { value: 'running', label: 'Running' }
              ]}
            />
          </div>
        }
      >
        <Table
          dataSource={runs}
          columns={columns}
          rowKey='id'
          loading={isLoading}
          size='small'
          pagination={{ pageSize: 50, showSizeChanger: false, showTotal: t => `${t} runs` }}
          locale={{
            emptyText:
              runs.length === 0 && !isLoading
                ? 'No compute runs logged yet. Runs appear here as projections, scenarios, and test runs are executed.'
                : undefined
          }}
        />
      </Card>
    </>
  );
}

RunHistoryPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/runs' title='Run History'>
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };
  return { props: serializeJSON({ user }) };
};
