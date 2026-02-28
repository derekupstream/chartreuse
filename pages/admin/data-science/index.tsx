import {
  BarChartOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;

const StyledCard = styled(Card)`
  height: 100%;
  .ant-card-body {
    padding: 24px;
  }
  .ant-statistic-title {
    font-size: 14px;
    color: #8c8c8c;
    margin-bottom: 8px;
  }
  .ant-statistic-content {
    font-size: 24px;
    font-weight: 600;
  }
`;

const IconWrapper = styled.div`
  font-size: 48px;
  color: #2bbe50;
  margin-bottom: 16px;
`;

type RecentRun = {
  id: string;
  createdAt: string;
  totalTests: number;
  passed: number;
  failed: number;
  ranByName: string;
};

type Props = {
  user: DashboardUser;
  stats: {
    methodologyCount: number;
    datasetCount: number;
    activeDatasetCount: number;
    testRunCount: number;
    overallPassRate: number | null;
  };
  recentRuns: RecentRun[];
};

export default function DataSciencePage({ user, stats, recentRuns }: Props) {
  const runColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString()
    },
    {
      title: 'Result',
      render: (_: any, row: RecentRun) =>
        row.failed === 0 ? (
          <Tag icon={<CheckCircleOutlined />} color='success'>
            {row.passed}/{row.totalTests} passed
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color='error'>
            {row.failed} failed
          </Tag>
        )
    },
    {
      title: 'By',
      dataIndex: 'ranByName'
    },
    {
      title: '',
      render: (_: any, row: RecentRun) => (
        <Link href={`/admin/data-science/test-runs/${row.id}`}>
          <Button size='small'>View</Button>
        </Link>
      )
    }
  ];

  return (
    <AdminLayout title='Data Science Admin' selectedMenuItem='data-science' user={user}>
      <div style={{ padding: '24px' }}>
        <Title level={2}>Data Science Admin</Title>
        <Paragraph>
          Validate calculation methodologies, inspect hardcoded constants, and run golden dataset regression tests
          against the calculator engine.
        </Paragraph>

        <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <StyledCard>
              <IconWrapper>
                <FileTextOutlined />
              </IconWrapper>
              <Statistic title='Methodologies' value={stats.methodologyCount} suffix='documents' />
              <div style={{ marginTop: '16px' }}>
                <Button type='primary' href='/admin/methodology' block>
                  Manage Methodologies
                </Button>
              </div>
            </StyledCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <StyledCard>
              <IconWrapper>
                <CalculatorOutlined />
              </IconWrapper>
              <Statistic title='Hardcoded Constants' value='All sources' />
              <div style={{ marginTop: '16px' }}>
                <Button href='/admin/data-science/constants' block>
                  View Constants
                </Button>
              </div>
            </StyledCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <StyledCard>
              <IconWrapper>
                <ExperimentOutlined />
              </IconWrapper>
              <Statistic
                title='Golden Datasets'
                value={stats.activeDatasetCount}
                suffix={`/ ${stats.datasetCount} active`}
              />
              <div style={{ marginTop: '16px' }}>
                <Button href='/admin/data-science/golden-datasets' block>
                  Manage Test Data
                </Button>
              </div>
            </StyledCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <StyledCard>
              <IconWrapper>
                <BarChartOutlined />
              </IconWrapper>
              <Statistic title='Test Runs' value={stats.testRunCount} suffix='runs' />
              <div style={{ marginTop: '16px' }}>
                <Button href='/admin/data-science/test-runs' block>
                  View Test Runs
                </Button>
              </div>
            </StyledCard>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
          <Col xs={24} lg={12}>
            <Card
              title='Recent Test Runs'
              extra={
                <Link href='/admin/data-science/test-runs'>
                  <Button>View All</Button>
                </Link>
              }
            >
              <Table
                dataSource={recentRuns}
                columns={runColumns}
                rowKey='id'
                size='small'
                pagination={false}
                locale={{ emptyText: 'No test runs yet' }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title='System Health'>
              <div style={{ padding: '16px 0' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title='Overall Pass Rate'
                      value={stats.overallPassRate != null ? stats.overallPassRate.toFixed(1) : '—'}
                      suffix={stats.overallPassRate != null ? '%' : ''}
                      valueStyle={{
                        color:
                          stats.overallPassRate == null
                            ? undefined
                            : stats.overallPassRate >= 90
                              ? '#3f8600'
                              : '#cf1322'
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic title='Active Datasets' value={stats.activeDatasetCount} />
                  </Col>
                </Row>
                <div style={{ marginTop: 24 }}>
                  <Link href='/admin/data-science/test-runs'>
                    <Button type='primary' block>
                      Run All Tests
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const [methodologyCount, totalDatasets, activeDatasetCount, testRunCount, recentRawRuns] = await Promise.all([
    prisma.methodologyDocument.count(),
    prisma.goldenDataset.count(),
    prisma.goldenDataset.count({ where: { isActive: true } }),
    prisma.testRun.count(),
    prisma.testRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, createdAt: true, totalTests: true, passed: true, failed: true, ranByUserId: true }
    })
  ]);

  // Compute overall pass rate across all test runs
  const allRuns = await prisma.testRun.findMany({
    select: { totalTests: true, passed: true }
  });
  const totalTests = allRuns.reduce((sum, r) => sum + r.totalTests, 0);
  const totalPassed = allRuns.reduce((sum, r) => sum + r.passed, 0);
  const overallPassRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : null;

  // Attach user names to recent runs
  const userIds = Array.from(new Set(recentRawRuns.map(r => r.ranByUserId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true }
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  const recentRuns = recentRawRuns.map(r => ({ ...r, ranByName: userMap[r.ranByUserId] || '' }));

  return {
    props: serializeJSON({
      user,
      stats: { methodologyCount, datasetCount: totalDatasets, activeDatasetCount, testRunCount, overallPassRate },
      recentRuns
    })
  };
};
