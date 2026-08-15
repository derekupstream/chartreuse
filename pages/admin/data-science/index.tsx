/**
 * The Data Science landing page IS the platform architecture: five layers from raw data to
 * products, each with live counts and links into its tools, governance running down the side.
 *
 * The mental model (see docs/CR2-ADMIN-PLAN.md): fragmented reuse data → standardized reuse
 * data → trusted calculations → comparable performance → industry intelligence.
 */
import { ArrowDownOutlined, SafetyCertificateOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Card, Col, Row, Statistic, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

type LayerStat = { label: string; value: number; href: string };

type Props = {
  user: DashboardUser;
  openIssues: number;
  failedRuns7d: number;
  lastTestRunFailed: number | null;
  layers: {
    data: LayerStat[];
    standardization: LayerStat[];
    intelligence: LayerStat[];
    derived: LayerStat[];
    products: LayerStat[];
  };
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    databaseCount,
    databaseRowCount,
    databaseChangeCount,
    rspLinkedAccounts,
    factorCount,
    pendingChangeRequests,
    snapshotCount,
    smartFieldCount,
    metricResultCount,
    computeRuns7d,
    failedRuns7d,
    dataProductCount,
    projectCount,
    rspOrgCount,
    openIssues,
    lastTestRun
  ] = await Promise.all([
    prisma.factorDatabase.count(),
    prisma.factorDatabaseRow.count(),
    prisma.factorDatabaseChange.count(),
    prisma.account.count({ where: { rspOrgId: { not: null } } }),
    prisma.factor.count(),
    prisma.changeRequest.count({ where: { status: 'pending' } }),
    prisma.methodologySnapshot.count(),
    prisma.smartField.count(),
    prisma.metricResult.count(),
    prisma.computeRun.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.computeRun.count({ where: { status: 'failed', createdAt: { gte: sevenDaysAgo } } }),
    prisma.dataProductDefinition.count(),
    prisma.project.count(),
    prisma.org.count({ where: { orgType: 'reuse-service-provider' } }),
    prisma.dataHealthIssue.count({ where: { status: 'open' } }),
    prisma.testRun.findFirst({ orderBy: { createdAt: 'desc' }, select: { failed: true } })
  ]);

  const props: Props = {
    user: user as unknown as DashboardUser,
    openIssues,
    failedRuns7d,
    lastTestRunFailed: lastTestRun?.failed ?? null,
    layers: {
      data: [
        { label: 'Reference databases', value: databaseCount, href: '/admin/data-science/databases' },
        { label: 'Rows', value: databaseRowCount, href: '/admin/data-science/databases' },
        { label: 'Version changes logged', value: databaseChangeCount, href: '/admin/data-science/databases' }
      ],
      standardization: [
        { label: 'RSP-linked client accounts', value: rspLinkedAccounts, href: '/admin/rsp' },
        { label: 'Projects contributing data', value: projectCount, href: '/admin/projects' }
      ],
      intelligence: [
        { label: 'Factors under governance', value: factorCount, href: '/admin/data-science/constants' },
        { label: 'Pending change requests', value: pendingChangeRequests, href: '/admin/data-science/change-requests' },
        { label: 'Methodology snapshots', value: snapshotCount, href: '/admin/data-science/snapshots' },
        { label: 'Smart fields', value: smartFieldCount, href: '/admin/data-science/smart-fields' }
      ],
      derived: [
        { label: 'Metric results stored', value: metricResultCount, href: '/admin/data-science/runs' },
        { label: 'Compute runs (7d)', value: computeRuns7d, href: '/admin/data-science/runs' }
      ],
      products: [
        { label: 'Data products', value: dataProductCount, href: '/admin/data-science/data-products' },
        { label: 'RSP integrations', value: rspOrgCount, href: '/admin/rsp' }
      ]
    }
  };

  return { props: serializeJSON(props) };
};

