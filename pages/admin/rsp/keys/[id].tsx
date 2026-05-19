import {
  CheckCircleFilled,
  CloseCircleFilled,
  CopyOutlined,
  KeyOutlined,
  ShopOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Col, Empty, Row, Space, Statistic, Tag, Tooltip, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import useSWR from 'swr';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

const { Text, Title, Paragraph } = Typography;

const fetcher = (url: string) => fetch(url).then(r => r.json());

type DrillResponse = {
  apiKey: {
    id: string;
    label: string;
    keyPrefix: string;
    isActive: boolean;
    isSimulated: boolean;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    org: { id: string; name: string; country: string | null; city: string | null } | null;
  };
  stats: {
    totalSubmissions: number;
    successCount: number;
    errorCount: number;
    outcomeBreakdown: Record<string, number>;
    activeAccounts: number;
    totalPeriods: number;
  };
  activity: Array<{
    id: string;
    createdAt: string;
    outcome: string;
    httpStatus: number;
    errorMessage: string | null;
    latencyMs: number | null;
    endpoint: string;
  }>;
  accountCoverage: Array<{
    accountId: string;
    accountName: string;
    venueCategory: string | null;
    rspClientId: string | null;
    periods: Array<{ id: string; dateMin: string; dateMax: string; co2AvoidedKg: number; status: string }>;
    totalCo2: number;
    totalWater: number;
    totalWaste: number;
  }>;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };
  return { props: serializeJSON({ user }) };
};

