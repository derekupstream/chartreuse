/**
 * The Data Science Command Center — the operations home (docs/CR2-PRODUCT-STUDIO-SPEC.md §1).
 *
 * Health and action first: system cards, the most-used functions as one-click actions, a
 * three-column health / change-alerts / AI-queue band, products grouped by type with their
 * golden datasets, and an activity feed. Every number is live.
 */
import {
  AlertOutlined,
  ApartmentOutlined,
  CheckCircleFilled,
  DashboardOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  PlusOutlined,
  RobotOutlined,
  UploadOutlined,
  WarningFilled
} from '@ant-design/icons';
import { Alert, Badge, Button, Card, Col, Empty, List, Row, Statistic, Tabs, Tag, Typography } from 'antd';
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

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  productType: string;
  status: string;
  updatedAt: string;
  goldenDatasetName: string | null;
};

type ActivityItem = { at: string; text: string; kind: 'data' | 'snapshot' | 'test' | 'upload' | 'product' };

type Props = {
  user: DashboardUser;
  cards: {
    productsLive: number;
    productsTotal: number;
    goldenTotal: number;
    goldenLinkedProducts: number;
    openIssues: number;
    uploadsPending: number;
    dataChanges7d: number;
    pendingChangeRequests: number;
  };
  healthIssues: { issueType: string; severity: string; count: number }[];
  changeAlerts: { at: string; text: string }[];
  uploadQueue: { at: string; fileName: string; status: string; dataType: string }[];
  products: ProductCard[];
  activity: ActivityItem[];
  lastTestRun: { passed: number; failed: number; at: string } | null;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    productsTotal,
    productsLive,
    goldenTotal,
    goldenLinkedProducts,
    openIssues,
    issueGroups,
    uploadsPendingList,
    changes7d,
    pendingChangeRequests,
    recentChanges,
    recentSnapshots,
    recentTests,
    recentUploads,
    productRows,
    goldenRows,
    lastTest
  ] = await Promise.all([
    prisma.dataProductDefinition.count(),
    prisma.dataProductDefinition.count({ where: { status: 'published' } }),
    prisma.goldenDataset.count({ where: { isActive: true } }),
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
      select: { createdAt: true, fileName: true, status: true, dataType: true }
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
    prisma.importSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { createdAt: true, fileName: true, status: true }
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

  const activity: ActivityItem[] = [
    ...changeAlerts.map(a => ({ at: a.at, text: a.text, kind: 'data' as const })),
    ...recentSnapshots.map(s => ({
      at: s.createdAt.toISOString(),
      text: `Snapshot cut: ${s.name}`,
      kind: 'snapshot' as const
    })),
    ...recentTests.map(t => ({
      at: t.createdAt.toISOString(),
      text: `Test run: ${t.passed} passed, ${t.failed} failed`,
      kind: 'test' as const
    })),
    ...recentUploads.map(u => ({
      at: u.createdAt.toISOString(),
      text: `AI upload: ${u.fileName} (${u.status})`,
      kind: 'upload' as const
    }))
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);

  const props: Props = {
    user: user as unknown as DashboardUser,
    cards: {
      productsLive,
      productsTotal,
      goldenTotal,
      goldenLinkedProducts,
      openIssues,
      uploadsPending: uploadsPendingList.length,
      dataChanges7d: changes7d,
      pendingChangeRequests
    },
    healthIssues: issueGroups.map(g => ({ issueType: g.issueType, severity: g.severity, count: g._count._all })),
    changeAlerts,
    uploadQueue: uploadsPendingList.map(u => ({
      at: u.createdAt.toISOString(),
      fileName: u.fileName,
      status: u.status,
      dataType: u.dataType
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
    activity,
    lastTestRun: lastTest
      ? { passed: lastTest.passed, failed: lastTest.failed, at: lastTest.createdAt.toISOString() }
      : null
  };
  return { props: serializeJSON(props) };
};

const QUICK_ACTIONS = [
  {
    label: 'Upload workbook',
    href: '/admin/data-science/databases/workbook-upload',
    icon: <UploadOutlined />,
    primary: true
  },
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
  { label: 'Validate Golden Datasets', href: '/admin/data-science/test-runs', icon: <CheckCircleFilled /> },
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
  cards,
  healthIssues,
  changeAlerts,
  uploadQueue,
  products,
  activity,
  lastTestRun
}: Props) {
  const byType = (type: string) => products.filter(p => p.productType === type);
  const testsGreen = lastTestRun && lastTestRun.failed === 0;

  return (
    <>
      <Title level={2} style={{ marginBottom: 0 }}>
        Data Science
      </Title>
      <Paragraph type='secondary'>
        Monitor the health of datasets, calculations, and products. Create and manage calculators, dashboards, and
        scenarios.
      </Paragraph>

      {/* Row 1 — system cards */}
      <Row gutter={[12, 12]}>
        <Col xs={12} md={4}>
          <Card size='small'>
            <Statistic title='Products live' value={cards.productsLive} suffix={`/ ${cards.productsTotal}`} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card size='small'>
            <Statistic
              title='Products with golden'
              value={cards.goldenLinkedProducts}
              suffix={`/ ${cards.productsTotal}`}
              valueStyle={cards.goldenLinkedProducts < cards.productsTotal ? { color: '#cf1322' } : undefined}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card size='small'>
            <Statistic
              title='Alerts to review'
              value={cards.openIssues}
              valueStyle={cards.openIssues > 0 ? { color: '#cf1322' } : { color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card size='small'>
            <Statistic title='AI uploads pending' value={cards.uploadsPending} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card size='small'>
            <Statistic title='Data changes (7d)' value={cards.dataChanges7d} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card size='small'>
            <Statistic title='Change requests' value={cards.pendingChangeRequests} />
          </Card>
        </Col>
      </Row>

      {lastTestRun && (
        <Alert
          style={{ marginTop: 12 }}
          type={testsGreen ? 'success' : 'error'}
          showIcon
          message={
            testsGreen
              ? `Last golden validation: all ${lastTestRun.passed} checks passed (${new Date(lastTestRun.at).toLocaleDateString()}).`
              : `Last golden validation: ${lastTestRun.failed} FAILING (${new Date(lastTestRun.at).toLocaleDateString()}) — a failing golden dataset is a review artifact, look before re-running.`
          }
        />
      )}

      {/* Row 2 — quick actions */}
      <Card size='small' style={{ marginTop: 16 }} title='Quick actions'>
        <Row gutter={[8, 8]}>
          {QUICK_ACTIONS.map(action => (
            <Col key={action.label} xs={12} md={6} lg={3}>
              <Link href={action.href}>
                <Button block type={action.primary ? 'primary' : 'default'} icon={action.icon} style={{ height: 44 }}>
                  <span style={{ fontSize: 12 }}>{action.label}</span>
                </Button>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Row 3 — health · change alerts · AI queue */}
      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
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
        extra={<Link href='/admin/data-science/data-products'>all products</Link>}
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
