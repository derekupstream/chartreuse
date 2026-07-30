import {
  ApartmentOutlined,
  BarChartOutlined,
  BookOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FunctionOutlined,
  QuestionCircleOutlined,
  UploadOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Card, Col, Collapse, Row, Steps, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import styled from 'styled-components';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { HowTo } from 'components/admin/HowTo';
import { scanCalculatorFunctions } from 'lib/admin/calculatorScan';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Paragraph, Text } = Typography;

const KpiCard = styled(Card)<{ $alert?: boolean }>`
  height: 100%;
  border-color: ${p => (p.$alert ? '#ff4d4f22' : undefined)};
  .ant-card-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

const KpiNumber = styled.div<{ $zero: boolean }>`
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
  color: ${p => (p.$zero ? '#3f8600' : '#cf1322')};
`;

const KpiLabel = styled.div`
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 400;
`;

const KpiTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 4px;
`;

const DiagramWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
`;

const DiagramRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
  justify-content: center;
`;

const DiagramNode = styled.div<{ $group: 'input' | 'processing' | 'output'; $clickable?: boolean }>`
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  min-width: 120px;
  background: ${p => (p.$group === 'input' ? '#f0f9ff' : p.$group === 'processing' ? '#f6ffed' : '#fff7e6')};
  border: 1px solid ${p => (p.$group === 'input' ? '#bae0ff' : p.$group === 'processing' ? '#b7eb8f' : '#ffd591')};
  cursor: ${p => (p.$clickable ? 'pointer' : 'default')};
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: ${p => (p.$clickable ? '0 2px 8px rgba(0,0,0,0.12)' : 'none')};
  }
`;

const DiagramArrow = styled.div`
  padding: 0 8px;
  color: rgba(0, 0, 0, 0.25);
  font-size: 18px;
  flex-shrink: 0;
`;

