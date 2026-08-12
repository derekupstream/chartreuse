/**
 * The RSP's own window into their integration: which customers their data routes to, what
 * has been shared for each, and a log of their recent API requests with the errors and
 * warnings each one produced.
 *
 * Everything here was previously visible only to Upstream staff in the admin area. An RSP
 * demoing to their own customer, or debugging a failed nightly job, needs it themselves.
 */
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Table, Tag, Tooltip, Typography } from 'antd';
import useSWR from 'swr';

import type { RspActivityRow } from 'pages/api/settings/rsp/activity';
import type { RspClientRow } from 'pages/api/settings/rsp/clients';

const { Text } = Typography;

const fetcher = (url: string) => fetch(url).then(r => r.json());

const OUTCOME_TAGS: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  success: { color: 'green', label: 'Success', icon: <CheckCircleFilled /> },
  dry_run: { color: 'blue', label: 'Dry Run', icon: <ExclamationCircleFilled /> },
  auth_failed: { color: 'red', label: 'Auth Failed', icon: <CloseCircleFilled /> },
  validation_failed: { color: 'orange', label: 'Rejected', icon: <ExclamationCircleFilled /> },
  server_error: { color: 'red', label: 'Server Error', icon: <CloseCircleFilled /> },
  method_not_allowed: { color: 'default', label: 'Bad Method', icon: <CloseCircleFilled /> }
};

const num = (n: number, digits = 1) => n.toLocaleString(undefined, { maximumFractionDigits: digits });

export function RspClientsPanel() {
  const { data, isLoading, mutate } = useSWR<RspClientRow[]>('/api/settings/rsp/clients', fetcher);
  const rows = Array.isArray(data) ? data : [];

  return (
    <Card
      style={{ marginTop: 24 }}
      title='Your clients'
      extra={
        <Button size='small' icon={<ReloadOutlined />} onClick={() => mutate()}>
          Refresh
        </Button>
      }
    >
      <Text type='secondary' style={{ display: 'block', marginBottom: 12 }}>
        Every customer your submissions route to, and the impact calculated from the data you&apos;ve shared for them. A
        new <code>client_id</code> creates its account automatically on first submission.
      </Text>
      <Table
        size='small'
        rowKey='accountId'
        loading={isLoading}
        dataSource={rows}
        pagination={rows.length > 10 ? { pageSize: 10 } : false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='No client data yet — your first real submission will appear here'
            />
          )
        }}
        columns={[
          {
            title: 'Client',
            dataIndex: 'name',
            ellipsis: true,
            render: (name: string, row) => (
              <>
                {name}
                <br />
                <Text type='secondary' style={{ fontSize: 11 }}>
                  <code>{row.rspClientId ?? '—'}</code>
                </Text>
              </>
            )
          },
          {
            title: 'Data shared',
            render: (_: unknown, row) =>
              row.periodCount === 0 ? (
                <Text type='secondary'>none yet</Text>
              ) : (
                <>
                  {row.periodCount} period{row.periodCount === 1 ? '' : 's'}
                  <br />
                  <Text type='secondary' style={{ fontSize: 11 }}>
                    {row.coverageStart} → {row.coverageEnd}
                  </Text>
                </>
              )
          },
          {
            title: 'CO2 avoided (kg)',
            align: 'right' as const,
            render: (_: unknown, row) => num(row.totals.co2AvoidedKg)
          },
          {
            title: 'Water saved (gal)',
            align: 'right' as const,
            render: (_: unknown, row) => num(row.totals.waterSavedGallons, 0)
          },
          {
            title: 'Waste diverted (lb)',
            align: 'right' as const,
            render: (_: unknown, row) => num(row.totals.wasteDivertedLbs)
          },
          {
            title: 'Single-use avoided',
            align: 'right' as const,
            render: (_: unknown, row) => row.totals.singleUseEquivalents.toLocaleString()
          }
        ]}
      />
    </Card>
  );
}

export function RspActivityPanel() {
  const { data, isLoading, mutate } = useSWR<RspActivityRow[]>('/api/settings/rsp/activity?limit=50', fetcher);
  const rows = Array.isArray(data) ? data : [];

  return (
    <Card
      style={{ marginTop: 24 }}
      title='Recent API activity'
      extra={
        <Button size='small' icon={<ReloadOutlined />} onClick={() => mutate()}>
          Refresh
        </Button>
      }
    >
      <Text type='secondary' style={{ display: 'block', marginBottom: 12 }}>
        Your last {rows.length || 50} requests, newest first. Failed calls show the exact error we returned, so your
        team can troubleshoot without waiting on us.
      </Text>
      <Table
        size='small'
        rowKey='id'
        loading={isLoading}
        dataSource={rows}
        pagination={rows.length > 10 ? { pageSize: 10 } : false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='No requests yet — try a dry run to see one land here'
            />
          )
        }}
        columns={[
          {
            title: 'When',
            dataIndex: 'createdAt',
            width: 160,
            render: (v: string) => (
              <Tooltip title={new Date(v).toLocaleString()}>
                <Text style={{ fontSize: 12 }}>{new Date(v).toLocaleString()}</Text>
              </Tooltip>
            )
          },
          {
            title: 'Outcome',
            dataIndex: 'outcome',
            width: 120,
            render: (outcome: string, row) => {
              const config = OUTCOME_TAGS[outcome] ?? { color: 'default', label: outcome, icon: null };
              return (
                <Tag color={config.color} icon={config.icon}>
                  {config.label} · {row.httpStatus}
                </Tag>
              );
            }
          },
          {
            title: 'Client',
            dataIndex: 'clientId',
            width: 140,
            ellipsis: true,
            render: (v: string | null) => (v ? <code style={{ fontSize: 11 }}>{v}</code> : '—')
          },
          {
            title: 'Details',
            render: (_: unknown, row) => {
              if (row.errorMessage) {
                return <Text type='danger'>{row.errorMessage}</Text>;
              }
              if (row.warnings.length > 0) {
                return (
                  <>
                    {row.warnings.map(code => (
                      <Tag key={code} color='gold'>
                        {code}
                      </Tag>
                    ))}
                  </>
                );
              }
              return (
                <Text type='secondary'>
                  {row.eventCount != null ? `${row.eventCount} event type(s)` : 'OK'}
                  {row.keyLabel ? ` · key: ${row.keyLabel}` : ''}
                </Text>
              );
            }
          }
        ]}
      />
    </Card>
  );
}
