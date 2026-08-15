/**
 * The Data Science Command Center — the operations home (docs/CR2-PRODUCT-STUDIO-SPEC.md §1).
 *
 * Top half keeps the original Data Governance Admin design language: KPI cards with a big
 * red count or a green all-clear check, a one-line meaning, and a View → action. Below:
 * quick-action tiles, the health / change-alerts / AI-queue band, products by type with
 * golden-dataset badges, and the activity feed. Every number is live.
 */
import {
  AlertOutlined,
  ApartmentOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
  WarningFilled
} from '@ant-design/icons';
import { Badge, Card, Col, Empty, List, Row, Tabs, Tag, Tooltip, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import styled from 'styled-components';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

/* ── the original governance-admin card language ─────────────────────────────────────── */

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

const ActionTile = styled(Card)`
  height: 100%;
  .ant-card-body {
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

function KpiCardBlock({
  title,
  value,
  subtext,
  href,
  icon,
  help,
  alertOverride,
  overrideLabel
}: {
  title: string;
  value: number;
  subtext: string;
  href: string;
  icon: React.ReactNode;
  /** What this metric means and what a healthy value looks like. */
  help: React.ReactNode;
  /** Force alert styling even at zero (e.g. tests stale after data changed) */
  alertOverride?: boolean;
  overrideLabel?: string;
}) {
  const isZero = value === 0 && alertOverride !== true;
  return (
    <KpiCard $alert={!isZero} hoverable>
      <KpiTitle>
        {icon} {title}
        <Tooltip title={help} overlayStyle={{ maxWidth: 340 }}>
          <QuestionCircleOutlined style={{ marginLeft: 6, color: 'rgba(0,0,0,0.35)', cursor: 'help', fontSize: 13 }} />
        </Tooltip>
      </KpiTitle>
      <KpiNumber $zero={isZero}>{isZero || value === 0 ? <CheckCircleOutlined /> : value}</KpiNumber>
      <KpiLabel>
        {isZero
          ? 'No issues detected'
          : value === 0 && alertOverride
            ? (overrideLabel ?? 'Needs attention')
            : `${value} item${value !== 1 ? 's' : ''} to review`}
      </KpiLabel>
      <KpiLabel style={{ fontSize: 11, marginTop: 2 }}>{subtext}</KpiLabel>
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <Link href={href} style={{ display: 'block', textAlign: 'center', fontSize: 12, color: '#1890ff' }}>
          View →
        </Link>
      </div>
    </KpiCard>
  );
}

/* ── data ─────────────────────────────────────────────────────────────────────────────── */

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  productType: string;
  status: string;
  updatedAt: string;
  goldenDatasetName: string | null;
};

type ActivityItem = { at: string; text: string; kind: string };

type Props = {
  user: DashboardUser;
  openIssues: number;
  pendingChangeRequests: number;
  uploadsPending: number;
  dataChanges7d: number;
  goldenLinkedProducts: number;
  productsTotal: number;
  lastTestRun: { passed: number; failed: number; at: string } | null;
  testsStale: boolean;
  healthIssues: { issueType: string; severity: string; count: number }[];
  changeAlerts: { at: string; text: string }[];
  uploadQueue: { at: string; fileName: string; status: string }[];
  products: ProductCard[];
  activity: ActivityItem[];
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    productsTotal,
    goldenLinkedProducts,
    openIssues,
    issueGroups,
    uploadsPendingList,
    changes7d,
    pendingChangeRequests,
    recentChanges,
    recentSnapshots,
    recentTests,
    productRows,
    goldenRows,
    lastTest
  ] = await Promise.all([
    prisma.dataProductDefinition.count(),
    prisma.dataProductDefinition.count({ where: { goldenDatasetId: { not: null } } }),
    prisma.dataHealthIssue.count({ where: { status: 'open' } }),
    prisma.dataHealthIssue.groupBy({
      by: ['issueType', 'severity'],
      where: { status: 'open' },
      _count: { _all: true },
      orderBy: { _count: { issueType: 'desc' } },
      take: 6
    }),
    prisma.importSession.findMany({
      where: { status: { notIn: ['applied', 'discarded'] } },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { createdAt: true, fileName: true, status: true }
    }),
    prisma.factorDatabaseChange.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.changeRequest.count({ where: { status: 'pending' } }),
    prisma.factorDatabaseChange.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { database: { select: { name: true } } }
    }),
    prisma.methodologySnapshot.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { createdAt: true, name: true }
    }),
    prisma.testRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { createdAt: true, passed: true, failed: true }
    }),
    prisma.dataProductDefinition.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        productType: true,
        status: true,
        updatedAt: true,
        goldenDatasetId: true
      }
    }),
    prisma.goldenDataset.findMany({ select: { id: true, name: true } }),
    prisma.testRun.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { passed: true, failed: true, createdAt: true }
    })
  ]);

  const goldenById = new Map(goldenRows.map(g => [g.id, g.name]));

  const changeAlerts = recentChanges.map(change => ({
    at: change.createdAt.toISOString(),
    text: `${change.database.name}: ${change.action} ${
      change.versionBefore && change.versionBefore !== change.versionAfter
        ? `${change.versionBefore} → ${change.versionAfter}`
        : `v${change.versionAfter}`
    } (+${change.rowsAdded}/${change.rowsUpdated}u)${change.sourceNote ? ` — ${change.sourceNote}` : ''}`
  }));

  const testsStale = changeAlerts.length > 0 && (!lastTest || lastTest.createdAt.toISOString() < changeAlerts[0].at);

  const activity: ActivityItem[] = [
    ...changeAlerts.map(a => ({ at: a.at, text: a.text, kind: 'data' })),
    ...recentSnapshots.map(s => ({ at: s.createdAt.toISOString(), text: `Snapshot cut: ${s.name}`, kind: 'snapshot' })),
    ...recentTests.map(t => ({
      at: t.createdAt.toISOString(),
      text: `Test run: ${t.passed} passed, ${t.failed} failed`,
      kind: 'test'
    })),
    ...uploadsPendingList.map(u => ({
      at: u.createdAt.toISOString(),
      text: `AI upload: ${u.fileName} (${u.status})`,
      kind: 'upload'
    }))
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);

  const props: Props = {
    user: user as unknown as DashboardUser,
    openIssues,
    pendingChangeRequests,
    uploadsPending: uploadsPendingList.length,
    dataChanges7d: changes7d,
    goldenLinkedProducts,
    productsTotal,
    lastTestRun: lastTest
      ? { passed: lastTest.passed, failed: lastTest.failed, at: lastTest.createdAt.toISOString() }
      : null,
    testsStale,
    healthIssues: issueGroups.map(g => ({ issueType: g.issueType, severity: g.severity, count: g._count._all })),
    changeAlerts,
    uploadQueue: uploadsPendingList.map(u => ({
      at: u.createdAt.toISOString(),
      fileName: u.fileName,
      status: u.status
    })),
    products: productRows.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      productType: p.productType,
      status: p.status,
      updatedAt: p.updatedAt.toISOString(),
      goldenDatasetName: p.goldenDatasetId ? (goldenById.get(p.goldenDatasetId) ?? null) : null
    })),
    activity
  };
  return { props: serializeJSON(props) };
};

/* ── quick actions ────────────────────────────────────────────────────────────────────── */

const QUICK_ACTIONS = [
  { label: 'Upload workbook', href: '/admin/data-science/databases/workbook-upload', icon: <UploadOutlined /> },
  { label: 'AI Data Uploader', href: '/admin/data-science/import', icon: <RobotOutlined /> },
  { label: 'Create Calculator', href: '/admin/data-science/data-products/new?type=calculator', icon: <PlusOutlined /> },
  {
    label: 'Create Dashboard',
    href: '/admin/data-science/data-products/new?type=dashboard',
    icon: <DashboardOutlined />
  },
  {
    label: 'Create Scenario',
    href: '/admin/data-science/data-products/new?type=scenario',
    icon: <ApartmentOutlined />
  },
  { label: 'Product Designer', href: '/admin/data-science/data-products', icon: <ExperimentOutlined /> },
  { label: 'Validate Golden Datasets', href: '/admin/data-science/test-runs', icon: <SafetyCertificateOutlined /> },
  { label: 'Data Map / Traceability', href: '/admin/data-science/data-map', icon: <FileSearchOutlined /> }
];

function productHref(product: ProductCard) {
  return product.slug === 'annual-projections-2-0'
    ? '/admin/data-science/data-products/annual-projections-2'
    : `/admin/data-science/data-products/${product.id}`;
}

function ProductGrid({ products }: { products: ProductCard[] }) {
  if (!products.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='None yet' />;
  return (
    <Row gutter={[12, 12]}>
      {products.map(product => (
        <Col xs={24} sm={12} lg={8} key={product.id}>
          <Link href={productHref(product)}>
            <Card hoverable size='small' styles={{ body: { padding: 12 } }}>
              <Text strong>{product.name}</Text>
              <div style={{ marginTop: 6 }}>
                <Tag color={product.status === 'published' ? 'green' : 'default'}>{product.status}</Tag>
                {product.goldenDatasetName ? (
                  <Tag color='gold'>golden ✓</Tag>
                ) : (
                  <Tag color='red' icon={<WarningFilled />}>
                    no golden dataset
                  </Tag>
                )}
              </div>
              <Text type='secondary' style={{ fontSize: 11 }}>
                {product.goldenDatasetName ?? 'link a golden dataset to validate this product'} · updated{' '}
                {new Date(product.updatedAt).toLocaleDateString()}
              </Text>
            </Card>
          </Link>
        </Col>
      ))}
    </Row>
  );
}

export default function CommandCenter({
  openIssues,
  pendingChangeRequests,
  uploadsPending,
  dataChanges7d,
  goldenLinkedProducts,
  productsTotal,
  lastTestRun,
  testsStale,
  healthIssues,
  changeAlerts,
  uploadQueue,
  products,
  activity
}: Props) {
  const byType = (type: string) => products.filter(p => p.productType === type);

  return (
    <>
      <Title level={2} style={{ marginBottom: 0 }}>
        Data Science
      </Title>
      <Paragraph type='secondary'>
        Monitor the health of datasets, calculations, and products. Create and manage calculators, dashboards, and
        scenarios.
      </Paragraph>

      {/* Row 1 — governance KPI cards, original design language */}
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <KpiCardBlock
            title='Data Health'
            icon={<AlertOutlined />}
            value={openIssues}
            subtext='open data quality issues'
            href='/admin/data-science/data-map'
            help='Issues detected across projects and RSP submissions: missing inputs, unknown types, suspect values. Healthy is zero; anything else deserves a look.'
          />
        </Col>
        <Col xs={12} lg={6}>
          <KpiCardBlock
            title='Change Requests'
            icon={<DatabaseOutlined />}
            value={pendingChangeRequests}
            subtext='pending review'
            href='/admin/data-science/change-requests'
            help='Proposed factor changes awaiting approval — the step between "someone thinks this value is wrong" and it changing.'
          />
        </Col>
        <Col xs={12} lg={6}>
          <KpiCardBlock
            title='AI Uploads'
            icon={<RobotOutlined />}
            value={uploadsPending}
            subtext='files awaiting review'
            href='/admin/data-science/import'
            help='Workbooks and files in the AI uploader queue that have been analyzed but not yet approved or discarded.'
          />
        </Col>
        <Col xs={12} lg={6}>
          <KpiCardBlock
            title='Golden Validation'
            icon={<SafetyCertificateOutlined />}
            value={lastTestRun?.failed ?? 0}
            subtext={
              lastTestRun
                ? `last run ${new Date(lastTestRun.at).toLocaleDateString()} · ${dataChanges7d} data changes this week`
                : 'never run'
            }
            href='/admin/data-science/test-runs'
            help='Failing checks from the most recent golden dataset run. Also alerts when data changed after the last run — green results against old data prove nothing.'
            alertOverride={testsStale}
            overrideLabel='Data updated — re-run tests'
          />
        </Col>
      </Row>

      {/* Row 2 — quick actions as tiles */}
      <Title level={5} style={{ margin: '24px 0 8px' }}>
        Quick actions
      </Title>
      <Row gutter={[12, 12]}>
        {QUICK_ACTIONS.map(action => (
          <Col key={action.label} xs={12} md={6}>
            <Link href={action.href}>
              <ActionTile hoverable>
                <span style={{ fontSize: 18, color: '#1f7a4d' }}>{action.icon}</span>
                <Text strong style={{ fontSize: 13 }}>
                  {action.label}
                </Text>
              </ActionTile>
            </Link>
          </Col>
        ))}
      </Row>

      {/* Row 3 — health · change alerts · AI queue */}
      <Row gutter={[12, 12]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={8}>
          <Card
            size='small'
            title={
              <>
                <AlertOutlined /> Data health
              </>
            }
            extra={<Link href='/admin/data-science/data-map'>inspect</Link>}
          >
            {healthIssues.length === 0 ? (
              <Text type='secondary'>No open issues.</Text>
            ) : (
              <List
                size='small'
                dataSource={healthIssues}
                renderItem={issue => (
                  <List.Item style={{ padding: '6px 0' }}>
                    <Badge
                      color={issue.severity === 'error' ? 'red' : 'orange'}
                      text={<code>{issue.issueType}</code>}
                    />
                    <Tag>{issue.count}</Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            size='small'
            title={
              <>
                <DatabaseOutlined /> Change alerts
              </>
            }
            extra={<Link href='/admin/data-science/databases'>databases</Link>}
          >
            {changeAlerts.length === 0 ? (
              <Text type='secondary'>No recent data changes.</Text>
            ) : (
              <List
                size='small'
                dataSource={changeAlerts}
                renderItem={alert => (
                  <List.Item style={{ padding: '6px 0' }}>
                    <Text style={{ fontSize: 12 }}>
                      <Text type='secondary'>{new Date(alert.at).toLocaleDateString()}</Text> {alert.text}
                    </Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            size='small'
            title={
              <>
                <RobotOutlined /> AI upload queue
              </>
            }
            extra={<Link href='/admin/data-science/import'>open uploader</Link>}
          >
            {uploadQueue.length === 0 ? (
              <Text type='secondary'>Queue empty.</Text>
            ) : (
              <List
                size='small'
                dataSource={uploadQueue}
                renderItem={upload => (
                  <List.Item style={{ padding: '6px 0' }}>
                    <Text style={{ fontSize: 12 }} ellipsis>
                      {upload.fileName}
                    </Text>
                    <Tag>{upload.status}</Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 4 — products by type */}
      <Card
        size='small'
        style={{ marginTop: 16 }}
        title='Products'
        extra={
          <>
            <Tag color={goldenLinkedProducts < productsTotal ? 'red' : 'green'}>
              {goldenLinkedProducts}/{productsTotal} with golden dataset
            </Tag>
            <Link href='/admin/data-science/data-products'>all products</Link>
          </>
        }
      >
        <Tabs
          items={[
            {
              key: 'calculator',
              label: `Calculators (${byType('calculator').length})`,
              children: <ProductGrid products={byType('calculator')} />
            },
            {
              key: 'dashboard',
              label: `Dashboards (${byType('dashboard').length})`,
              children: <ProductGrid products={byType('dashboard')} />
            },
            {
              key: 'scenario',
              label: `Scenarios (${byType('scenario').length})`,
              children: <ProductGrid products={byType('scenario')} />
            }
          ]}
        />
      </Card>

      {/* Row 5 — activity feed */}
      <Card size='small' style={{ marginTop: 16 }} title='Recent activity'>
        {activity.length === 0 ? (
          <Text type='secondary'>Nothing yet.</Text>
        ) : (
          <List
            size='small'
            dataSource={activity}
            renderItem={item => (
              <List.Item style={{ padding: '6px 0' }}>
                <Text style={{ fontSize: 12 }}>
                  <Tag style={{ marginRight: 8 }}>{item.kind}</Tag>
                  <Text type='secondary'>{new Date(item.at).toLocaleString()}</Text> — {item.text}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Card>
    </>
  );
}

CommandCenter.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science' title='Data Science'>
    {page}
  </AdminLayout>
);
