import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Select, Space, Statistic, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

const { Text, Title, Paragraph } = Typography;

const fetcher = (url: string) => fetch(url).then(r => r.json());

type ActivityRow = {
  id: string;
  createdAt: string;
  apiKeyId: string | null;
  orgId: string | null;
  endpoint: string;
  httpStatus: number;
  outcome: string;
  errorMessage: string | null;
  errorCode: string | null;
  latencyMs: number | null;
  requestSummary: any;
  responseSummary: any;
  apiKey?: { id: string; label: string; keyPrefix: string; org?: { id: string; name: string } | null } | null;
};

const OUTCOME_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  success: { color: 'green', label: 'Success', icon: <CheckCircleFilled style={{ color: '#52c41a' }} /> },
  auth_failed: { color: 'red', label: 'Auth Failed', icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} /> },
  validation_failed: {
    color: 'orange',
    label: 'Validation Failed',
    icon: <ExclamationCircleFilled style={{ color: '#fa8c16' }} />
  },
  server_error: { color: 'red', label: 'Server Error', icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} /> },
  dedup_conflict: {
    color: 'gold',
    label: 'Dedup Conflict',
    icon: <ExclamationCircleFilled style={{ color: '#faad14' }} />
  },
  method_not_allowed: {
    color: 'default',
    label: 'Method Not Allowed',
    icon: <CloseCircleFilled style={{ color: '#bfbfbf' }} />
  },
  dry_run: {
    color: 'blue',
    label: 'Dry Run',
    icon: <ExclamationCircleFilled style={{ color: '#1677ff' }} />
  }
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};