function Layer({
  step,
  title,
  summary,
  href,
  stats,
  last
}: {
  step: string;
  title: string;
  summary: string;
  href: string;
  stats: LayerStat[];
  last?: boolean;
}) {
  return (
    <>
      <Card hoverable styles={{ body: { padding: '16px 20px' } }} onClick={() => (window.location.href = href)}>
        <Row align='middle' gutter={[16, 8]}>
          <Col xs={24} md={9}>
            <Text type='secondary' style={{ fontSize: 11, letterSpacing: 1 }}>
              {step}
            </Text>
            <Title level={4} style={{ margin: 0 }}>
              {title}
            </Title>
            <Text type='secondary' style={{ fontSize: 12 }}>
              {summary}
            </Text>
          </Col>
          {stats.map(stat => (
            <Col key={stat.label} xs={12} md={5}>
              <Link href={stat.href} onClick={e => e.stopPropagation()}>
                <Statistic title={stat.label} value={stat.value} valueStyle={{ fontSize: 20 }} />
              </Link>
            </Col>
          ))}
        </Row>
      </Card>
      {!last && (
        <div style={{ textAlign: 'center', padding: '2px 0', color: '#1f7a4d' }}>
          <ArrowDownOutlined />
        </div>
      )}
    </>
  );
}

export default function DataScienceOverview({ openIssues, failedRuns7d, lastTestRunFailed, layers }: Props) {
  const governanceProblems = openIssues + failedRuns7d + (lastTestRunFailed ?? 0);

  return (
    <>
      <Title level={2} style={{ marginBottom: 0 }}>
        Data Science
      </Title>
      <Paragraph type='secondary' style={{ maxWidth: 760 }}>
        Fragmented reuse data → standardized reuse data → trusted calculations → comparable performance → industry
        intelligence. Each layer below is a link; the numbers are live.
      </Paragraph>

      {governanceProblems > 0 ? (
        <Alert
          type='warning'
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          message={
            <>
              Governance needs attention: {openIssues > 0 && <Tag color='orange'>{openIssues} open data issues</Tag>}
              {failedRuns7d > 0 && <Tag color='red'>{failedRuns7d} failed runs this week</Tag>}
              {(lastTestRunFailed ?? 0) > 0 && <Tag color='red'>{lastTestRunFailed} failing test cases</Tag>}
              <Link href='/admin/data-science/quality'>Open Quality →</Link>
            </>
          }
        />
      ) : (
        <Alert
          type='success'
          showIcon
          icon={<SafetyCertificateOutlined />}
          style={{ marginBottom: 16 }}
          message='Governance clean: no open data issues, no failed runs this week, last test run green.'
        />
      )}

      <Layer
        step='LAYER 1 · DATA'
        title='Databases'
        summary='Reference tables — products, factors, rates — versioned like software builds, every change logged.'
        href='/admin/data-science/databases'
        stats={layers.data}
      />
      <Layer
        step='LAYER 2 · STANDARDIZATION'
        title='Common Data Model'
        summary='Provider and project data mapped into one language, provenance preserved. RSP intake, project inputs, data dictionary.'
        href='/admin/rsp'
        stats={layers.standardization}
      />
      <Layer
        step='LAYER 3 · INTELLIGENCE'
        title='Methodology & Calculations'
        summary='Factors, models, and methods — Upstream IP. Changes are proposed, reviewed, versioned, and snapshotted.'
        href='/admin/data-science/methodology-hub'
        stats={layers.intelligence}
      />
      <Layer
        step='LAYER 4 · DERIVED DATA'
        title='Computed Results'
        summary='What the engine produces: impacts, costs, return rates — each run recorded. The future benchmark substrate.'
        href='/admin/data-science/runs'
        stats={layers.derived}
      />
      <Layer
        step='LAYER 5 · PRODUCTS'
        title='Calculators, Dashboards & API'
        summary='The experiences on top: projections, actuals dashboards, the RSP API, public calculators.'
        href='/admin/data-science/data-products-hub'
        stats={layers.products}
        last
      />
    </>
  );
}

DataScienceOverview.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science' title='Data Science'>
    {page}
  </AdminLayout>
);
