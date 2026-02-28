import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  MinusCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
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
  datasets: DatasetRow[];
  projects: Project[];
};

export default function GoldenDatasetsPage({ user, datasets: initialDatasets, projects }: Props) {
  const [datasets, setDatasets] = useState(initialDatasets);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [form] = Form.useForm();

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
    } catch {
      message.error('Failed to update');
    }
  }

  const columns: ColumnsType<DatasetRow> = [
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
    <AdminLayout title='Golden Datasets' selectedMenuItem='data-science/golden-datasets' user={user}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Golden Datasets
            </Title>
            <Text type='secondary'>
              Known-good input/output snapshots used to verify calculator correctness across code changes.
            </Text>
          </div>
          <Button type='primary' icon={<PlusOutlined />} onClick={() => setCaptureOpen(true)}>
            Capture from Project
          </Button>
        </div>

        <Card>
          <Table
            dataSource={datasets}
            columns={columns}
            rowKey='id'
            pagination={{ pageSize: 20 }}
            locale={{ emptyText: 'No datasets yet. Capture one from an existing project.' }}
          />
        </Card>

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
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const [rawDatasets, projects] = await Promise.all([
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

  const datasets = rawDatasets.map(d => ({
    ...d,
    lastResult: d.testResults[0]?.passed ?? null,
    testResults: undefined
  }));

  return { props: serializeJSON({ user, datasets, projects }) };
};
