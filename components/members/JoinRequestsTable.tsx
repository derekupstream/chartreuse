import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Space, Table, Tooltip, Typography, message } from 'antd';
import type { ColumnType } from 'antd/lib/table/interface';
import { useRouter } from 'next/router';
import { useState } from 'react';

export type JoinRequestRow = {
  id: string;
  email: string;
  name: string;
  message: string | null;
  createdAt: string;
};

type Props = {
  joinRequests: JoinRequestRow[];
};

export function JoinRequestsTable({ joinRequests }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(id: string, action: 'approve' | 'decline') {
    setBusyId(id);
    try {
      const res = await fetch(`/api/join-requests/${id}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to ${action}`);
      }
      message.success(action === 'approve' ? 'Request approved and member added' : 'Request declined');
      router.replace(router.asPath);
    } catch (err: any) {
      message.error(err.message || `Failed to ${action}`);
    } finally {
      setBusyId(null);
    }
  }

  const columns: ColumnType<JoinRequestRow>[] = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: text => text || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: text =>
        text ? (
          <Tooltip title={text}>{text.length > 60 ? text.slice(0, 60) + '…' : text}</Tooltip>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        )
    },
    {
      title: 'Requested',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: iso => new Date(iso).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Space>
          <Popconfirm
            title={`Approve ${row.name} as a member?`}
            onConfirm={() => decide(row.id, 'approve')}
            okText='Approve'
          >
            <Button type='primary' icon={<CheckOutlined />} size='small' loading={busyId === row.id}>
              Approve
            </Button>
          </Popconfirm>
          <Popconfirm
            title={`Decline this request?`}
            onConfirm={() => decide(row.id, 'decline')}
            okText='Decline'
            okButtonProps={{ danger: true }}
          >
            <Button icon={<CloseOutlined />} size='small' danger loading={busyId === row.id}>
              Decline
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <Typography.Title level={2}>Join Requests ({joinRequests.length})</Typography.Title>
      <Typography.Paragraph type='secondary' style={{ marginTop: -8 }}>
        People who requested to join your organization. Approve to add them as members.
      </Typography.Paragraph>
      <Table<JoinRequestRow> columns={columns} dataSource={joinRequests} rowKey='id' pagination={false} />
    </>
  );
}