function FeedPage(_: { user: DashboardUser }) {
  const [orgFilter, setOrgFilter] = useState<string | undefined>(undefined);
  const [outcomeFilter, setOutcomeFilter] = useState<string | undefined>(undefined);
  const [groupBy, setGroupBy] = useState<'time' | 'org'>('time');

  const queryParts: string[] = ['limit=200'];
  if (orgFilter) queryParts.push(`orgId=${orgFilter}`);
  if (outcomeFilter) queryParts.push(`outcome=${outcomeFilter}`);
  const url = `/api/admin/rsp/activity?${queryParts.join('&')}`;

  const { data, isLoading, mutate } = useSWR<{ rows: ActivityRow[] }>(url, fetcher, {
    refreshInterval: 5000
  });
  const rows = data?.rows ?? [];

  // Aggregate stats
  const stats = useMemo(() => {
    const total = rows.length;
    const success = rows.filter(r => r.outcome === 'success').length;
    const errors = total - success;
    const orgs = new Set(rows.map(r => r.orgId).filter(Boolean)).size;
    return { total, success, errors, orgs };
  }, [rows]);

  // Distinct orgs for the filter dropdown
  const orgOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.apiKey?.org) map.set(r.apiKey.org.id, r.apiKey.org.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }));
  }, [rows]);

  const grouped = useMemo(() => {
    if (groupBy === 'time') return [{ key: 'all', label: '', rows }];
    const byOrg = new Map<string, ActivityRow[]>();
    for (const r of rows) {
      const orgName = r.apiKey?.org?.name ?? 'Unknown';
      const list = byOrg.get(orgName) ?? [];
      list.push(r);
      byOrg.set(orgName, list);
    }
    return Array.from(byOrg.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([orgName, list]) => ({ key: orgName, label: orgName, rows: list }));
  }, [rows, groupBy]);

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <ThunderboltOutlined style={{ fontSize: 24, color: '#722ed1' }} />
        <Title level={2} style={{ margin: 0 }}>
          RSP Activity Feed
        </Title>
        <Tag color='processing'>Live · refresh every 5s</Tag>
      </div>
      <Paragraph type='secondary' style={{ marginBottom: 16 }}>
        Every API call to the RSP endpoints — successes, auth failures, validation errors, server errors. Newest first.
        Click a row to see the request/response details.
      </Paragraph>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size='small'>
            <Statistic title='Total events' value={stats.total} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size='small'>
            <Statistic title='Success' value={stats.success} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size='small'>
            <Statistic
              title='Errors'
              value={stats.errors}
              valueStyle={{ color: stats.errors ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size='small'>
            <Statistic title='RSPs active' value={stats.orgs} />
          </Card>
        </Col>
      </Row>

      <Card size='small' style={{ marginBottom: 16 }}>
        <Space wrap>
          <Text type='secondary'>Group by:</Text>
          <Select
            value={groupBy}
            onChange={setGroupBy}
            options={[
              { value: 'time', label: 'Time (chronological)' },
              { value: 'org', label: 'Organization' }
            ]}
            style={{ width: 200 }}
          />
          <Select
            allowClear
            placeholder='Filter by RSP org'
            value={orgFilter}
            onChange={v => setOrgFilter(v ?? undefined)}
            options={orgOptions}
            style={{ minWidth: 220 }}
          />
          <Select
            allowClear
            placeholder='Filter by outcome'
            value={outcomeFilter}
            onChange={v => setOutcomeFilter(v ?? undefined)}
            options={Object.entries(OUTCOME_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
            style={{ minWidth: 200 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
            Refresh
          </Button>
        </Space>
      </Card>

      {isLoading && rows.length === 0 ? (
        <Card>
          <Empty description='Loading activity…' />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <Empty description='No activity yet — run a burst from the Test Hub to populate the feed.' />
        </Card>
      ) : (
        <Space direction='vertical' size={16} style={{ width: '100%' }}>
          {grouped.map(group => (
            <div key={group.key}>
              {group.label && (
                <Title level={5} style={{ margin: '0 0 8px 0' }}>
                  {group.label} <Text type='secondary'>({group.rows.length})</Text>
                </Title>
              )}
              <Space direction='vertical' size={4} style={{ width: '100%' }}>
                {group.rows.map(row => (
                  <ActivityRowCard key={row.id} row={row} />
                ))}
              </Space>
            </div>
          ))}
        </Space>
      )}
    </div>
  );
}

function ActivityRowCard({ row }: { row: ActivityRow }) {
  const [expanded, setExpanded] = useState(false);
  const config = OUTCOME_CONFIG[row.outcome] ?? OUTCOME_CONFIG.server_error;
  const at = new Date(row.createdAt);
  const isError = row.outcome !== 'success';
  return (
    <Card
      size='small'
      style={{
        cursor: 'pointer',
        background: isError ? '#fff2f0' : '#f6ffed',
        borderLeft: `3px solid ${isError ? '#ff4d4f' : '#52c41a'}`
      }}
      bodyStyle={{ padding: 8 }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {config.icon}
        <Tag color={config.color}>{config.label}</Tag>
        <Text type='secondary' style={{ fontSize: 11 }}>
          <ClockCircleOutlined /> {at.toLocaleString()}
        </Text>
        <Text style={{ fontSize: 12 }}>
          <code>{row.endpoint}</code>
        </Text>
        <Text type='secondary' style={{ fontSize: 11 }}>
          {row.httpStatus} · {row.latencyMs ?? '—'}ms
        </Text>
        {row.apiKey?.org && (
          <Tag color='blue'>
            <Link href={`/admin/orgs/${row.apiKey.org.id}`} style={{ color: 'inherit' }}>
              {row.apiKey.org.name}
            </Link>
          </Tag>
        )}
        {row.apiKey && (
          <Tag>
            <Link href={`/admin/rsp/keys/${row.apiKey.id}`} style={{ color: 'inherit' }}>
              {row.apiKey.label} · {row.apiKey.keyPrefix}
            </Link>
          </Tag>
        )}
        {row.errorMessage && (
          <Text type='danger' style={{ fontSize: 11 }}>
            {row.errorMessage}
          </Text>
        )}
      </div>
      {expanded && (
        <div style={{ marginTop: 8, fontSize: 11, fontFamily: 'monospace' }}>
          {row.requestSummary && (
            <details open>
              <summary style={{ cursor: 'pointer' }}>request</summary>
              <pre style={{ margin: 0, padding: 8, background: '#fff', border: '1px solid #f0f0f0' }}>
                {JSON.stringify(row.requestSummary, null, 2)}
              </pre>
            </details>
          )}
          {row.responseSummary && (
            <details>
              <summary style={{ cursor: 'pointer' }}>response</summary>
              <pre style={{ margin: 0, padding: 8, background: '#fff', border: '1px solid #f0f0f0' }}>
                {JSON.stringify(row.responseSummary, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}

FeedPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='rsp/feed' title='RSP Activity Feed'>
    {page}
  </AdminLayout>
);

export default FeedPage;
