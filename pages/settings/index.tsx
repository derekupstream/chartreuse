import {
  ApiOutlined,
  BankOutlined,
  CheckOutlined,
  CopyOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { BaseLayout } from 'layouts/BaseLayout';
import { checkLogin } from 'lib/middleware/checkLogin';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';
import prisma from 'lib/prisma';

const { Title, Text } = Typography;

const ORG_TYPES = [
  { value: 'coalition', label: 'Coalition' },
  { value: 'daf', label: 'Donor-Advised Fund (DAF)' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'impact-investor', label: 'Impact Investor' },
  { value: 'non-profit', label: 'Non-profit' },
  { value: 'private-sector', label: 'Private Sector company' },
  { value: 'public-sector', label: 'Public Sector agency' },
  { value: 'reuse-service-provider', label: 'Reuse Service Provider' },
  { value: 'other', label: 'Other' }
];

const EMPLOYEE_COUNTS = [
  { value: '1-10', label: '1–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-200', label: '51–200' },
  { value: '201-1000', label: '201–1000' },
  { value: '1000+', label: '1000+' }
];

const LOCATION_COUNTS = [
  { value: '1', label: '1' },
  { value: '2-5', label: '2–5' },
  { value: '6-20', label: '6–20' },
  { value: '20+', label: '20+' }
];

const JOURNEY_STAGES = [
  { value: 'not-started', label: "We haven't started yet" },
  { value: 'piloting', label: 'Piloting / testing reuse' },
  { value: 'scaling', label: 'Scaling reuse across our operations' },
  { value: 'mature', label: 'Mature reuse program' }
];

const PRIMARY_CHALLENGES = [
  { value: 'scale', label: "We have not been able to scale as quickly as we'd like." },
  { value: 'rfp', label: 'We need to write an RFP for reuse to ensure we reach our goals.' },
  { value: 'operations', label: 'We are looking for the best way to engage our operations staff.' },
  { value: 'find-rsp', label: 'We are unsure how to find a reuse service provider.' },
  { value: 'business-case', label: 'We are looking to make the case about cost and impact to decision makers.' },
  { value: 'where-to-start', label: "We believe reuse is the right choice but don't know where to start." },
  { value: 'ensure-success', label: "We don't have room for failure and are looking for ways to ensure success." },
  { value: 'other', label: 'Other' }
];

type ApiKeyRow = {
  id: string;
  label: string;
  keyPrefix: string;
  isActive: boolean;
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
};

type Props = {
  user: DashboardUser;
  apiKeys: ApiKeyRow[];
};

type Section = 'account' | 'org' | 'api';

const SECTIONS: { key: Section; icon: React.ReactNode; label: string }[] = [
  { key: 'account', icon: <UserOutlined />, label: 'Account Settings' },
  { key: 'org', icon: <SettingOutlined />, label: 'Organizational Settings' },
  { key: 'api', icon: <ApiOutlined />, label: 'API Integration' }
];

export default function SettingsPage({ user, apiKeys: initialApiKeys }: Props) {
  const [section, setSection] = useState<Section>('account');
  const [saving, setSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [genOpen, setGenOpen] = useState(false);
  const [genLabel, setGenLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [newRawKey, setNewRawKey] = useState('');
  const [copied, setCopied] = useState(false);

  const org = user.org;
  const isRsp = org.orgType === 'reuse-service-provider';

  const [profileForm] = Form.useForm();
  const [prefsForm] = Form.useForm();

  async function saveSection(values: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/org/${org.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error('Failed to save');
      message.success('Settings saved');
    } catch {
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function generateKey() {
    if (!genLabel.trim()) {
      message.warning('Please enter a label for this key');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/settings/rsp/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: genLabel.trim() })
      });
      if (!res.ok) throw new Error('Failed to generate key');
      const data = await res.json();
      setNewRawKey(data.rawKey);
      setApiKeys(prev => [{ ...data, rawKey: undefined }, ...prev]);
    } catch {
      message.error('Failed to generate key');
    } finally {
      setGenerating(false);
    }
  }

  async function toggleKey(id: string, isActive: boolean) {
    try {
      await fetch('/api/settings/rsp/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive })
      });
      setApiKeys(prev => prev.map(k => (k.id === id ? { ...k, isActive: !isActive } : k)));
    } catch {
      message.error('Failed to update key');
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(newRawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const apiKeyColumns: ColumnsType<ApiKeyRow> = [
    {
      title: 'Key',
      dataIndex: 'keyPrefix',
      render: (prefix: string) => <code style={{ fontSize: 12 }}>{prefix}...</code>
    },
    { title: 'Label', dataIndex: 'label' },
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
      title: 'Active',
      dataIndex: 'isActive',
      render: (active: boolean, row: ApiKeyRow) => (
        <Switch size='small' checked={active} onChange={() => toggleKey(row.id, active)} />
      )
    }
  ];

  const visibleSections = isRsp ? SECTIONS : SECTIONS.filter(s => s.key !== 'api');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f3f0' }}>
      {/* Side nav */}
      <div
        style={{
          width: 220,
          background: '#fff',
          borderRight: '1px solid #e8e8e8',
          padding: '24px 0',
          flexShrink: 0
        }}
      >
        <div style={{ padding: '0 16px 16px' }}>
          <Title level={4} style={{ margin: 0 }}>
            Settings
          </Title>
        </div>
        {visibleSections.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '10px 20px',
              border: 'none',
              background: section === s.key ? '#f0f5ff' : 'transparent',
              borderLeft: section === s.key ? '3px solid #1677ff' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: 14,
              color: section === s.key ? '#1677ff' : '#333',
              fontWeight: section === s.key ? 600 : 400,
              textAlign: 'left'
            }}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 32, maxWidth: 700 }}>
        {/* Account Settings */}
        {section === 'account' && (
          <>
            <Title level={3}>Account Settings</Title>
            <Text type='secondary' style={{ display: 'block', marginBottom: 24 }}>
              Your organization's profile information.
            </Text>
            <Card>
              <Form
                form={profileForm}
                layout='vertical'
                initialValues={{
                  name: org.name,
                  country: org.country,
                  city: org.city,
                  orgType: org.orgType,
                  employeeCount: org.employeeCount,
                  locationCount: org.locationCount,
                  reuseJourneyStage: org.reuseJourneyStage,
                  primaryChallenge: org.primaryChallenge
                }}
                onFinish={saveSection}
              >
                <Form.Item label='Organization Name' name='name' rules={[{ required: true }]}>
                  <Input />
                </Form.Item>

                <Form.Item label='Country / Region' name='country'>
                  <Input placeholder='e.g. United States' />
                </Form.Item>

                <Form.Item label='City' name='city'>
                  <Input placeholder='e.g. San Francisco' />
                </Form.Item>

                <Form.Item label='Organization Type' name='orgType'>
                  <Select placeholder='Select your organization type' options={ORG_TYPES} allowClear />
                </Form.Item>

                <Form.Item label='Number of Employees' name='employeeCount'>
                  <Select placeholder='Select range' options={EMPLOYEE_COUNTS} allowClear />
                </Form.Item>

                <Form.Item label='Number of Locations' name='locationCount'>
                  <Select placeholder='Select range' options={LOCATION_COUNTS} allowClear />
                </Form.Item>

                <Form.Item label='Where are you in your reuse journey?' name='reuseJourneyStage'>
                  <Select placeholder='Select stage' options={JOURNEY_STAGES} allowClear />
                </Form.Item>

                <Form.Item label='Primary challenge related to reuse' name='primaryChallenge'>
                  <Select placeholder='Select your primary challenge' options={PRIMARY_CHALLENGES} allowClear />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type='primary' htmlType='submit' loading={saving}>
                    Save Account Settings
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </>
        )}

        {/* Organizational Settings */}
        {section === 'org' && (
          <>
            <Title level={3}>Organizational Settings</Title>
            <Text type='secondary' style={{ display: 'block', marginBottom: 24 }}>
              Preferences for how ChartReuse displays and calculates data.
            </Text>
            <Card>
              <Form
                form={prefsForm}
                layout='vertical'
                initialValues={{
                  currency: org.currency,
                  useMetricSystem: org.useMetricSystem,
                  useShrinkageRate: org.useShrinkageRate
                }}
                onFinish={saveSection}
              >
                <Form.Item label='Currency Display' name='currency'>
                  <Select
                    options={[
                      { value: 'USD', label: 'US Dollar (USD)' },
                      { value: 'EUR', label: 'Euro (EUR)' },
                      { value: 'GBP', label: 'British Pound (GBP)' },
                      { value: 'CAD', label: 'Canadian Dollar (CAD)' },
                      { value: 'AUD', label: 'Australian Dollar (AUD)' }
                    ]}
                  />
                </Form.Item>

                <Form.Item label='Measurement System' name='useMetricSystem'>
                  <Radio.Group>
                    <Radio value={false}>Standard (lbs, gallons)</Radio>
                    <Radio value={true}>Metric (kg, liters)</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item label='Reusable Tracking Mode' name='useShrinkageRate'>
                  <Radio.Group>
                    <Radio value={false}>Return Rate (%)</Radio>
                    <Radio value={true}>Shrinkage Rate (%)</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type='primary' htmlType='submit' loading={saving}>
                    Save Preferences
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </>
        )}

        {/* API Integration — RSP only */}
        {section === 'api' && isRsp && (
          <>
            <Title level={3}>API Integration</Title>
            <Text type='secondary' style={{ display: 'block', marginBottom: 8 }}>
              Use API keys to submit usage data from your reuse service operations. Keys authenticate requests to{' '}
              <code>POST /api/rsp/usage</code>.
            </Text>
            <Alert
              type='info'
              showIcon
              message='Keep your API keys secret. They provide full access to submit data on behalf of your organization.'
              style={{ marginBottom: 16 }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <Button
                type='primary'
                icon={<ApiOutlined />}
                onClick={() => {
                  setGenLabel('');
                  setNewRawKey('');
                  setCopied(false);
                  setGenOpen(true);
                }}
              >
                Generate API Key
              </Button>
            </div>

            <Card>
              <Table
                dataSource={apiKeys}
                columns={apiKeyColumns}
                rowKey='id'
                pagination={false}
                locale={{ emptyText: 'No API keys yet. Generate one above.' }}
                size='small'
              />
            </Card>

            {/* Generate key modal */}
            <Modal
              title='Generate API Key'
              open={genOpen}
              onCancel={() => setGenOpen(false)}
              footer={null}
              width={480}
              destroyOnClose
            >
              {!newRawKey ? (
                <>
                  <Text type='secondary' style={{ display: 'block', marginBottom: 16 }}>
                    Give this key a descriptive label so you can identify it later.
                  </Text>
                  <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                    <Input
                      placeholder='e.g. Sharewares Production'
                      value={genLabel}
                      onChange={e => setGenLabel(e.target.value)}
                      onPressEnter={generateKey}
                    />
                    <Button type='primary' loading={generating} onClick={generateKey}>
                      Generate
                    </Button>
                  </Space.Compact>
                </>
              ) : (
                <>
                  <Alert
                    type='warning'
                    showIcon
                    message='Copy this key now — it will not be shown again.'
                    style={{ marginBottom: 16 }}
                  />
                  <div
                    style={{
                      background: '#1a1a2e',
                      borderRadius: 6,
                      padding: '12px 16px',
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <code style={{ flex: 1, color: '#4ade80', fontSize: 12, wordBreak: 'break-all' }}>{newRawKey}</code>
                    <Button
                      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={copyKey}
                      type={copied ? 'default' : 'primary'}
                      size='small'
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
        )}
      </div>
    </div>
  );
}

SettingsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <BaseLayout {...(pageProps as any)} selectedMenuItem='settings' title='Settings'>
    {page}
  </BaseLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { props, redirect } = await checkLogin(context);
  if (redirect) return { redirect };
  if (!props.user) return { redirect: { permanent: false, destination: '/login' } };

  const user = props.user as DashboardUser;

  // Load fresh org profile data
  const org = await prisma.org.findUnique({
    where: { id: user.org.id },
    select: {
      orgType: true,
      country: true,
      city: true,
      employeeCount: true,
      locationCount: true,
      reuseJourneyStage: true,
      primaryChallenge: true
    }
  });

  // Merge new profile fields into user.org
  const enrichedUser = {
    ...user,
    org: { ...user.org, ...org }
  };

  // Load API keys for RSP orgs
  let apiKeys: ApiKeyRow[] = [];
  if (org?.orgType === 'reuse-service-provider') {
    apiKeys = await prisma.rspApiKey.findMany({
      where: { orgId: user.org.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, label: true, keyPrefix: true, isActive: true, createdAt: true, lastUsedAt: true }
    });
  }

  return { props: serializeJSON({ user: enrichedUser, apiKeys }) };
};
