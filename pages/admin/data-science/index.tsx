import {
  BarChartOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FunctionOutlined,
  ImportOutlined,
  QuestionCircleOutlined,
  UploadOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Collapse, List, Row, Steps, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import styled from 'styled-components';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { scanCalculatorFunctions } from 'lib/admin/calculatorScan';
import { getInputIssueCount } from 'lib/admin/inputValidation';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
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

type MethodologySubsection = {
  id: string;
  title: string;
  sectionNumber: string;
};

type Props = {
  user: DashboardUser;
  stats: {
    inputIssues: number;
    constantsWithoutKey: number;
    constantsLastUpdated: string | null;
    functionsWithoutCoverage: number;
    totalFunctions: number;
    testRunFailures: number;
    lastTestRunAt: string | null;
  };
  publishedSections: MethodologySubsection[];
};

function KpiCardBlock({
  title,
  value,
  subtext,
  href,
  icon
}: {
  title: string;
  value: number;
  subtext: string;
  href: string;
  icon: React.ReactNode;
}) {
  const isZero = value === 0;
  return (
    <KpiCard $alert={!isZero} hoverable>
      <KpiTitle>
        {icon} {title}
      </KpiTitle>
      <KpiNumber $zero={isZero}>{isZero ? <CheckCircleOutlined /> : value}</KpiNumber>
      <KpiLabel>{isZero ? 'No issues detected' : `${value} issue${value !== 1 ? 's' : ''} found`}</KpiLabel>
      <KpiLabel style={{ fontSize: 11, marginTop: 2 }}>{subtext}</KpiLabel>
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <Button href={href} block size='small'>
          View →
        </Button>
      </div>
    </KpiCard>
  );
}

export default function DataSciencePage({ user, stats, publishedSections }: Props) {
  const {
    inputIssues,
    constantsWithoutKey,
    constantsLastUpdated,
    functionsWithoutCoverage,
    testRunFailures,
    lastTestRunAt
  } = stats;

  const fmtDate = (iso: string | null) =>
    iso ? `last updated ${new Date(iso).toLocaleDateString()}` : 'never updated';

  return (
    <AdminLayout title='Data Science Admin' selectedMenuItem='data-science' user={user}>
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginBottom: 4 }}>
          Data Science Admin
        </Title>
        <Paragraph type='secondary' style={{ marginBottom: 32 }}>
          Monitor data quality, validate calculations, and manage imports across the calculator pipeline.
        </Paragraph>

        {/* Pipeline KPI cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <KpiCardBlock
              title='Inputs'
              value={inputIssues}
              subtext='last checked: just now'
              href='/admin/data-science/constants'
              icon={<UploadOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCardBlock
              title='Constants'
              value={constantsWithoutKey}
              subtext={fmtDate(constantsLastUpdated)}
              href='/admin/data-science/constants'
              icon={<CalculatorOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCardBlock
              title='Calculations'
              value={functionsWithoutCoverage}
              subtext='last scanned: just now'
              href='/admin/data-science/calculations'
              icon={<FunctionOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCardBlock
              title='Test Runs'
              value={testRunFailures}
              subtext={fmtDate(lastTestRunAt)}
              href='/admin/data-science/test-runs'
              icon={<BarChartOutlined />}
            />
          </Col>
        </Row>

        {/* Quick links */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={8}>
            <Card size='small' style={{ textAlign: 'center' }}>
              <CodeOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8, display: 'block' }} />
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Calculations</div>
              <Button href='/admin/data-science/calculations' block>
                Registry
              </Button>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size='small' style={{ textAlign: 'center' }}>
              <ImportOutlined style={{ fontSize: 24, color: '#722ed1', marginBottom: 8, display: 'block' }} />
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Import Data</div>
              <Button href='/admin/data-science/import' block>
                Spreadsheet Importer
              </Button>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size='small' style={{ textAlign: 'center' }}>
              <ExclamationCircleOutlined
                style={{ fontSize: 24, color: '#fa8c16', marginBottom: 8, display: 'block' }}
              />
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Governance</div>
              <Button href='/admin/data-science/change-requests' block>
                Change Requests
              </Button>
            </Card>
          </Col>
        </Row>

        {/* Methodology card */}
        <Card
          style={{ marginTop: 32 }}
          title={
            <span>
              <FileTextOutlined style={{ marginRight: 8, color: '#2bbe50' }} />
              Methodology Documents
            </span>
          }
          extra={
            <Button type='primary' href='/admin/methodology'>
              Manage Methodologies
            </Button>
          }
        >
          {publishedSections.length === 0 ? (
            <Text type='secondary'>No published subsections yet.</Text>
          ) : (
            <List
              size='small'
              dataSource={publishedSections}
              renderItem={s => (
                <List.Item>
                  <Text>
                    {s.sectionNumber && (
                      <Text type='secondary' style={{ marginRight: 8, fontWeight: 600 }}>
                        {s.sectionNumber}
                      </Text>
                    )}
                    {s.title}
                  </Text>
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* How to use */}
        <div style={{ marginTop: 24 }}>
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
                      The pipeline flows: <strong>Inputs → Constants → Calculations → Test Runs</strong>. Each KPI card
                      at the top shows how many issues exist at that layer. Aim for all cards to show 0.
                    </Paragraph>
                    <Steps
                      direction='vertical'
                      current={-1}
                      items={[
                        {
                          title: (
                            <Link href='/admin/data-science/constants'>
                              <strong>Review the Constants Library</strong>
                            </Link>
                          ),
                          description:
                            'Every factor the calculator uses — EPA WARM emission factors, DOE utility rates, material weights. Ensure each has a calculatorConstantKey linking it to the code.',
                          icon: <CalculatorOutlined />
                        },
                        {
                          title: (
                            <Link href='/admin/data-science/calculations'>
                              <strong>Browse Calculations Registry</strong>
                            </Link>
                          ),
                          description:
                            'Auto-discovered calculator functions. Every function should have at least one golden dataset providing test coverage.',
                          icon: <FunctionOutlined />
                        },
                        {
                          title: (
                            <Link href='/admin/data-science/test-runs'>
                              <strong>Manage Golden Datasets & Run Tests</strong>
                            </Link>
                          ),
                          description:
                            'Capture known-good input/output pairs from real projects. Run tests after any code or constant change to detect regressions.',
                          icon: <BarChartOutlined />
                        },
                        {
                          title: (
                            <Link href='/admin/data-science/import'>
                              <strong>Import Spreadsheets</strong>
                            </Link>
                          ),
                          description:
                            'Upload CSV or Excel files. AI classifies the data type and suggests column mappings. Review and confirm before importing.',
                          icon: <ImportOutlined />
                        },
                        {
                          title: (
                            <Link href='/admin/data-science/change-requests'>
                              <strong>Propose Factor Changes</strong>
                            </Link>
                          ),
                          description:
                            'Use the governance workflow to propose, review, and implement factor updates with a full audit trail.',
                          icon: <WarningOutlined />
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
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const [inputIssues, constantsWithoutKey, lastFactor, lastTestRun, publishedSections] = await Promise.all([
    getInputIssueCount(),
    prisma.factor.count({ where: { calculatorConstantKey: null } }),
    prisma.factor.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
    prisma.testRun.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true, failed: true } }),
    prisma.methodologyDocument.findMany({
      where: { status: 'published' },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, sectionNumber: true }
    })
  ]);

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
        constantsWithoutKey,
        constantsLastUpdated: lastFactor?.updatedAt ?? null,
        functionsWithoutCoverage,
        totalFunctions: scannedFunctions.length,
        testRunFailures: lastTestRun?.failed ?? 0,
        lastTestRunAt: lastTestRun?.createdAt ?? null
      },
      publishedSections
    })
  };
};
