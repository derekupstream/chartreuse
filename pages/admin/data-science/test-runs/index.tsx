import { CheckCircleOutlined, CloseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Statistic, Table, Tag, Typography, message } from 'antd';
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

type Props = {
  user: DashboardUser;
  runs: RunRow[];
  activeDatasetCount: number;
};

export default function TestRunsPage({ user, runs: initialRuns, activeDatasetCount }: Props) {
  const [runs, setRuns] = useState(initialRuns);
  const [running, setRunning] = useState(false);

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
      const newRun = await res.json();
      // Reload to show the new run with results
      window.location.reload();
    } catch (err: any) {
      message.error(err.message);
      setRunning(false);
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

  const columns: ColumnsType<RunRow> = [
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

  return (
    <AdminLayout title='Test Runs' selectedMenuItem='data-science/test-runs' user={user}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Test Runs
            </Title>
            <Text type='secondary'>
              Run all active golden datasets through the live calculator and verify outputs match within tolerance.
            </Text>
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
            columns={columns}
            rowKey='id'
            pagination={{ pageSize: 20 }}
            locale={{ emptyText: 'No test runs yet. Click "Run All Tests" to start.' }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const [rawRuns, activeDatasetCount] = await Promise.all([
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
    prisma.goldenDataset.count({ where: { isActive: true } })
  ]);

  const userIds = Array.from(new Set(rawRuns.map(r => r.ranByUserId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true }
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  const runs = rawRuns.map(r => ({ ...r, ranByName: userMap[r.ranByUserId] || '' }));

  return { props: serializeJSON({ user, runs, activeDatasetCount }) };
};
