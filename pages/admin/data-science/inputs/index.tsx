import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Space, Spin, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

import type { DataHealthIssue } from '@prisma/client';

const { Title, Paragraph, Text } = Typography;

const ISSUE_DESCRIPTIONS: Record<string, string> = {
  missing_us_state: 'Project has no US state set — utility rates and emission factors require a state',
  missing_single_use_items: 'Project has no single-use line items — calculations will produce zero results',
  missing_reusable_items: 'Project has no reusable line items — calculations will produce zero results',
  zero_unit_line_item: 'Single-use line item has unitsPerCase = 0 — will produce division by zero in calculations',
  return_rate_over_100: 'Reusable line item has annual repurchase percentage > 100% — unlikely value',
  reusable_negative_case_cost: 'Reusable line item has a negative case cost — check for data entry error',
  unrealistic_case_cost: 'Reusable line item case cost exceeds $1 billion — likely a data entry error',
  single_use_negative_case_cost: 'Single-use line item has a negative case cost — check for data entry error',
  negative_quantity: 'Reusable line item has a negative quantity (casesPurchased < 0) — check for data entry error'
};

type Props = {
  user: DashboardUser;
};

export default function DataInputsPage({ user }: Props) {
  const [issues, setIssues] = useState<DataHealthIssue[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null);
  const [validateModal, setValidateModal] = useState<{ open: boolean; issue: DataHealthIssue | null }>({
    open: false,
    issue: null
  });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const runScan = useCallback(async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/admin/data-health/scan', { method: 'POST' });
      const data = await res.json();
      setIssues(Array.isArray(data) ? data : []);
      setLastScanAt(new Date());
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    runScan();
  }, [runScan]);

  async function handleValidateConfirm() {
    if (!validateModal.issue) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/data-health/issues/${validateModal.issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged', note })
      });
      const updated = await res.json();
      setIssues(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      setValidateModal({ open: false, issue: null });
      setNote('');
    } finally {
      setSaving(false);
    }
  }

  function handleValidateCancel() {
    setValidateModal({ open: false, issue: null });
    setNote('');
  }

  const columns: ColumnsType<DataHealthIssue> = [
    {
      title: 'Issue Type',
      dataIndex: 'issueType',
      key: 'issueType',
      render: (t: string) => (
        <Text code style={{ fontSize: 12 }}>
          {t}
        </Text>
      )
    },
    {
      title: 'Entity',
      dataIndex: 'entity',
      key: 'entity'
    },
    {
      title: 'Entity ID',
      dataIndex: 'entityId',
      key: 'entityId',
      render: (id: string) => (
        <Text type='secondary' style={{ fontSize: 12 }}>
          {id ? `${id.slice(0, 8)}…` : '—'}
        </Text>
      )
    },
    {
      title: 'Description',
      key: 'description',
      render: (_, row) => <Text style={{ fontSize: 13 }}>{ISSUE_DESCRIPTIONS[row.issueType] ?? row.issueType}</Text>
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (s: string) => <Tag color={s === 'error' ? 'red' : 'orange'}>{s.toUpperCase()}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'acknowledged' ? 'success' : 'processing'}>
          {s === 'acknowledged' ? 'Acknowledged' : 'Open'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) =>
        row.status === 'open' ? (
          <Button size='small' type='primary' onClick={() => setValidateModal({ open: true, issue: row })}>
            Validate
          </Button>
        ) : (
          <Text type='secondary' style={{ fontSize: 12 }}>
            Acknowledged
          </Text>
        )
    }
  ];

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  return (
    <AdminLayout title='Data Inputs' selectedMenuItem='data-science/inputs' user={user}>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24
          }}
        >
          <div>
            <Title level={2} style={{ marginBottom: 4 }}>
              Data Inputs
            </Title>
            <Paragraph type='secondary'>
              Scan project data for quality issues, discrepancies, and unlikely values.
            </Paragraph>
          </div>
          <Button icon={<ReloadOutlined />} onClick={runScan} loading={scanning}>
            {lastScanAt ? `Re-scan (last: ${lastScanAt.toLocaleTimeString()})` : 'Re-scan'}
          </Button>
        </div>

        {/* Content */}
        <Spin spinning={scanning}>
          {!scanning && issues.length === 0 ? (
            /* Empty state */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '64px 0'
              }}
            >
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 48, marginBottom: 16 }} />
              <Title level={4} type='secondary'>
                No issues detected — data looks healthy
              </Title>
            </div>
          ) : (
            <Space direction='vertical' size='large' style={{ width: '100%' }}>
              {errors.length > 0 && (
                <div>
                  <Title level={4} style={{ marginBottom: 12 }}>
                    Errors ({errors.length})
                  </Title>
                  <Table<DataHealthIssue>
                    dataSource={errors}
                    columns={columns}
                    rowKey='id'
                    size='small'
                    pagination={false}
                    locale={{ emptyText: 'No errors' }}
                  />
                </div>
              )}
              {warnings.length > 0 && (
                <div>
                  <Title level={4} style={{ marginBottom: 12 }}>
                    Warnings ({warnings.length})
                  </Title>
                  <Table<DataHealthIssue>
                    dataSource={warnings}
                    columns={columns}
                    rowKey='id'
                    size='small'
                    pagination={false}
                    locale={{ emptyText: 'No warnings' }}
                  />
                </div>
              )}
            </Space>
          )}
        </Spin>

        {/* Validate Modal */}
        <Modal
          title='Validate Issue'
          open={validateModal.open}
          onOk={handleValidateConfirm}
          onCancel={handleValidateCancel}
          confirmLoading={saving}
          footer={[
            <Link
              key='cr-link'
              href='/admin/data-science/change-requests'
              target='_blank'
              rel='noopener noreferrer'
              style={{ fontSize: 13, marginRight: 'auto' }}
            >
              Create Change Request →
            </Link>,
            <Button key='cancel' onClick={handleValidateCancel}>
              Cancel
            </Button>,
            <Button key='ok' type='primary' onClick={handleValidateConfirm} loading={saving}>
              OK
            </Button>
          ]}
        >
          {validateModal.issue && (
            <div>
              <div
                style={{
                  background: '#f5f5f5',
                  padding: '12px 16px',
                  borderRadius: 6,
                  marginBottom: 16
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Issue Type: </Text>
                  <Text code style={{ fontSize: 12 }}>
                    {validateModal.issue.issueType}
                  </Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Entity: </Text>
                  <Text>{validateModal.issue.entity}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Entity ID: </Text>
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {validateModal.issue.entityId}
                  </Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Description: </Text>
                  <Text>{ISSUE_DESCRIPTIONS[validateModal.issue.issueType] ?? validateModal.issue.issueType}</Text>
                </div>
                <div>
                  <Text strong>Severity: </Text>
                  <Tag color={validateModal.issue.severity === 'error' ? 'red' : 'orange'}>
                    {validateModal.issue.severity.toUpperCase()}
                  </Tag>
                </div>
              </div>
              <Input.TextArea
                placeholder='Optional note — describe what you checked or why this is acceptable'
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

DataInputsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => page;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };
  return { props: serializeJSON({ user }) };
};
