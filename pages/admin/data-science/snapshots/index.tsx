import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
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
import { formatDateShort } from 'lib/dates';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

type SnapshotRow = {
  id: string;
  name: string;
  notes: string | null;
  status: string;
  createdAt: string;
  publishedAt: string | null;
  factorVersionCount: number;
};

type ApprovedFV = {
  id: string;
  value: number;
  unit: string;
  status: string;
  notes: string | null;
  factor: { name: string; calculatorConstantKey: string | null };
};

type Props = {
  user: DashboardUser;
  snapshots: SnapshotRow[];
  approvedFactorVersions: ApprovedFV[];
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'blue',
  published: 'green',
  deprecated: 'default'
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  draft: <ClockCircleOutlined />,
  published: <CheckCircleOutlined />,
  deprecated: <MinusCircleOutlined />
};

export default function SnapshotsPage({ user, snapshots: initialSnapshots, approvedFactorVersions }: Props) {
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [factorVersions, setFactorVersions] = useState(approvedFactorVersions);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [form] = Form.useForm();

  const draftCount = snapshots.filter(s => s.status === 'draft').length;
  const publishedCount = snapshots.filter(s => s.status === 'published').length;

  async function handleCreate(values: { name: string; notes?: string; factorVersionIds: string[] }) {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to create snapshot');
      setSnapshots(prev => [
        { ...body.snapshot, factorVersionCount: body.snapshot._count?.factorVersions ?? 0 },
        ...prev
      ]);
      message.success(`Snapshot "${values.name}" created`);
      setCreateOpen(false);
      form.resetFields();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function publish(id: string, name: string) {
    setPublishing(id);
    try {
      const res = await fetch(`/api/admin/snapshots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to publish');
      setSnapshots(prev =>
        prev.map(s => (s.id === id ? { ...s, status: 'published', publishedAt: body.snapshot.publishedAt } : s))
      );
      message.success(`"${name}" published`);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setPublishing(null);
    }
  }

  async function handleBootstrap() {
    setBootstrapping(true);
    try {
      const res = await fetch('/api/admin/factor-versions/bootstrap', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Bootstrap failed');
      message.success(body.message);
      // Reload page to pick up the new factor versions
      window.location.reload();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setBootstrapping(false);
    }
  }

  const columns: ColumnsType<SnapshotRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name: string, row: SnapshotRow) => (
        <Space direction='vertical' size={0}>
          <Text strong>{name}</Text>
          {row.notes && (
            <Text type='secondary' style={{ fontSize: 12 }}>
              {row.notes}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (status: string) => (
        <Tag icon={STATUS_ICON[status]} color={STATUS_COLOR[status]}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Factors',
      dataIndex: 'factorVersionCount',
      width: 90,
      render: (n: number) => <Badge count={n} color='blue' showZero />
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      width: 110,
      render: (v: string) => formatDateShort(v as any)
    },
    {
      title: 'Published',
      dataIndex: 'publishedAt',
      width: 110,
      render: (v: string | null) => (v ? formatDateShort(v as any) : <Text type='secondary'>—</Text>)
    },
    {
      title: '',
      width: 120,
      render: (_: any, row: SnapshotRow) =>
        row.status === 'draft' ? (
          <Button
            size='small'
            type='primary'
            icon={<SafetyCertificateOutlined />}
            loading={publishing === row.id}
            onClick={() => publish(row.id, row.name)}
          >
            Publish
          </Button>
        ) : (
          <Text type='secondary' style={{ fontSize: 12 }}>
            {row.status === 'published' ? 'Active' : 'Archived'}
          </Text>
        )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Methodology Snapshots
          </Title>
          <Paragraph type='secondary' style={{ margin: 0 }}>
            A snapshot bundles a set of approved factor versions so computations can be pinned — preventing silent drift
            when factors change.
          </Paragraph>
        </div>
        <Button type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          New Snapshot
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title='Total' value={snapshots.length} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title='Published' value={publishedCount} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title='Draft' value={draftCount} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title='Factor Versions' value={factorVersions.length} />
          </Card>
        </Col>
      </Row>

      {factorVersions.length === 0 && (
        <Alert
          style={{ marginBottom: 16 }}
          type='warning'
          showIcon
          message='No factor versions found'
          description={
            <span>
              Snapshots require at least one factor version. Click <strong>Bootstrap</strong> to create initial versions
              from your current factor values — this is a one-time setup step.
            </span>
          }
          action={
            <Button size='small' icon={<ThunderboltOutlined />} loading={bootstrapping} onClick={handleBootstrap}>
              Bootstrap
            </Button>
          }
        />
      )}

      <Card
        extra={
          <Tooltip title='All factor versions are eligible to be included in a snapshot'>
            <Text type='secondary' style={{ fontSize: 12 }}>
              {factorVersions.length} factor versions available
            </Text>
          </Tooltip>
        }
      >
        <Table
          dataSource={snapshots}
          columns={columns}
          rowKey='id'
          size='small'
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: 'No snapshots yet. Create one to start pinning your methodology.' }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined />
            Create Methodology Snapshot
          </Space>
        }
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={560}
      >
        <Paragraph type='secondary' style={{ marginBottom: 16 }}>
          Select the approved factor versions that define this methodology. Any computation pinned to this snapshot will
          always use these exact values, even if factors change later.
        </Paragraph>
        <Form form={form} layout='vertical' onFinish={handleCreate}>
          <Form.Item name='name' label='Snapshot Name' rules={[{ required: true, message: 'Name required' }]}>
            <Input placeholder='e.g. v2026-Q1 baseline' />
          </Form.Item>
          <Form.Item name='notes' label='Notes (optional)'>
            <Input.TextArea rows={2} placeholder='What changed or why this snapshot was created' />
          </Form.Item>
          <Form.Item
            name='factorVersionIds'
            label='Factor Versions'
            rules={[{ required: true, message: 'Select at least one factor version' }]}
          >
            <Select
              mode='multiple'
              placeholder='Search and select factor versions...'
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={factorVersions.map(fv => ({
                value: fv.id,
                label: `${fv.factor.name} → ${fv.value} ${fv.unit}${fv.factor.calculatorConstantKey ? ` (${fv.factor.calculatorConstantKey})` : ''} [${fv.status}]`
              }))}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type='primary' htmlType='submit' loading={creating}>
                Create Snapshot
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

SnapshotsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/snapshots' title='Methodology Snapshots'>
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const [rawSnapshots, approvedFactorVersions] = await Promise.all([
    prisma.methodologySnapshot.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { factorVersions: true } } }
    }),
    prisma.factorVersion.findMany({
      orderBy: { createdAt: 'desc' },
      include: { factor: { select: { name: true, calculatorConstantKey: true } } }
    })
  ]);

  const snapshots: SnapshotRow[] = rawSnapshots.map(s => ({
    id: s.id,
    name: s.name,
    notes: s.notes,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    publishedAt: s.publishedAt?.toISOString() ?? null,
    factorVersionCount: s._count.factorVersions
  }));

  return { props: serializeJSON({ user, snapshots, approvedFactorVersions }) };
};
