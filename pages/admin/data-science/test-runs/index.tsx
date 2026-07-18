import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  PlayCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
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
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Text } = Typography;

type RunRow = {
  id: string;
  createdAt: string;
  ranByUserId: string;
  ranByName: string;
  status: string;
  totalTests: number;
  passed: number;
  failed: number;
};

type DatasetRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  tolerance: number;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  sourceProjectId: string | null;
  lastResult: boolean | null;
};

type Project = { id: string; name: string; account: { name: string } };

type Props = {
  user: DashboardUser;
  runs: RunRow[];
  activeDatasetCount: number;
  datasets: DatasetRow[];
  projects: Project[];
};

export default function TestRunsPage({
  user,
  runs: initialRuns,
  activeDatasetCount: initialActiveCount,
  datasets: initialDatasets,
  projects
}: Props) {
  const [runs, setRuns] = useState(initialRuns);
  const [running, setRunning] = useState(false);
  const [activeDatasetCount, setActiveDatasetCount] = useState(initialActiveCount);

  const [datasets, setDatasets] = useState(initialDatasets);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [form] = Form.useForm();

  async function runAll() {
    if (activeDatasetCount === 0) {
      message.warning('No active datasets to test. Enable some datasets first.');
      return;
    }
    setRunning(true);
    try {
      const res = await fetch('/api/admin/test-runs', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Test run failed');
      }
      window.location.reload();
    } catch (err: any) {
      message.error(err.message);
      setRunning(false);
    }
  }

  async function handleCapture(values: any) {
    setCapturing(true);
    try {
      const res = await fetch('/api/admin/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to capture');
      }
      const created = await res.json();
      setDatasets(prev => [{ ...created, lastResult: null }, ...prev]);
      setActiveDatasetCount(c => c + (created.isActive ? 1 : 0));
      message.success(`Dataset "${created.name}" captured`);
      setCaptureOpen(false);
      form.resetFields();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setCapturing(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await fetch(`/api/admin/datasets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });
      setDatasets(prev => prev.map(d => (d.id === id ? { ...d, isActive: !isActive } : d)));
      setActiveDatasetCount(c => c + (isActive ? -1 : 1));
    } catch {
      message.error('Failed to update');
    }
  }

  const passRate =
    runs.length > 0
      ? (
          (runs.reduce((sum, r) => sum + r.passed, 0) /
            Math.max(
              1,
              runs.reduce((sum, r) => sum + r.totalTests, 0)
            )) *
          100
        ).toFixed(1)
      : null;

  const lastRun = runs[0];

  const runColumns: ColumnsType<RunRow> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: v => new Date(v).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Run By',
      dataIndex: 'ranByName',
      render: (name, row) => name || row.ranByUserId
    },
    {
      title: 'Result',
      render: (_, row) =>
        row.failed === 0 ? (
          <Tag icon={<CheckCircleOutlined />} color='success'>
            {row.passed}/{row.totalTests} passed
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color='error'>
            {row.failed}/{row.totalTests} failed
          </Tag>
        )
    },
    {
      title: 'Pass Rate',
      render: (_, row) => {
        const pct = row.totalTests > 0 ? ((row.passed / row.totalTests) * 100).toFixed(0) : '—';
        return `${pct}%`;
      },
      width: 100
    },
    {
      title: '',
      width: 80,
      render: (_, row) => (
        <Link href={`/admin/data-science/test-runs/${row.id}`}>
          <Button size='small'>Details</Button>
        </Link>
      )
    }
  ];

  const datasetColumns: ColumnsType<DatasetRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name, row) => <Link href={`/admin/data-science/golden-datasets/${row.id}`}>{name}</Link>
    },
    {
      title: 'Category',
      dataIndex: 'category',
      render: cat => <Tag>{cat}</Tag>,
      width: 100
    },
    {
      title: 'Last Result',
      dataIndex: 'lastResult',
      width: 110,
      render: result =>
        result === null ? (
          <Text type='secondary'>—</Text>
        ) : result ? (
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
      title: 'Tolerance',
      dataIndex: 'tolerance',
      width: 100,
      render: t => `±${(t * 100).toFixed(1)}%`
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      render: tags => (
        <Space size={[4, 4]} wrap>
          {(tags as string[]).map(t => (
            <Tag key={t}>{t}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      render: (isActive, row) => (
        <Switch size='small' checked={isActive} onChange={() => toggleActive(row.id, isActive)} />
      )
    },
    {
      title: '',
      width: 60,
      render: (_, row) => (
        <Link href={`/admin/data-science/golden-datasets/${row.id}`}>
          <Button size='small'>View</Button>
        </Link>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Test Runs
          </Title>
          <Text type='secondary'>Manage golden datasets and run the calculator test suite to detect regressions.</Text>
        </div>
        <Button
          type='primary'
          icon={<PlayCircleOutlined />}
          onClick={runAll}
          loading={running}
          size='large'
          disabled={activeDatasetCount === 0}
        >
          Run All Tests ({activeDatasetCount})
        </Button>
      </div>

      <Tabs
        defaultActiveKey='runs'
        items={[
          {
            key: 'runs',
            label: (
              <span>
                Test Runs{' '}
                {runs.length > 0 && lastRun?.failed > 0 && (
                  <Badge count={lastRun.failed} size='small' style={{ marginLeft: 4 }} />
                )}
              </span>
            ),
            children: (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic title='Total Runs' value={runs.length} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic title='Active Datasets' value={activeDatasetCount} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title='Overall Pass Rate'
                        value={passRate ?? '—'}
                        suffix={passRate ? '%' : ''}
                        valueStyle={{ color: passRate && Number(passRate) >= 90 ? '#3f8600' : '#cf1322' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title='Last Run'
                        value={lastRun ? (lastRun.failed === 0 ? 'Passed' : 'Failed') : '—'}
                        valueStyle={{
                          color: lastRun ? (lastRun.failed === 0 ? '#3f8600' : '#cf1322') : undefined
                        }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card>
                  <Table
                    dataSource={runs}
                    columns={runColumns}
                    rowKey='id'
                    pagination={{ pageSize: 20 }}
                    locale={{ emptyText: 'No test runs yet. Click "Run All Tests" to start.' }}
                  />
                </Card>
              </>
            )
          },
          {
            key: 'datasets',
            label: `Golden Datasets (${datasets.length})`,
            children: (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: 16
                  }}
                >
                  <Button type='primary' icon={<PlusOutlined />} onClick={() => setCaptureOpen(true)}>
                    Capture from Project
                  </Button>
                </div>
                <Card>
                  <Table
                    dataSource={datasets}
                    columns={datasetColumns}
                    rowKey='id'
                    pagination={{ pageSize: 20 }}
                    locale={{ emptyText: 'No datasets yet. Capture one from an existing project.' }}
                  />
                </Card>
              </>
            )
          }
        ]}
      />

      <Modal
        title={
          <Space>
            <DatabaseOutlined />
            Capture Golden Dataset
          </Space>
        }
        open={captureOpen}
        onCancel={() => {
          setCaptureOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={480}
      >
        <Text type='secondary' style={{ display: 'block', marginBottom: 16 }}>
          This will snapshot the current inputs and run the calculator to capture expected outputs. Future test runs
          will compare against these values.
        </Text>
        <Form form={form} layout='vertical' onFinish={handleCapture}>
          <Form.Item name='projectId' label='Source Project' rules={[{ required: true, message: 'Pick a project' }]}>
            <Select
              showSearch
              placeholder='Search projects...'
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={projects.map(p => ({
                value: p.id,
                label: `${p.account.name} — ${p.name}`
              }))}
            />
          </Form.Item>
          <Form.Item name='name' label='Dataset Name' rules={[{ required: true, message: 'Name required' }]}>
            <Input placeholder='e.g. Event project with dishwasher' />
          </Form.Item>
          <Form.Item name='description' label='Description (optional)'>
            <Input.TextArea rows={2} placeholder='What scenario does this dataset represent?' />
          </Form.Item>
          <Form.Item name='tolerance' label='Tolerance' initialValue={0.02}>
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              formatter={v => `${(Number(v) * 100).toFixed(1)}%`}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCaptureOpen(false)}>Cancel</Button>
              <Button type='primary' htmlType='submit' loading={capturing}>
                Capture Dataset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

TestRunsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/test-runs' title='Test Runs'>
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return ACCESS_DENIED_REDIRECT;

  const [rawRuns, activeDatasetCount, rawDatasets, projects] = await Promise.all([
    prisma.testRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        ranByUserId: true,
        status: true,
        totalTests: true,
        passed: true,
        failed: true
      }
    }),
    prisma.goldenDataset.count({ where: { isActive: true } }),
    prisma.goldenDataset.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        tolerance: true,
        isActive: true,
        tags: true,
        createdAt: true,
        sourceProjectId: true,
        testResults: {
          orderBy: { testRun: { createdAt: 'desc' } },
          take: 1,
          select: { passed: true }
        }
      }
    }),
    prisma.project.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, account: { select: { name: true } } }
    })
  ]);

  const userIds = Array.from(new Set(rawRuns.map(r => r.ranByUserId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true }
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  const runs = rawRuns.map(r => ({ ...r, ranByName: userMap[r.ranByUserId] || '' }));

  const datasets = rawDatasets.map(d => ({
    ...d,
    lastResult: d.testResults[0]?.passed ?? null,
    testResults: undefined
  }));

  return { props: serializeJSON({ user, runs, activeDatasetCount, datasets, projects }) };
};
