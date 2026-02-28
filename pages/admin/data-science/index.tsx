import {
  BarChartOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Collapse, Row, Statistic, Steps, Table, Tag, Typography } from 'antd';
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

        <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
          <Col span={24}>
            <Collapse
              ghost
              style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 8 }}
              items={[
                {
                  key: 'howto',
                  label: (
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      <QuestionCircleOutlined style={{ marginRight: 8, color: '#2bbe50' }} />
                      How to use the Data Science Admin
                    </span>
                  ),
                  children: (
                    <div style={{ padding: '8px 8px 16px' }}>
                      <Paragraph type='secondary' style={{ marginBottom: 24 }}>
                        This section lets you validate that the Chart-Reuse calculator produces correct results and that
                        the underlying assumptions (emission factors, utility rates, material weights) are accurate and
                        up to date. Here is the recommended workflow:
                      </Paragraph>

                      <Steps
                        direction='vertical'
                        current={-1}
                        items={[
                          {
                            title: (
                              <Link href='/admin/data-science/constants'>
                                <strong>Review the Constants</strong>
                              </Link>
                            ),
                            description: (
                              <div style={{ paddingBottom: 8 }}>
                                <Paragraph style={{ margin: 0 }}>
                                  Start at <Link href='/admin/data-science/constants'>Constants</Link> to see every
                                  hardcoded value the calculator uses: EPA WARM emission factors for each single-use and
                                  reusable material, CO₂ factors for electricity and natural gas, ocean transport
                                  emissions, and commercial utility rates for all 50 states.
                                </Paragraph>
                                <Paragraph type='secondary' style={{ margin: '4px 0 0', fontSize: 13 }}>
                                  If a source value has been updated (e.g. a new EPA WARM release), note the change here
                                  and update the corresponding constant in <code>lib/calculator/constants/</code> with a
                                  code change.
                                </Paragraph>
                              </div>
                            ),
                            icon: <CalculatorOutlined />
                          },
                          {
                            title: (
                              <Link href='/admin/methodology'>
                                <strong>Document the Methodology</strong>
                              </Link>
                            ),
                            description: (
                              <div style={{ paddingBottom: 8 }}>
                                <Paragraph style={{ margin: 0 }}>
                                  Use <Link href='/admin/methodology'>Methodology</Link> to write and publish
                                  plain-language documents explaining <em>why</em> each constant was chosen, which EPA
                                  or industry source it comes from, and any assumptions or simplifications made. These
                                  documents are readable by the whole team and can be published publicly.
                                </Paragraph>
                                <Paragraph type='secondary' style={{ margin: '4px 0 0', fontSize: 13 }}>
                                  Good methodology docs make it easy to audit the calculator and onboard new data
                                  scientists. Write one doc per calculation domain (waste, water, energy, transport,
                                  etc.).
                                </Paragraph>
                              </div>
                            ),
                            icon: <FileTextOutlined />
                          },
                          {
                            title: (
                              <Link href='/admin/data-science/golden-datasets'>
                                <strong>Capture Golden Datasets</strong>
                              </Link>
                            ),
                            description: (
                              <div style={{ paddingBottom: 8 }}>
                                <Paragraph style={{ margin: 0 }}>
                                  A <em>golden dataset</em> is a snapshot of a real project's inputs (what materials,
                                  quantities, dishwashers, labor costs, etc.) paired with the outputs the calculator
                                  produces right now. It becomes the ground truth for future testing.
                                </Paragraph>
                                <Paragraph style={{ margin: '8px 0 0' }}>
                                  Go to <Link href='/admin/data-science/golden-datasets'>Golden Datasets</Link> and
                                  click <strong>Capture from Project</strong>. Pick a representative project from the
                                  dropdown — aim to capture a variety of scenarios:
                                </Paragraph>
                                <ul
                                  style={{
                                    margin: '8px 0 0',
                                    paddingLeft: 20,
                                    color: 'rgba(0,0,0,0.65)',
                                    fontSize: 14
                                  }}
                                >
                                  <li>A simple default project (few single-use items, no dishwasher)</li>
                                  <li>A full default project (dishwasher, labor, waste hauling)</li>
                                  <li>An event project</li>
                                  <li>A project with bottle stations</li>
                                </ul>
                                <Paragraph type='secondary' style={{ margin: '8px 0 0', fontSize: 13 }}>
                                  The default tolerance is ±2%. This means a metric passes if the live calculator
                                  produces a value within 2% of the captured expected value. Tighten this for critical
                                  financial metrics; loosen it for minor environmental estimates.
                                </Paragraph>
                              </div>
                            ),
                            icon: <ExperimentOutlined />
                          },
                          {
                            title: (
                              <Link href='/admin/data-science/test-runs'>
                                <strong>Run Tests After Every Code Change</strong>
                              </Link>
                            ),
                            description: (
                              <div style={{ paddingBottom: 8 }}>
                                <Paragraph style={{ margin: 0 }}>
                                  Whenever a calculation, constant, or formula changes in the codebase, go to{' '}
                                  <Link href='/admin/data-science/test-runs'>Test Runs</Link> and click{' '}
                                  <strong>Run All Tests</strong>. This replays every active golden dataset through the
                                  live calculator and reports which metrics changed and by how much.
                                </Paragraph>
                                <Paragraph style={{ margin: '8px 0 0' }}>
                                  <Tag color='success' icon={<CheckCircleOutlined />}>
                                    Pass
                                  </Tag>{' '}
                                  means the metric is within tolerance — the change is safe.
                                  <br />
                                  <Tag color='error' icon={<CloseCircleOutlined />} style={{ marginTop: 4 }}>
                                    Fail
                                  </Tag>{' '}
                                  means the metric moved outside tolerance — investigate whether it is an intentional
                                  improvement or an unintended regression.
                                </Paragraph>
                                <Paragraph type='secondary' style={{ margin: '8px 0 0', fontSize: 13 }}>
                                  If a failure is <em>intentional</em> (e.g. you updated an emission factor to a newer
                                  source), delete the old golden dataset and capture a fresh one from the same project.
                                  The new snapshot becomes the new ground truth.
                                </Paragraph>
                              </div>
                            ),
                            icon: <BarChartOutlined />
                          },
                          {
                            title: <strong>Interpreting a Failed Test</strong>,
                            description: (
                              <div style={{ paddingBottom: 4 }}>
                                <Paragraph style={{ margin: 0 }}>
                                  Click <strong>Details</strong> on any test run, then expand the failed dataset row to
                                  see a table of every numeric metric with three columns: <em>Expected</em> (the
                                  captured value), <em>Actual</em> (what the live calculator just returned), and{' '}
                                  <em>Δ%</em> (the percentage difference). Only metrics that exceed the tolerance are
                                  flagged as failed — all others are shown collapsed under "Passed metrics."
                                </Paragraph>
                                <Paragraph style={{ margin: '8px 0 0' }}>Common failure patterns:</Paragraph>
                                <ul
                                  style={{
                                    margin: '4px 0 0',
                                    paddingLeft: 20,
                                    color: 'rgba(0,0,0,0.65)',
                                    fontSize: 14
                                  }}
                                >
                                  <li>
                                    <strong>One metric off, others fine</strong> — likely a targeted formula change;
                                    trace the metric path (e.g. <code>financialResults.reusable.laborCost</code>) back
                                    to the relevant function in <code>lib/calculator/calculations/</code>
                                  </li>
                                  <li>
                                    <strong>Many metrics off by the same %</strong> — likely a constant was changed
                                    (emission factor, conversion rate)
                                  </li>
                                  <li>
                                    <strong>All metrics fail for one dataset only</strong> — the source project's data
                                    may have been edited; consider re-capturing that dataset
                                  </li>
                                </ul>
                              </div>
                            ),
                            icon: <CheckCircleOutlined />
                          }
                        ]}
                      />
                    </div>
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
