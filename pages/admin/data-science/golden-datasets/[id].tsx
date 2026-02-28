import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
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

type Props = {
  user: DashboardUser;
  dataset: any;
};

export default function GoldenDatasetDetailPage({ user, dataset }: Props) {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{ passed: boolean; diff: MetricDiff[]; error?: string } | null>(null);

  async function runTest() {
    setRunning(true);
    try {
      const res = await fetch(`/api/admin/datasets/${dataset.id}/run`, { method: 'POST' });
      if (!res.ok) throw new Error('Test failed to execute');
      const data = await res.json();
      setLastResult({
        passed: data.result.passed,
        diff: data.result.diff || [],
        error: data.result.errorMessage
      });
      message.success(data.result.passed ? 'All metrics passed ✓' : 'Some metrics failed — see diff below');
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setRunning(false);
    }
  }

  const failedDiff = lastResult?.diff.filter(d => !d.passed) ?? [];
  const passedDiff = lastResult?.diff.filter(d => d.passed) ?? [];

  const diffColumns: ColumnsType<MetricDiff> = [
    {
      title: 'Metric',
      dataIndex: 'path',
      render: path => (
        <Text code style={{ fontSize: 12 }}>
          {path}
        </Text>
      )
    },
    {
      title: 'Expected',
      dataIndex: 'expected',
      width: 120,
      render: v => v.toLocaleString(undefined, { maximumFractionDigits: 4 })
    },
    {
      title: 'Actual',
      dataIndex: 'actual',
      width: 120,
      render: v => v.toLocaleString(undefined, { maximumFractionDigits: 4 })
    },
    {
      title: 'Δ%',
      dataIndex: 'percentDiff',
      width: 90,
      render: (v, row) => (
        <Tag color={row.passed ? 'success' : 'error'}>{isFinite(v) ? `${(v * 100).toFixed(2)}%` : '∞'}</Tag>
      )
    },
    {
      title: '',
      width: 60,
      render: (_, row) =>
        row.passed ? (
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
        ) : (
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        )
    }
  ];

  const historyColumns: ColumnsType<any> = [
    {
      title: 'Date',
      dataIndex: ['testRun', 'createdAt'],
      render: v => new Date(v).toLocaleString()
    },
    {
      title: 'Result',
      dataIndex: 'passed',
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
      render: diff => {
        const failed = (diff as MetricDiff[] | null)?.filter(d => !d.passed).length ?? 0;
        return failed > 0 ? <Tag color='error'>{failed} metrics</Tag> : <Text type='secondary'>—</Text>;
      }
    }
  ];

  return (
    <AdminLayout title={dataset.name} selectedMenuItem='data-science/golden-datasets' user={user}>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 16 }}>
          <Link href='/admin/data-science/golden-datasets'>
            <Button icon={<ArrowLeftOutlined />} type='text'>
              Back to Golden Datasets
            </Button>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {dataset.name}
            </Title>
            {dataset.description && <Text type='secondary'>{dataset.description}</Text>}
          </div>
          <Button type='primary' icon={<PlayCircleOutlined />} loading={running} onClick={runTest} size='large'>
            Run Test
          </Button>
        </div>

        {lastResult && (
          <Alert
            type={lastResult.passed ? 'success' : 'error'}
            showIcon
            message={
              lastResult.passed
                ? `All ${lastResult.diff.length} metrics passed within ±${(dataset.tolerance * 100).toFixed(1)}% tolerance`
                : `${failedDiff.length} of ${lastResult.diff.length} metrics failed`
            }
            description={lastResult.error}
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card title='Dataset Info'>
              <Descriptions column={1} size='small'>
                <Descriptions.Item label='Category'>
                  <Tag>{dataset.category}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label='Tolerance'>±{(dataset.tolerance * 100).toFixed(1)}%</Descriptions.Item>
                <Descriptions.Item label='Active'>
                  <Badge status={dataset.isActive ? 'success' : 'default'} text={dataset.isActive ? 'Yes' : 'No'} />
                </Descriptions.Item>
                <Descriptions.Item label='Created'>
                  {new Date(dataset.createdAt).toLocaleDateString()}
                </Descriptions.Item>
                {dataset.sourceProjectId && (
                  <Descriptions.Item label='Source Project'>
                    <Link href={`/projects/${dataset.sourceProjectId}/projections`}>View Project</Link>
                  </Descriptions.Item>
                )}
                {dataset.tags?.length > 0 && (
                  <Descriptions.Item label='Tags'>
                    <Space size={4} wrap>
                      {dataset.tags.map((t: string) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            {lastResult && lastResult.diff.length > 0 && (
              <Card
                title={
                  <Space>
                    Test Results
                    <Tag color={lastResult.passed ? 'success' : 'error'}>
                      {passedDiff.length}/{lastResult.diff.length} passed
                    </Tag>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                {failedDiff.length > 0 && (
                  <>
                    <Text strong style={{ color: '#ff4d4f', display: 'block', marginBottom: 8 }}>
                      Failed Metrics
                    </Text>
                    <Table
                      dataSource={failedDiff}
                      columns={diffColumns}
                      rowKey='path'
                      size='small'
                      pagination={false}
                      style={{ marginBottom: 16 }}
                    />
                  </>
                )}
                <Collapse
                  ghost
                  items={[
                    {
                      key: 'passed',
                      label: `Passed metrics (${passedDiff.length})`,
                      children: (
                        <Table
                          dataSource={passedDiff}
                          columns={diffColumns}
                          rowKey='path'
                          size='small'
                          pagination={{ pageSize: 20 }}
                        />
                      )
                    }
                  ]}
                />
              </Card>
            )}

            <Card title='Run History'>
              <Table
                dataSource={dataset.testResults}
                columns={historyColumns}
                rowKey='id'
                size='small'
                pagination={false}
                locale={{ emptyText: 'No test runs yet — click "Run Test" above' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Collapse
              ghost
              items={[
                {
                  key: 'inputs',
                  label: 'Stored Inputs (ProjectInventory)',
                  children: (
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: 16,
                        borderRadius: 4,
                        overflow: 'auto',
                        maxHeight: 400,
                        fontSize: 12
                      }}
                    >
                      {JSON.stringify(dataset.inputs, null, 2)}
                    </pre>
                  )
                },
                {
                  key: 'outputs',
                  label: 'Expected Outputs',
                  children: (
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: 16,
                        borderRadius: 4,
                        overflow: 'auto',
                        maxHeight: 400,
                        fontSize: 12
                      }}
                    >
                      {JSON.stringify(dataset.expectedOutputs, null, 2)}
                    </pre>
                  )
                }
              ]}
            />
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };

  const { id } = context.params as { id: string };

  const dataset = await prisma.goldenDataset.findUnique({
    where: { id },
    include: {
      testResults: {
        orderBy: { testRun: { createdAt: 'desc' } },
        take: 10,
        include: {
          testRun: { select: { id: true, createdAt: true } }
        }
      }
    }
  });

  if (!dataset) return { notFound: true };

  return { props: serializeJSON({ user, dataset }) };
};
