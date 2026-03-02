import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  LoadingOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Badge, Button, Card, Col, Descriptions, Row, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

const fetcher = (url: string) => fetch(url).then(r => r.json());

type FactorVersionRow = {
  id: string;
  factorVersionId: string;
  factorVersion: {
    id: string;
    value: number;
    unit: string;
    status: string;
    notes: string | null;
    factor: { name: string; calculatorConstantKey: string | null; unit: string };
  };
};

type MetricResultRow = {
  id: string;
  metricKey: string;
  valueNumeric: number | null;
  units: string;
  computedAt: string;
  factorVersionIdsJson: unknown;
};

type MilestoneRow = {
  id: string;
  label: string | null;
  snapshotDate: string;
  project: { id: string; name: string };
};

type RunDetail = {
  id: string;
  runType: string;
  status: string;
  createdAt: string;
  startedAt: string;
  finishedAt: string | null;
  errorText: string | null;
  metadataJson: unknown;
  org: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  snapshot: {
    id: string;
    name: string;
    notes: string | null;
    status: string;
    publishedAt: string | null;
    factorVersions: FactorVersionRow[];
  } | null;
  results: MetricResultRow[];
  milestones: MilestoneRow[];
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

type Props = { user: DashboardUser };

export default function RunDetailPage({ user }: Props) {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const { data, isLoading } = useSWR<{ run: RunDetail }>(id ? `/api/admin/compute-runs/${id}` : null, fetcher);
  const run = data?.run;

  const factorColumns: ColumnsType<FactorVersionRow> = [
    {
      title: 'Factor',
      key: 'factor',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {r.factorVersion.factor.name}
          </Text>
          {r.factorVersion.factor.calculatorConstantKey && (
            <div>
              <code style={{ fontSize: 10, color: '#888' }}>{r.factorVersion.factor.calculatorConstantKey}</code>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Value',
      key: 'value',
      width: 150,
      render: (_, r) => (
        <Text>
          {r.factorVersion.value.toLocaleString()} {r.factorVersion.unit}
        </Text>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, r) => (
        <Tag color={r.factorVersion.status === 'approved' ? 'green' : 'default'}>{r.factorVersion.status}</Tag>
      )
    },
    {
      title: 'Notes',
      dataIndex: ['factorVersion', 'notes'],
      render: (v: string | null) =>
        v ? (
          <Text type='secondary' style={{ fontSize: 12 }}>
            {v}
          </Text>
        ) : null
    }
  ];

  const metricColumns: ColumnsType<MetricResultRow> = [
    {
      title: 'Metric Key',
      dataIndex: 'metricKey',
      render: (v: string) => <code style={{ fontSize: 11 }}>{v}</code>
    },
    {
      title: 'Value',
      key: 'value',
      width: 160,
      render: (_, r) =>
        r.valueNumeric !== null ? (
          <Text>
            {r.valueNumeric.toLocaleString(undefined, { maximumFractionDigits: 4 })} {r.units}
          </Text>
        ) : (
          <Text type='secondary'>—</Text>
        )
    },
    {
      title: 'Computed',
      dataIndex: 'computedAt',
      width: 140,
      render: (v: string) => new Date(v).toLocaleString()
    }
  ];

  if (isLoading || !run) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <LoadingOutlined style={{ fontSize: 24 }} />
      </div>
    );
  }

  const durationMs = run.finishedAt ? new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime() : null;

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Link href='/admin/data-science/runs'>
          <Button icon={<ArrowLeftOutlined />} size='small' style={{ marginBottom: 16 }}>
            Run History
          </Button>
        </Link>
        <Title level={2} style={{ margin: 0 }}>
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          Compute Run
        </Title>
        <Paragraph type='secondary' style={{ margin: 0 }}>
          Full provenance trace: run → methodology snapshot → factor versions → metric results
        </Paragraph>
      </div>

      {/* Run metadata */}
      <Card style={{ marginBottom: 24 }}>
        <Descriptions size='small' column={3} bordered>
          <Descriptions.Item label='Run ID'>
            <code style={{ fontSize: 11 }}>{run.id.slice(0, 8)}…</code>
          </Descriptions.Item>
          <Descriptions.Item label='Type'>
            <Tag color={RUN_TYPE_COLOR[run.runType] ?? 'default'}>{run.runType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label='Status'>{STATUS_TAG[run.status] ?? <Tag>{run.status}</Tag>}</Descriptions.Item>
          <Descriptions.Item label='Organization'>
            {run.org ? <Link href={`/admin/orgs/${run.org.id}`}>{run.org.name}</Link> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label='Project'>
            {run.project ? (
              <Link href={`/projects/${run.project.id}`} target='_blank'>
                {run.project.name}
              </Link>
            ) : (
              '—'
            )}
          </Descriptions.Item>
          <Descriptions.Item label='Duration'>
            {durationMs !== null ? (durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label='Started'>{new Date(run.startedAt).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label='Finished'>
            {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : '—'}
          </Descriptions.Item>
          {run.errorText && (
            <Descriptions.Item label='Error' span={3}>
              <Text type='danger'>{run.errorText}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Provenance chain: 3 columns */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Snapshot + factor versions */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                Methodology Snapshot
              </Space>
            }
            extra={
              run.snapshot ? (
                <Tag color={run.snapshot.status === 'published' ? 'green' : 'blue'}>{run.snapshot.status}</Tag>
              ) : null
            }
          >
            {run.snapshot ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{run.snapshot.name}</Text>
                  {run.snapshot.notes && (
                    <div>
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        {run.snapshot.notes}
                      </Text>
                    </div>
                  )}
                  {run.snapshot.publishedAt && (
                    <div>
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        Published: {new Date(run.snapshot.publishedAt).toLocaleDateString()}
                      </Text>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 12 }}>
                    <DatabaseOutlined style={{ marginRight: 4 }} />
                    Factor Versions ({run.snapshot.factorVersions.length})
                  </Text>
                </div>
                <Table
                  dataSource={run.snapshot.factorVersions}
                  columns={factorColumns}
                  rowKey='id'
                  size='small'
                  pagination={false}
                  scroll={{ y: 300 }}
                />
              </>
            ) : (
              <Text type='secondary'>No methodology snapshot pinned to this run.</Text>
            )}
          </Card>
        </Col>

        {/* Metric results */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#1890ff' }} />
                Metric Results
                <Badge count={run.results.length} color='blue' showZero />
              </Space>
            }
          >
            {run.results.length > 0 ? (
              <Table
                dataSource={run.results}
                columns={metricColumns}
                rowKey='id'
                size='small'
                pagination={false}
                scroll={{ y: 380 }}
              />
            ) : (
              <Text type='secondary'>No metric results recorded for this run.</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Linked milestones */}
      {run.milestones.length > 0 && (
        <Card
          title={
            <Space>
              <Badge count={run.milestones.length} color='green' />
              Project Milestones
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[12, 12]}>
            {run.milestones.map(m => (
              <Col key={m.id} xs={24} sm={12} md={8}>
                <Card size='small' style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                  <Text strong style={{ fontSize: 13 }}>
                    {m.project.name}
                  </Text>
                  {m.label && (
                    <div>
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        {m.label}
                      </Text>
                    </div>
                  )}
                  <div>
                    <Text type='secondary' style={{ fontSize: 11 }}>
                      {new Date(m.snapshotDate).toLocaleDateString()}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </>
  );
}

RunDetailPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/runs' title='Run Detail'>
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