const DiagramNodeTitle = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.85);
`;

const DiagramNodeSub = styled.div`
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
`;

type Props = {
  user: DashboardUser;
  stats: {
    inputIssues: number;
    pendingChangeRequests: number;
    recentComputeRunErrors: number;
    testRunFailures: number;
    lastTestRunAt: string | null;
    isStale: boolean;
    projectCount: number;
    factorCount: number;
    recentComputeRunCount: number;
    metricResultCount: number;
    functionsWithoutCoverage: number;
    totalFunctions: number;
  };
};

function KpiCardBlock({
  title,
  value,
  subtext,
  href,
  icon,
  alertOverride
}: {
  title: string;
  value: number;
  subtext: string;
  href: string;
  icon: React.ReactNode;
  alertOverride?: boolean;
}) {
  const isZero = value === 0 && alertOverride !== true;
  return (
    <KpiCard $alert={!isZero} hoverable>
      <KpiTitle>
        {icon} {title}
      </KpiTitle>
      <KpiNumber $zero={isZero}>
        {isZero ? <CheckCircleOutlined /> : value === 0 ? <CheckCircleOutlined /> : value}
      </KpiNumber>
      <KpiLabel>
        {isZero
          ? 'No issues detected'
          : value === 0 && alertOverride
            ? 'Factors updated — re-run tests'
            : `${value} issue${value !== 1 ? 's' : ''} found`}
      </KpiLabel>
      <KpiLabel style={{ fontSize: 11, marginTop: 2 }}>{subtext}</KpiLabel>
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <a href={href} style={{ display: 'block', textAlign: 'center', fontSize: 12, color: '#1890ff' }}>
          View →
        </a>
      </div>
    </KpiCard>
  );
}

export default function DataSciencePage({ user, stats }: Props) {
  const {
    inputIssues,
    pendingChangeRequests,
    recentComputeRunErrors,
    testRunFailures,
    lastTestRunAt,
    isStale,
    projectCount,
    factorCount,
    recentComputeRunCount,
    metricResultCount,
    functionsWithoutCoverage,
    totalFunctions
  } = stats;

  const fmtDate = (iso: string | null) =>
    iso ? `last updated ${new Date(iso).toLocaleDateString()}` : 'never updated';

  const SECTION_CARDS = [
    {
      key: 'inputs',
      icon: <UploadOutlined />,
      title: 'Inputs',
      description: 'Detect and acknowledge data quality issues across projects.',
      href: '/admin/data-science/inputs'
    },
    {
      key: 'factors',
      icon: <CalculatorOutlined />,
      title: 'Factors',
      description: 'Manage environmental constants: EPA WARM factors, utility rates, and material weights.',
      href: '/admin/data-science/constants'
    },
    {
      key: 'calculations',
      icon: <FunctionOutlined />,
      title: 'Calculations',
      description: 'Browse the auto-discovered calculator function registry and golden dataset coverage.',
      href: '/admin/data-science/calculations'
    },
    {
      key: 'test-runs',
      icon: <BarChartOutlined />,
      title: 'Test Runs',
      description: 'Run regression tests against golden datasets to verify calculation accuracy.',
      href: '/admin/data-science/test-runs'
    },
    {
      key: 'lineage',
      icon: <ApartmentOutlined />,
      title: 'Lineage',
      description: 'Trace how a metric was produced — from input data through factors to the final result.',
      href: '/admin/data-science/lineage'
    },
    {
      key: 'methodology',
      icon: <BookOutlined />,
      title: 'Methodology',
      description: 'Maintain the methodology documents and subsections that govern impact calculation standards.',
      href: '/admin/methodology'
    }
  ];

  return (
    <AdminLayout title='Data Governance Admin' selectedMenuItem='data-science' user={user}>
      <HowTo tool='overview' />
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginBottom: 4 }}>
          Data Governance Admin
        </Title>
        <Paragraph type='secondary' style={{ marginBottom: 32 }}>
          Govern the full impact calculation pipeline — validate inputs, maintain factors, verify calculations, and
          trace every result back to its source.
        </Paragraph>

        {/* System Health */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <KpiCardBlock
              title='Data Inputs'
              value={inputIssues}
              subtext='open data quality issues'
              href='/admin/data-science/inputs'
              icon={<UploadOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCardBlock
              title='Change Requests'
              value={pendingChangeRequests}
              subtext='pending review'
              href='/admin/data-science/change-requests'
              icon={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCardBlock
              title='ComputeRun Errors'
              value={recentComputeRunErrors}
              subtext='last 7 days'
              href='/admin/data-science/runs'
              icon={<WarningOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCardBlock
              title='Test Runs'
              value={testRunFailures}
              subtext={fmtDate(lastTestRunAt)}
              href='/admin/data-science/test-runs'
              icon={<BarChartOutlined />}
              alertOverride={isStale}
            />
          </Col>
        </Row>

        {/* System Architecture */}
        <Card title='System Architecture' style={{ marginTop: 24 }}>
          <DiagramWrapper>
            {/* Row 1: Data Inputs → Factor Library → Calculator Engine */}
            <DiagramRow>
              <DiagramNode $group='input'>
                <DiagramNodeTitle>Projects / RSP Data</DiagramNodeTitle>
                <DiagramNodeSub>{projectCount} projects</DiagramNodeSub>
              </DiagramNode>
              <DiagramArrow>→</DiagramArrow>
              <Link href='/admin/data-science/constants' style={{ textDecoration: 'none', color: 'inherit' }}>
                <DiagramNode $group='processing' $clickable>
                  <DiagramNodeTitle>Factor Library</DiagramNodeTitle>
                  <DiagramNodeSub>{factorCount} factors</DiagramNodeSub>
                </DiagramNode>
              </Link>
              <DiagramArrow>→</DiagramArrow>
              <Link href='/admin/data-science/calculations' style={{ textDecoration: 'none', color: 'inherit' }}>
                <DiagramNode $group='processing' $clickable>
                  <DiagramNodeTitle>Calculator Engine</DiagramNodeTitle>
                  <DiagramNodeSub>{totalFunctions} functions</DiagramNodeSub>
                </DiagramNode>
              </Link>
            </DiagramRow>
            {/* Vertical arrow between rows */}
            <div style={{ color: 'rgba(0,0,0,0.25)', fontSize: 18, lineHeight: 1 }}>↓</div>
            {/* Row 2: ComputeRun → MetricResult → Dashboards/Insights */}
            <DiagramRow>
              <Link href='/admin/data-science/runs' style={{ textDecoration: 'none', color: 'inherit' }}>
                <DiagramNode $group='processing' $clickable>
                  <DiagramNodeTitle>ComputeRun</DiagramNodeTitle>
                  <DiagramNodeSub>{recentComputeRunCount} runs (7d)</DiagramNodeSub>
                </DiagramNode>
              </Link>
              <DiagramArrow>→</DiagramArrow>
              <Link href='/admin/data-science/runs' style={{ textDecoration: 'none', color: 'inherit' }}>
                <DiagramNode $group='processing' $clickable>
                  <DiagramNodeTitle>MetricResult</DiagramNodeTitle>
                  <DiagramNodeSub>{metricResultCount.toLocaleString()} results</DiagramNodeSub>
                </DiagramNode>
              </Link>
              <DiagramArrow>→</DiagramArrow>
              <DiagramNode $group='output'>
                <DiagramNodeTitle>Dashboards / Insights</DiagramNodeTitle>
                <DiagramNodeSub>org analytics</DiagramNodeSub>
              </DiagramNode>
            </DiagramRow>
          </DiagramWrapper>
        </Card>

        {/* Section Cards */}
        <div style={{ marginTop: 24 }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            Governance Sections
          </Title>
          <Row gutter={[16, 16]}>
            {SECTION_CARDS.map(card => (
              <Col xs={24} sm={12} lg={8} key={card.key}>
                <Link href={card.href} style={{ display: 'block', height: '100%' }}>
                  <Card hoverable style={{ height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ fontSize: 20, color: 'rgba(0,0,0,0.45)', flexShrink: 0, marginTop: 2 }}>
                        {card.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{card.title}</div>
                        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', lineHeight: 1.4 }}>
                          {card.description}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Text style={{ fontSize: 12, color: '#1890ff' }}>View →</Text>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </div>

        {/* How It Works */}
        <div style={{ marginTop: 24 }}>
          <Collapse
            ghost
            style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 8 }}
            items={[
              {
                key: 'how-it-works',
                label: (
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    <QuestionCircleOutlined style={{ marginRight: 8, color: '#2bbe50' }} />
                    How Impact Governance Works
                  </span>
                ),
                children: (
                  <div style={{ padding: '8px 8px 16px' }}>
                    <Steps
                      direction='vertical'
                      current={-1}
                      items={[
                        {
                          title: (
                            <Link href='/admin/data-science/inputs'>
                              <strong>1. Validate Inputs</strong>
                            </Link>
                          ),
                          description:
                            'Run on-demand data health scans to detect issues in project data — missing states, zero-unit line items, out-of-range return rates.',
                          icon: <UploadOutlined />
                        },
                        {
                          title: (
                            <Link href='/admin/data-science/constants'>
                              <strong>2. Maintain Factors</strong>
                            </Link>
                          ),
                          description:
                            'Keep the Factor Library current — EPA WARM emission factors, DOE utility rates, material weights. Propose changes via the governance workflow.',
                          icon: <CalculatorOutlined />
                        },
                        {
                          title: (
                            <Link href='/admin/data-science/calculations'>
                              <strong>3. Verify Calculations</strong>
                            </Link>
                          ),
                          description:
                            'Browse the calculator function registry. Every function should have golden dataset coverage to detect regressions when code or factors change.',
                          icon: <FunctionOutlined />
                        },
                        {
                          title: (
                            <Link href='/admin/data-science/test-runs'>
                              <strong>4. Run Regression Tests</strong>
                            </Link>
                          ),
                          description:
                            'Execute test runs against golden datasets after any code or constant change. All cards at the top should show 0 issues.',
                          icon: <BarChartOutlined />
                        },
                        {
                          title: (
                            <Link href='/admin/data-science/lineage'>
                              <strong>5. Trace Results</strong>
                            </Link>
                          ),
                          description:
                            'Use the Lineage page to trace how a specific metric was produced — which ComputeRun, which factors, which calculator functions.',
                          icon: <ApartmentOutlined />
                        },
                        {
                          title: (
                            <Link href='/admin/methodology'>
                              <strong>6. Maintain Methodology</strong>
                            </Link>
                          ),
                          description:
                            'Keep methodology documents up to date. Publish subsections that explain the scientific basis for each impact metric.',
                          icon: <BookOutlined />
                        }
                      ]}
                    />
                  </div>
                )
              }
            ]}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

DataSciencePage.getLayout = (page: React.ReactNode, pageProps: PageProps) => page;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return ACCESS_DENIED_REDIRECT;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    inputIssues,
    lastFactor,
    lastTestRun,
    pendingChangeRequests,
    recentComputeRunErrors,
    projectCount,
    factorCount,
    recentComputeRunCount,
    metricResultCount
  ] = await Promise.all([
    prisma.dataHealthIssue.count({ where: { status: 'open' } }),
    prisma.factor.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
    prisma.testRun.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true, failed: true } }),
    prisma.changeRequest.count({ where: { status: 'pending' } }),
    prisma.computeRun.count({ where: { status: 'failed', createdAt: { gte: sevenDaysAgo } } }),
    prisma.project.count(),
    prisma.factor.count(),
    prisma.computeRun.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.metricResult.count()
  ]);

  const isStale =
    lastFactor?.updatedAt != null &&
    lastTestRun?.createdAt != null &&
    new Date(lastFactor.updatedAt) > new Date(lastTestRun.createdAt);

  let scannedFunctions: ReturnType<typeof scanCalculatorFunctions> = [];
  try {
    scannedFunctions = scanCalculatorFunctions();
  } catch {
    // source files may not be accessible in all deployment environments
  }
  const functionsWithoutCoverage = scannedFunctions.length;

  return {
    props: serializeJSON({
      user,
      stats: {
        inputIssues,
        pendingChangeRequests,
        recentComputeRunErrors,
        testRunFailures: lastTestRun?.failed ?? 0,
        lastTestRunAt: lastTestRun?.createdAt ?? null,
        isStale,
        projectCount,
        factorCount,
        recentComputeRunCount,
        metricResultCount,
        functionsWithoutCoverage,
        totalFunctions: scannedFunctions.length
      }
    })
  };
};
