import { ApiOutlined, CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Text } = Typography;

type RspRow = {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  createdAt: string;
  activeKeys: number;
  linkedAccounts: number;
  activePeriods: number;
  lastSubmission: string | null;
};

type Props = {
  user: DashboardUser;
  rsps: RspRow[];
  allOrgs: { id: string; name: string }[];
};

export default function RspDashboard({ user, rsps: initialRsps, allOrgs }: Props) {
  const [rsps, setRsps] = useState(initialRsps);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>();
  const [drawerRsp, setDrawerRsp] = useState<RspRow | null>(null);

  async function handleRegister() {
    if (!selectedOrgId) {
      message.warning('Please select an organization');
      return;
    }
    setRegistering(true);
    try {
      const res = await fetch('/api/admin/rsp/orgs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: selectedOrgId, orgType: 'reuse-service-provider' })
      });
      if (!res.ok) throw new Error('Failed to register RSP');
      const updated = await res.json();
      // Refresh list
      const refreshRes = await fetch('/api/admin/rsp/orgs');
      const newList = await refreshRes.json();
      setRsps(newList);
      message.success(`${updated.name} is now a Reuse Service Provider`);
      setRegisterOpen(false);
      setSelectedOrgId(undefined);
    } catch {
      message.error('Failed to register RSP');
    } finally {
      setRegistering(false);
    }
  }

  const totalPeriods = rsps.reduce((s, r) => s + r.activePeriods, 0);
  const totalClients = rsps.reduce((s, r) => s + r.linkedAccounts, 0);
  const totalKeys = rsps.reduce((s, r) => s + r.activeKeys, 0);

  const columns: ColumnsType<RspRow> = [
    {
      title: 'Organization',
      dataIndex: 'name',
      render: (name, row) => (
        <Button type='link' style={{ padding: 0 }} onClick={() => setDrawerRsp(row)}>
          {name}
        </Button>
      )
    },
    {
      title: 'Location',
      render: (_, r) => (r.city || r.country ? [r.city, r.country].filter(Boolean).join(', ') : '—')
    },
    {
      title: 'Linked Accounts',
      dataIndex: 'linkedAccounts',
      width: 130,
      render: (v: number) => <Badge count={v} showZero color={v > 0 ? '#52c41a' : '#d9d9d9'} />
    },
    {
      title: 'Active Periods',
      dataIndex: 'activePeriods',
      width: 120,
      render: (v: number) => v
    },
    {
      title: 'Active Keys',
      dataIndex: 'activeKeys',
      width: 100,
      render: (v: number) => <Tag color={v > 0 ? 'green' : 'default'}>{v} active</Tag>
    },
    {
      title: 'Last Submission',
      dataIndex: 'lastSubmission',
      width: 140,
      render: (v: string | null) =>
        v ? <Text type='secondary'>{new Date(v).toLocaleDateString()}</Text> : <Text type='secondary'>Never</Text>
    },
    {
      title: '',
      width: 60,
      render: (_, row) => (
        <Button size='small' onClick={() => setDrawerRsp(row)}>
          View
        </Button>
      )
    }
  ];

  const nonRspOrgs = allOrgs.filter(o => !rsps.some(r => r.id === o.id));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            RSP Hub
          </Title>
          <Text type='secondary'>Manage Reusable Service Provider organizations and their API connections.</Text>
        </div>
        <Button type='primary' icon={<PlusOutlined />} onClick={() => setRegisterOpen(true)}>
          Register RSP
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title='RSP Organizations' value={rsps.length} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title='Linked Clients' value={totalClients} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title='Active Periods' value={totalPeriods} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title='Active API Keys' value={totalKeys} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={rsps}
          columns={columns}
          rowKey='id'
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'No RSP organizations yet. Click "Register RSP" to add one.' }}
        />
      </Card>

      {/* Register RSP modal */}
      <Modal
        title={
          <Space>
            <ApiOutlined /> Register Reuse Service Provider
          </Space>
        }
        open={registerOpen}
        onCancel={() => {
          setRegisterOpen(false);
          setSelectedOrgId(undefined);
        }}
        onOk={handleRegister}
        okText='Register as RSP'
        confirmLoading={registering}
        okButtonProps={{ disabled: !selectedOrgId }}
      >
        <Text type='secondary' style={{ display: 'block', marginBottom: 16 }}>
          Select an existing organization to designate as a Reuse Service Provider. This will allow them to generate API
          keys and submit usage data.
        </Text>
        <Select
          showSearch
          placeholder='Search organizations...'
          style={{ width: '100%' }}
          filterOption={(input, opt) =>
            String(opt?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          options={nonRspOrgs.map(o => ({ value: o.id, label: o.name }))}
          value={selectedOrgId}
          onChange={setSelectedOrgId}
        />
      </Modal>

      {/* RSP detail drawer */}
      <Drawer title={drawerRsp?.name} open={!!drawerRsp} onClose={() => setDrawerRsp(null)} width={480}>
        {drawerRsp && (
          <Space direction='vertical' size={16} style={{ width: '100%' }}>
            <Card size='small' title='Summary'>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text type='secondary'>Linked Accounts</Text>
                  <br />
                  <strong>{drawerRsp.linkedAccounts}</strong>
                </Col>
                <Col span={12}>
                  <Text type='secondary'>Active Periods</Text>
                  <br />
                  <strong>{drawerRsp.activePeriods}</strong>
                </Col>
                <Col span={12}>
                  <Text type='secondary'>Active Keys</Text>
                  <br />
                  <strong>{drawerRsp.activeKeys}</strong>
                </Col>
                <Col span={12}>
                  <Text type='secondary'>Last Submission</Text>
                  <br />
                  <strong>
                    {drawerRsp.lastSubmission ? new Date(drawerRsp.lastSubmission).toLocaleDateString() : '—'}
                  </strong>
                </Col>
              </Row>
            </Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <Text type='secondary' style={{ marginLeft: 8 }}>
                RSP registered — manage API keys on the API Keys page
              </Text>
            </div>
          </Space>
        )}
      </Drawer>
    </>
  );
}

RspDashboard.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='rsp' title='RSP Hub'>
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const [rawRsps, allOrgs] = await Promise.all([
    prisma.org.findMany({
      where: { orgType: 'reuse-service-provider' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        createdAt: true,
        _count: {
          select: {
            rspApiKeys: { where: { isActive: true } },
            rspClientAccounts: true,
            usagePeriods: { where: { status: 'active' } }
          }
        }
      }
    }),
    prisma.org.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
  ]);

  const orgIds = rawRsps.map(o => o.id);
  const lastPeriods = await prisma.usageTimePeriod.groupBy({
    by: ['orgId'],
    where: { orgId: { in: orgIds } },
    _max: { createdAt: true }
  });
  const lastMap = Object.fromEntries(lastPeriods.map(p => [p.orgId, p._max.createdAt]));

  const rsps = rawRsps.map(o => ({
    id: o.id,
    name: o.name,
    country: o.country,
    city: o.city,
    createdAt: o.createdAt,
    activeKeys: o._count.rspApiKeys,
    linkedAccounts: o._count.rspClientAccounts,
    activePeriods: o._count.usagePeriods,
    lastSubmission: lastMap[o.id] ?? null
  }));

  return { props: serializeJSON({ user, rsps, allOrgs }) };
};