function ApiKeyDrillPage(_: { user: DashboardUser }) {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  const { data, isLoading, error } = useSWR<DrillResponse>(id ? `/api/admin/rsp/keys/${id}` : null, fetcher, {
    refreshInterval: 5000
  });

  const dateExtent = useMemo(() => {
    if (!data?.accountCoverage?.length) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const a of data.accountCoverage) {
      for (const p of a.periods) {
        const dMin = new Date(p.dateMin).getTime();
        const dMax = new Date(p.dateMax).getTime();
        if (dMin < min) min = dMin;
        if (dMax > max) max = dMax;
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return { min, max };
  }, [data]);

  if (isLoading || !data) {
    return (
      <Card>
        <Text>Loading…</Text>
      </Card>
    );
  }
  if (error) {
    return <Alert type='error' message='Failed to load' description={String(error)} />;
  }

  const { apiKey, stats, activity, accountCoverage } = data;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <KeyOutlined style={{ fontSize: 24, color: '#722ed1' }} />
        <Title level={2} style={{ margin: 0 }}>
          {apiKey.label}
        </Title>
        <Tag color='processing'>{apiKey.keyPrefix}…</Tag>
        {apiKey.isSimulated && <Tag color='purple'>Simulated</Tag>}
        {!apiKey.isActive && <Tag color='red'>Inactive</Tag>}
        {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && <Tag color='orange'>Expired</Tag>}
      </div>

      {apiKey.org && (
        <Paragraph style={{ marginBottom: 16 }}>
          <ShopOutlined /> Belongs to{' '}
          <Link href={`/admin/orgs/${apiKey.org.id}`}>
            <strong>{apiKey.org.name}</strong>
          </Link>{' '}
          {apiKey.org.country && <Text type='secondary'>({apiKey.org.country})</Text>}
        </Paragraph>
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card size='small'>
            <Statistic title='Submissions' value={stats.totalSubmissions} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size='small'>
            <Statistic title='Success' value={stats.successCount} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size='small'>
            <Statistic
              title='Errors'
              value={stats.errorCount}
              valueStyle={{ color: stats.errorCount ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size='small'>
            <Statistic title='Active accounts' value={stats.activeAccounts} />
          </Card>
        </Col>
      </Row>

      <Card title='Outcome breakdown' size='small' style={{ marginBottom: 16 }}>
        <Space wrap>
          {Object.entries(stats.outcomeBreakdown).map(([outcome, count]) => (
            <Tag key={outcome} color={outcome === 'success' ? 'green' : 'red'}>
              {outcome.replace(/_/g, ' ')}: {count}
            </Tag>
          ))}
        </Space>
      </Card>

      <Card
        title='Date-range coverage by account'
        size='small'
        style={{ marginBottom: 16 }}
        extra={<Text type='secondary'>Each bar = one period; longer = wider date range</Text>}
      >
        {accountCoverage.length === 0 ? (
          <Empty description='No periods ingested yet' />
        ) : (
          <Space direction='vertical' size={12} style={{ width: '100%' }}>
            {accountCoverage.map(acc => (
              <AccountCoverageRow key={acc.accountId} acc={acc} dateExtent={dateExtent} />
            ))}
          </Space>
        )}
      </Card>

      <Card title='Recent activity (last 200)' size='small'>
        {activity.length === 0 ? (
          <Empty description='No activity for this key' />
        ) : (
          <Space direction='vertical' size={2} style={{ width: '100%' }}>
            {activity.slice(0, 50).map(a => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 8px',
                  borderLeft: `3px solid ${a.outcome === 'success' ? '#52c41a' : '#ff4d4f'}`,
                  background: a.outcome === 'success' ? '#f6ffed' : '#fff2f0',
                  fontSize: 12,
                  borderRadius: 2
                }}
              >
                {a.outcome === 'success' ? (
                  <CheckCircleFilled style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleFilled style={{ color: '#ff4d4f' }} />
                )}
                <Text style={{ fontSize: 11 }}>{new Date(a.createdAt).toLocaleString()}</Text>
                <Tag>{a.outcome.replace(/_/g, ' ')}</Tag>
                <Text type='secondary' style={{ fontSize: 11 }}>
                  {a.httpStatus} · {a.latencyMs ?? '—'}ms
                </Text>
                {a.errorMessage && (
                  <Text type='danger' style={{ fontSize: 11 }}>
                    {a.errorMessage}
                  </Text>
                )}
              </div>
            ))}
            {activity.length > 50 && (
              <Text type='secondary' style={{ fontSize: 11, marginTop: 8 }}>
                Showing 50 of {activity.length} —{' '}
                <Link href={`/admin/rsp/feed?apiKeyId=${apiKey.id}`}>view all in feed</Link>
              </Text>
            )}
          </Space>
        )}
      </Card>
    </div>
  );
}

function AccountCoverageRow({
  acc,
  dateExtent
}: {
  acc: DrillResponse['accountCoverage'][number];
  dateExtent: { min: number; max: number } | null;
}) {
  const total = dateExtent ? Math.max(1, dateExtent.max - dateExtent.min) : 1;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Space size='small'>
          <Text strong style={{ fontSize: 13 }}>
            {acc.accountName}
          </Text>
          {acc.venueCategory && <Tag color='geekblue'>{acc.venueCategory}</Tag>}
          {acc.rspClientId && (
            <Tag>
              <code style={{ fontSize: 10 }}>{acc.rspClientId}</code>
            </Tag>
          )}
        </Space>
        <Text type='secondary' style={{ fontSize: 11 }}>
          {acc.periods.length} period{acc.periods.length === 1 ? '' : 's'} · {Math.round(acc.totalCo2).toLocaleString()}{' '}
          kg CO₂e · {Math.round(acc.totalWater).toLocaleString()} gal · {Math.round(acc.totalWaste).toLocaleString()}{' '}
          lbs
        </Text>
      </div>
      <div
        style={{
          position: 'relative',
          height: 18,
          background: '#fafafa',
          borderRadius: 2,
          border: '1px solid #f0f0f0'
        }}
      >
        {dateExtent &&
          acc.periods.map(p => {
            const start = new Date(p.dateMin).getTime();
            const end = new Date(p.dateMax).getTime();
            const left = ((start - dateExtent.min) / total) * 100;
            const width = Math.max(0.5, ((end - start) / total) * 100);
            return (
              <Tooltip
                key={p.id}
                title={
                  <span>
                    {new Date(start).toLocaleDateString()} → {new Date(end).toLocaleDateString()}
                    <br />
                    {Math.round(p.co2AvoidedKg).toLocaleString()} kg CO₂e
                    {p.status !== 'active' && ` (${p.status})`}
                  </span>
                }
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 1,
                    bottom: 1,
                    background: p.status === 'active' ? 'linear-gradient(90deg, #b7eb8f 0%, #52c41a 100%)' : '#d9d9d9',
                    borderRadius: 2,
                    cursor: 'pointer'
                  }}
                />
              </Tooltip>
            );
          })}
      </div>
    </div>
  );
}

ApiKeyDrillPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='rsp/key-detail' title='RSP Key Detail'>
    {page}
  </AdminLayout>
);

export default ApiKeyDrillPage;
