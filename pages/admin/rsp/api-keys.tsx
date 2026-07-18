import { ApiOutlined, CheckOutlined, CopyOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Text } = Typography;

type KeyRow = {
  id: string;
  label: string;
  keyPrefix: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  org: { id: string; name: string };
};

type RspOrg = { id: string; name: string };

type Props = {
  user: DashboardUser;
  apiKeys: KeyRow[];
  rspOrgs: RspOrg[];
};

export default function RspApiKeysPage({ user, apiKeys: initialKeys, rspOrgs }: Props) {
  const [apiKeys, setApiKeys] = useState(initialKeys);
  const [genOpen, setGenOpen] = useState(false);
  const [rawKey, setRawKey] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form] = Form.useForm();

  async function handleGenerate(values: { orgId: string; label: string }) {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/rsp/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate');
      }
      const data = await res.json();
      setRawKey(data.rawKey);
      setApiKeys(prev => [{ ...data, rawKey: undefined }, ...prev]);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function toggleKey(id: string, isActive: boolean) {
    try {
      const res = await fetch('/api/admin/rsp/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive })
      });
      if (!res.ok) throw new Error('Failed to update');
      setApiKeys(prev => prev.map(k => (k.id === id ? { ...k, isActive: !isActive } : k)));
    } catch {
      message.error('Failed to update key');
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const columns: ColumnsType<KeyRow> = [
    {
      title: 'Key Prefix',
      dataIndex: 'keyPrefix',
      render: (prefix: string) => <code style={{ fontSize: 12 }}>{prefix}...</code>
    },
    { title: 'Label', dataIndex: 'label' },
    {
      title: 'RSP Organization',
      dataIndex: 'org',
      render: (org: { name: string }) => org.name
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString()
    },
    {
      title: 'Last Used',
      dataIndex: 'lastUsedAt',
      render: (v: string | null) => (v ? new Date(v).toLocaleDateString() : <Text type='secondary'>Never</Text>)
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      render: (v: string | null) => {
        if (!v) return <Tag>Never</Tag>;
        const expired = new Date(v) < new Date();
        return <Tag color={expired ? 'red' : 'orange'}>{new Date(v).toLocaleDateString()}</Tag>;
      }
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      render: (active: boolean, row: KeyRow) => (
        <Switch size='small' checked={active} onChange={() => toggleKey(row.id, active)} />
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            RSP API Keys
          </Title>
          <Text type='secondary'>Manage API keys for Reuse Service Provider organizations.</Text>
        </div>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => {
            setRawKey('');
            setCopied(false);
            form.resetFields();
            setGenOpen(true);
          }}
          disabled={rspOrgs.length === 0}
        >
          Generate Key
        </Button>
      </div>

      {rspOrgs.length === 0 && (
        <Alert
          type='info'
          showIcon
          message='No RSP organizations found. Register one on the RSP Dashboard first.'
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Table
          dataSource={apiKeys}
          columns={columns}
          rowKey='id'
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'No API keys yet.' }}
        />
      </Card>

      {/* Generate key modal */}
      <Modal
        title={
          <Space>
            <ApiOutlined /> Generate API Key
          </Space>
        }
        open={genOpen}
        onCancel={() => setGenOpen(false)}
        footer={null}
        width={500}
        destroyOnClose
      >
        {!rawKey ? (
          <>
            <Text type='secondary' style={{ display: 'block', marginBottom: 16 }}>
              Select the RSP organization and enter a descriptive label. The full key will only be shown once.
            </Text>
            <Form form={form} layout='vertical' onFinish={handleGenerate}>
              <Form.Item name='orgId' label='RSP Organization' rules={[{ required: true, message: 'Select an org' }]}>
                <Select
                  showSearch
                  placeholder='Select organization'
                  filterOption={(input, opt) =>
                    String(opt?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={rspOrgs.map(o => ({ value: o.id, label: o.name }))}
                />
              </Form.Item>
              <Form.Item name='label' label='Key Label' rules={[{ required: true, message: 'Enter a label' }]}>
                <Input placeholder='e.g. Sharewares Production' />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setGenOpen(false)}>Cancel</Button>
                  <Button type='primary' htmlType='submit' loading={generating} icon={<ApiOutlined />}>
                    Generate Key
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        ) : (
          <>
            <Alert
              type='warning'
              showIcon
              message='Store this key securely — it will not be shown again.'
              style={{ marginBottom: 16 }}
            />
            <div
              style={{
                background: '#0d1117',
                borderRadius: 6,
                padding: '14px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}
            >
              <code style={{ flex: 1, color: '#4ade80', fontSize: 12, wordBreak: 'break-all', lineHeight: 1.6 }}>
                {rawKey}
              </code>
              <Button
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={copyKey}
                type={copied ? 'default' : 'primary'}
                size='small'
                style={{ flexShrink: 0 }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <Button block onClick={() => setGenOpen(false)}>
              Done
            </Button>
          </>
        )}
      </Modal>
    </>
  );
}

RspApiKeysPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='rsp/api-keys' title='RSP API Keys'>
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return ACCESS_DENIED_REDIRECT;

  const [rawKeys, rspOrgs] = await Promise.all([
    prisma.rspApiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        org: { select: { id: true, name: true } }
      }
    }),
    prisma.org.findMany({
      where: { orgType: 'reuse-service-provider' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    })
  ]);

  return { props: serializeJSON({ user, apiKeys: rawKeys, rspOrgs }) };
};
