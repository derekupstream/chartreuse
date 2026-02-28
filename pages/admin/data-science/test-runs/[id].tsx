import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Collapse, Descriptions, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

const { Title, Text } = Typography;

type MetricDiff = {
  path: string;
  expected: number;
  actual: number;
  absoluteDiff: number;
  percentDiff: number;
  passed: boolean;
};

type ResultRow = {
  id: string;
  passed: boolean;
  diff: MetricDiff[] | null;
  errorMessage: string | null;
  dataset: { id: string; name: string; category: string; tolerance: number };
};

type Props = {
  user: DashboardUser;
  run: any;
  ranByName: string;
};

export default function TestRunDetailPage({ user, run, ranByName }: Props) {
  const results: ResultRow[] = run.results || [];
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  const datasetColumns: ColumnsType<ResultRow> = [
    {
      title: 'Dataset',
      dataIndex: ['dataset', 'name'],
      render: (name, row) => <Link href={`/admin/data-science/golden-datasets/${row.dataset.id}`}>{name}</Link>
    },
    {
      title: 'Category',
      dataIndex: ['dataset', 'category'],
      render: cat => <Tag>{cat}</Tag>,
      width: 100
    },
    {
      title: 'Result',
      dataIndex: 'passed',
      width: 100,
      render: p =>
        p ? (
          <Tag icon={<CheckCircleOutlined />} color='success'>
            Pass
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color='error'>
            Fail
          </Tag>
        )
    },
    {
      title: 'Failed Metrics',
      dataIndex: 'diff',
      render: (diff: MetricDiff[] | null) => {
        const failed = diff?.filter(d => !d.passed).length ?? 0;
        return failed > 0 ? (
          <Tag color='error'>{failed} metrics out of tolerance</Tag>
        ) : (
          <Text type='secondary'>—</Text>
        );
      }
    },
    {
      title: 'Error',
      dataIndex: 'errorMessage',
      render: msg =>
        msg ? (
          <Text type='danger' style={{ fontSize: 12 }}>
            {msg}
          </Text>
        ) : null
    }
  ];

  const metricColumns: ColumnsType<MetricDiff> = [
    {
      title: 'Metric Path',
      dataIndex: 'path',
      render: path => (
        <Text code style={{ fontSize: 11 }}>
          {path}
        </Text>
      )
    },
    {
      title: 'Expected',
      dataIndex: 'expected',
      width: 130,
      render: v => v.toLocaleString(undefined, { maximumFractionDigits: 5 })
    },
    {
      title: 'Actual',
      dataIndex: 'actual',
      width: 130,
      render: v => v.toLocaleString(undefined, { maximumFractionDigits: 5 })
    },
    {
      title: 'Δ%',
      dataIndex: 'percentDiff',
      width: 90,
      render: (v, row) => (
        <Tag color={row.passed ? 'success' : 'error'}>{isFinite(v) ? `${(v * 100).toFixed(3)}%` : '∞'}</Tag>
      )
    }
  ];

  const failedResults = results.filter(r => !r.passed);

  return (
    <AdminLayout title='Test Run Detail' selectedMenuItem='data-science/test-runs' user={user}>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 16 }}>
          <Link href='/admin/data-science/test-runs'>
            <Button icon={<ArrowLeftOutlined />} type='text'>
              Back to Test Runs
            </Button>
          </Link>
        </div>

        <Title level={2}>Test Run — {new Date(run.createdAt).toLocaleString()}</Title>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic title='Total Datasets' value={run.totalTests} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic title='Passed' value={passedCount} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title='Failed'
                value={failedCount}
                valueStyle={{ color: failedCount > 0 ? '#cf1322' : undefined }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title='Pass Rate'
                value={run.totalTests > 0 ? ((passedCount / run.totalTests) * 100).toFixed(1) : '—'}
                suffix={run.totalTests > 0 ? '%' : ''}
                valueStyle={{ color: passedCount === run.totalTests ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Descriptions bordered size='small' style={{ marginBottom: 24 }}>
          <Descriptions.Item label='Run By'>{ranByName}</Descriptions.Item>
          <Descriptions.Item label='Status'>
            <Tag color={run.status === 'completed' ? 'success' : 'processing'}>{run.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label='Date'>{new Date(run.createdAt).toLocaleString()}</Descriptions.Item>
        </Descriptions>

        {failedResults.length > 0 && (
          <Alert
            type='error'
            showIcon
            message={`${failedResults.length} dataset(s) failed`}
            description='Review the failed metrics below to identify calculation regressions.'
            style={{ marginBottom: 24 }}
          />
        )}

        <Card title='Results by Dataset' style={{ marginBottom: 24 }}>
          <Table
            dataSource={results}
            columns={datasetColumns}
            rowKey='id'
            size='small'
            pagination={false}
            expandable={{
              rowExpandable: row => (row.diff?.length ?? 0) > 0,
              expandedRowRender: row => {
                const failed = row.diff?.filter(d => !d.passed) ?? [];
                const passed = row.diff?.filter(d => d.passed) ?? [];
                return (
                  <div style={{ padding: '8px 0' }}>
                    {failed.length > 0 && (
                      <>
                        <Text strong style={{ color: '#ff4d4f', display: 'block', marginBottom: 8 }}>
                          Failed Metrics ({failed.length})
                        </Text>
                        <Table
                          dataSource={failed}
                          columns={metricColumns}
                          rowKey='path'
                          size='small'
                          pagination={false}
                          style={{ marginBottom: 12 }}
                        />
                      </>
                    )}
                    <Collapse
                      ghost
                      items={[
                        {
                          key: 'passed',
                          label: `Passed metrics (${passed.length})`,
                          children: (
                            <Table
                              dataSource={passed}
                              columns={metricColumns}
                              rowKey='path'
                              size='small'
                              pagination={{ pageSize: 20 }}
                            />
                          )
                        }
                      ]}
                    />
                  </div>
                );
              }
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };

  const { id } = context.params as { id: string };

  const run = await prisma.testRun.findUnique({
    where: { id },
    include: {
      results: {
        include: {
          dataset: { select: { id: true, name: true, category: true, tolerance: true } }
        }
      }
    }
  });

  if (!run) return { notFound: true };

  const user_record = await prisma.user.findUnique({
    where: { id: run.ranByUserId },
    select: { name: true }
  });

  return { props: serializeJSON({ user, run, ranByName: user_record?.name || run.ranByUserId }) };
};
