/**
 * Manages the mapping between an RSP's own customer identifiers and Chart-Reuse accounts.
 *
 * This is the step that decides whether a partner's data reaches a customer dashboard: the
 * intake endpoint resolves `client_id` against (rspOrgId, rspClientId), and accepts the
 * payload either way. An unlinked client_id therefore ingests silently into nothing, which
 * is why the panel calls out links with no data and lets one be fixed in place.
 */
import { DeleteOutlined, LinkOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Input, Modal, Select, Space, Table, Tag, Tooltip, Typography, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

import type { ClientLink } from 'pages/api/admin/rsp/client-links';

const { Text, Paragraph } = Typography;

type Props = {
  rspOrgId: string;
  rspName: string;
  /** Called after any change, so a parent list of counts can refresh */
  onChanged?: () => void;
};

type Candidate = {
  accountId: string;
  accountName: string;
  orgName: string;
};

export function ClientLinksPanel({ rspOrgId, rspName, onChanged }: Props) {
  const [links, setLinks] = useState<ClientLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [chosenAccount, setChosenAccount] = useState<string | undefined>();
  const [newClientId, setNewClientId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/rsp/client-links?rspOrgId=${rspOrgId}`);
      setLinks(res.ok ? await res.json() : []);
    } finally {
      setLoading(false);
    }
  }, [rspOrgId]);

  useEffect(() => {
    load();
  }, [load]);

  async function openAdd() {
    setChosenAccount(undefined);
    setNewClientId('');
    setAddOpen(true);
    const res = await fetch('/api/admin/rsp/client-links');
    if (res.ok) setCandidates(await res.json());
  }

  async function save() {
    if (!chosenAccount || !newClientId.trim()) {
      message.warning('Pick an account and enter the client_id the RSP will send');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/rsp/client-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: chosenAccount, rspOrgId, rspClientId: newClientId.trim() })
      });
      const json = await res.json();
      if (!res.ok) {
        message.error(json.error ?? 'Could not link the account');
        return;
      }
      message.success(`Linked "${json.name}" as ${json.rspClientId}`);
      setAddOpen(false);
      await load();
      onChanged?.();
    } finally {
      setSaving(false);
    }
  }

  async function unlink(link: ClientLink) {
    Modal.confirm({
      title: `Unlink ${link.accountName}?`,
      content: `${rspName} submissions using client_id "${link.rspClientId}" will stop reaching this account. The account and its ${link.periodCount} existing usage period(s) are not deleted.`,
      okText: 'Unlink',
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await fetch(`/api/admin/rsp/client-links?accountId=${link.accountId}`, { method: 'DELETE' });
        if (!res.ok) {
          message.error('Could not unlink the account');
          return;
        }
        message.success('Unlinked');
        await load();
        onChanged?.();
      }
    });
  }

  const missingClientId = links.filter(link => !link.rspClientId);

  return (
    <>
      <Paragraph type='secondary' style={{ marginBottom: 12 }}>
        {rspName} identifies each customer by its own <code>client_id</code>. Map those to Chart-Reuse accounts here —
        usage submitted under an unmapped <code>client_id</code> is stored but never appears on a customer dashboard.
      </Paragraph>

      {missingClientId.length > 0 && (
        <Alert
          type='warning'
          showIcon
          style={{ marginBottom: 12 }}
          message={`${missingClientId.length} account(s) are attached to this RSP with no client_id, so nothing can route to them.`}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button size='small' type='primary' icon={<LinkOutlined />} onClick={openAdd}>
          Link an account
        </Button>
      </div>

      <Table
        size='small'
        loading={loading}
        rowKey='accountId'
        dataSource={links}
        pagination={links.length > 10 ? { pageSize: 10 } : false}
        locale={{
          emptyText: <Empty description='No accounts linked yet' image={Empty.PRESENTED_IMAGE_SIMPLE} />
        }}
        columns={[
          {
            title: 'Account',
            dataIndex: 'accountName',
            ellipsis: true,
            render: (name: string, row) => (
              <>
                {name}
                <br />
                <Text type='secondary' style={{ fontSize: 11 }}>
                  {row.orgName}
                </Text>
              </>
            )
          },
          {
            title: 'client_id',
            dataIndex: 'rspClientId',
            render: (clientId: string | null) =>
              clientId ? (
                <code style={{ fontSize: 11 }}>{clientId}</code>
              ) : (
                <Tag color='warning' icon={<WarningOutlined />}>
                  not set
                </Tag>
              )
          },
          {
            title: 'Periods',
            dataIndex: 'periodCount',
            width: 80,
            align: 'right' as const,
            render: (count: number) =>
              count > 0 ? (
                count
              ) : (
                <Tooltip title='No usage has arrived for this client_id yet'>
                  <Text type='secondary'>none</Text>
                </Tooltip>
              )
          },
          {
            title: '',
            width: 40,
            render: (_: unknown, row) => (
              <Button size='small' type='text' danger icon={<DeleteOutlined />} onClick={() => unlink(row)} />
            )
          }
        ]}
      />

      <Modal
        title={`Link an account to ${rspName}`}
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={save}
        okText='Link account'
        confirmLoading={saving}
      >
        <Space direction='vertical' size={12} style={{ width: '100%' }}>
          <div>
            <Text strong>Chart-Reuse account</Text>
            <Select
              showSearch
              style={{ width: '100%', marginTop: 4 }}
              placeholder='Search accounts not yet linked to an RSP'
              value={chosenAccount}
              onChange={setChosenAccount}
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={candidates.map(c => ({ value: c.accountId, label: `${c.accountName} — ${c.orgName}` }))}
            />
          </div>
          <div>
            <Text strong>
              The <code>client_id</code> {rspName} will send
            </Text>
            <Input
              style={{ marginTop: 4 }}
              placeholder='e.g. berkeley-campus-01'
              value={newClientId}
              onChange={e => setNewClientId(e.target.value)}
              onPressEnter={save}
            />
            <Text type='secondary' style={{ fontSize: 12 }}>
              Must match exactly what appears in their payload — it is case-sensitive.
            </Text>
          </div>
        </Space>
      </Modal>
    </>
  );
}
