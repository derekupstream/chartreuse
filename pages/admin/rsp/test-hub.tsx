import {
  ApiOutlined,
  CheckCircleFilled,
  CopyOutlined,
  DeleteOutlined,
  KeyOutlined,
  PlusOutlined,
  ReloadOutlined,
  RocketOutlined,
  ShopOutlined,
  ThunderboltOutlined,
  WarningOutlined
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Radio,
  Row,
  Select,
  Slider,
  Space,
  Steps,
  Tag,
  Typography,
  message
} from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { VENUE_CATEGORIES } from 'lib/calculator/constants/venue-categories';
import { STATES } from 'lib/calculator/constants/utilities';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

const { Text, Title, Paragraph } = Typography;

const fetcher = (url: string) => fetch(url).then(r => r.json());

type SimulatedRsp = {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  createdAt: string;
  _count: { accounts: number; rspApiKeys: number };
};

type ClientPreset = { name?: string; venueCategory?: string; state?: string };
type CreatedAccount = { accountId: string; rspClientId: string };
type CreatedKey = { apiKeyId: string; rawKey: string; keyPrefix: string };

const DEFAULT_CLIENT_PRESETS: ClientPreset[] = [
  { name: 'Pacific State University Cafeteria', venueCategory: 'University / College', state: 'California' },
  { name: 'Skyline Stadium', venueCategory: 'Stadium', state: 'Oregon' },
  { name: 'Bluebird Roasters Downtown', venueCategory: 'Coffee Shop', state: 'Washington' }
];

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };
  return { props: serializeJSON({ user }) };
};

function TestHubPage(_: { user: DashboardUser }) {
  const [step, setStep] = useState(0);
  const [selectedRspId, setSelectedRspId] = useState<string | null>(null);
  const [selectedRspName, setSelectedRspName] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<CreatedAccount[]>([]);
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);

  const { data: rspList, mutate: refetchRsps } = useSWR<SimulatedRsp[]>('/api/admin/rsp/simulator/list', fetcher);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <RocketOutlined style={{ fontSize: 24, color: '#722ed1' }} />
        <Title level={2} style={{ margin: 0 }}>
          RSP Test Hub
        </Title>
        <Tag color='purple'>Simulator</Tag>
      </div>
      <Paragraph type='secondary' style={{ marginBottom: 24 }}>
        Spin up simulated Reuse Service Providers, generate API keys, and fire bursts of usage submissions — some
        successful, some misconfigured — to populate the activity feed and exercise Reports / Accounts pages with real
        data.
      </Paragraph>

      <Steps
        current={step}
        items={[
          { title: 'Create or pick an RSP', description: 'Org + client venues' },
          { title: 'Generate an API key', description: 'Optionally misconfigure' },
          { title: 'Generate submissions', description: 'Burst with success/error mix' }
        ]}
        style={{ marginBottom: 32 }}
      />

      {step === 0 && (
        <Step1Rsp
          existing={rspList ?? []}
          onPick={(id, name, accounts) => {
            setSelectedRspId(id);
            setSelectedRspName(name);
            setSelectedAccounts(accounts);
            setStep(1);
            refetchRsps();
          }}
        />
      )}
      {step === 1 && selectedRspId && (
        <Step2Key
          orgName={selectedRspName ?? '(unnamed)'}
          orgId={selectedRspId}
          onCreated={key => {
            setCreatedKey(key);
            setStep(2);
            refetchRsps();
          }}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && createdKey && selectedRspId && (
        <Step3Burst
          orgName={selectedRspName ?? '(unnamed)'}
          createdKey={createdKey}
          accounts={selectedAccounts}
          onDone={() => {
            message.success('Burst complete — check the activity feed');
            setStep(0);
            setSelectedRspId(null);
            setSelectedAccounts([]);
            setCreatedKey(null);
          }}
          onBack={() => setStep(1)}
        />
      )}

      <Divider />
      <Space direction='vertical' size={4}>
        <Text type='secondary'>Next stops:</Text>
        <Space wrap>
          <Link href='/admin/rsp/feed'>
            <Button icon={<ThunderboltOutlined />}>Activity feed</Button>
          </Link>
          <Link href='/admin/rsp/api-keys'>
            <Button icon={<KeyOutlined />}>API keys</Button>
          </Link>
          <Link href='/admin/rsp'>
            <Button icon={<ShopOutlined />}>RSP overview</Button>
          </Link>
        </Space>
      </Space>

      <Divider />
      <WipeSimulatedCard rsps={rspList ?? []} onWiped={() => refetchRsps()} />
    </div>
  );
}

function WipeSimulatedCard({ rsps, onWiped }: { rsps: SimulatedRsp[]; onWiped: () => void }) {
  const [busy, setBusy] = useState(false);

  async function wipe(payload: Record<string, unknown>, description: string) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/rsp/simulator/wipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Wipe failed');
      const { deleted } = json;
      message.success(
        `${description}: removed ${deleted.orgs} org(s), ${deleted.periods} usage periods, ${deleted.activityLogs} activity logs`
      );
      onWiped();
    } catch (err: any) {
      message.error(err?.message ?? 'Wipe failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      size='small'
      title={
        <Space>
          <WarningOutlined style={{ color: '#fa8c16' }} />
          <span>Cleanup</span>
        </Space>
      }
      style={{ borderColor: '#ffd591' }}
    >
      <Paragraph type='secondary' style={{ fontSize: 12, marginBottom: 12 }}>
        Wipe simulated RSPs and all their generated data — accounts, API keys, usage periods, activity logs. Only
        affects orgs flagged <code>metadata.simulated = true</code>. Real customer data is untouched.
      </Paragraph>
      <Space wrap>
        <Popconfirm
          title='Wipe every simulated RSP?'
          description={`Will delete ${rsps.length} simulated org${rsps.length === 1 ? '' : 's'} plus all related data. Cannot be undone.`}
          onConfirm={() => wipe({ allSimulated: true }, 'Wiped all simulated RSPs')}
          okText='Wipe all'
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DeleteOutlined />} loading={busy} disabled={rsps.length === 0}>
            Wipe all simulated ({rsps.length})
          </Button>
        </Popconfirm>
        {rsps.length > 0 && (
          <Space.Compact>
            <Select
              placeholder='Wipe just one'
              style={{ width: 280 }}
              options={rsps.map(r => ({ value: r.id, label: `${r.name} (${r._count.accounts} accts)` }))}
              onChange={id => {
                const rsp = rsps.find(r => r.id === id);
                if (!rsp) return;
                if (window.confirm(`Wipe ${rsp.name} and all its data? This cannot be undone.`)) {
                  wipe({ orgId: id }, `Wiped ${rsp.name}`);
                }
              }}
            />
          </Space.Compact>
        )}
      </Space>
    </Card>
  );
}

// ─── Step 1 ─────────────────────────────────────────────────────────────────

function Step1Rsp({
  existing,
  onPick
}: {
  existing: SimulatedRsp[];
  onPick: (id: string, name: string, accounts: CreatedAccount[]) => void;
}) {
  const [mode, setMode] = useState<'new' | 'existing'>(existing.length > 0 ? 'existing' : 'new');
  const [name, setName] = useState('');
  const [country, setCountry] = useState<'United States' | 'Canada'>('United States');
  const [washFacilityType, setWashFacilityType] = useState<'commercial_dishwasher' | 'industrial' | 'manual'>(
    'commercial_dishwasher'
  );
  const [washEnergySource, setWashEnergySource] = useState<
    'grid_electric' | 'natural_gas' | 'solar' | 'hydro' | 'wind'
  >('grid_electric');
  const [clients, setClients] = useState<ClientPreset[]>(DEFAULT_CLIENT_PRESETS);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      message.error('Name is required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/rsp/simulator/create-rsp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          profile: { country, washFacilityType, washEnergySource },
          clients
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Create failed');
      message.success(`Created ${name} with ${json.accounts.length} client venues`);
      onPick(json.orgId, name.trim(), json.accounts);
    } catch (err: any) {
      message.error(err?.message ?? 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  async function handlePickExisting(rsp: SimulatedRsp) {
    // Fetch the RSP's accounts — burst endpoint accepts accountIds; we need the list to skip step
    const res = await fetch(`/api/admin/rsp/orgs?id=${rsp.id}`);
    if (!res.ok) {
      // Endpoint may not exist; still proceed — the burst endpoint can default to all the org's accounts
      onPick(rsp.id, rsp.name, []);
      return;
    }
    const json = await res.json();
    const accounts = (json.accounts ?? []).map((a: any) => ({
      accountId: a.id,
      rspClientId: a.rspClientId
    }));
    onPick(rsp.id, rsp.name, accounts);
  }

  return (
    <Card title='Step 1 — Create or pick a simulated RSP'>
      <Radio.Group value={mode} onChange={e => setMode(e.target.value)} style={{ marginBottom: 16 }}>
        <Radio.Button value='existing' disabled={existing.length === 0}>
          Pick existing ({existing.length})
        </Radio.Button>
        <Radio.Button value='new'>Create new</Radio.Button>
      </Radio.Group>

      {mode === 'existing' ? (
        existing.length === 0 ? (
          <Alert type='info' message='No simulated RSPs yet — create one to get started.' />
        ) : (
          <Space direction='vertical' style={{ width: '100%' }}>
            {existing.map(r => (
              <Card key={r.id} size='small' hoverable onClick={() => handlePickExisting(r)}>
                <Row justify='space-between' align='middle'>
                  <Col>
                    <Text strong>{r.name}</Text>{' '}
                    <Text type='secondary'>
                      {r.country ?? '—'} · {r._count.accounts} client venues · {r._count.rspApiKeys} keys
                    </Text>
                  </Col>
                  <Col>
                    <Tag>created {new Date(r.createdAt).toLocaleDateString()}</Tag>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        )
      ) : (
        <Form layout='vertical'>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label='RSP Name' required>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder='Sharewares Inc.' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label='Country'>
                <Select
                  value={country}
                  onChange={v => setCountry(v)}
                  options={[
                    { value: 'United States', label: 'United States' },
                    { value: 'Canada', label: 'Canada' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label='Wash Facility Type'>
                <Select
                  value={washFacilityType}
                  onChange={v => setWashFacilityType(v)}
                  options={[
                    { value: 'commercial_dishwasher', label: 'Commercial Dishwasher' },
                    { value: 'industrial', label: 'Industrial' },
                    { value: 'manual', label: 'Manual / Hand Wash' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label='Wash Energy Source'>
                <Select
                  value={washEnergySource}
                  onChange={v => setWashEnergySource(v)}
                  options={[
                    { value: 'grid_electric', label: 'Grid Electric' },
                    { value: 'natural_gas', label: 'Natural Gas' },
                    { value: 'solar', label: 'Solar' },
                    { value: 'hydro', label: 'Hydropower' },
                    { value: 'wind', label: 'Wind' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation='left' style={{ fontSize: 13 }}>
            Client venues
          </Divider>
          <Paragraph type='secondary' style={{ fontSize: 12 }}>
            These are the accounts the RSP will report on. Each gets a fake rspClientId.
          </Paragraph>
          {clients.map((c, idx) => (
            <Row key={idx} gutter={8} style={{ marginBottom: 8 }}>
              <Col flex='auto'>
                <Input
                  placeholder='Venue name'
                  value={c.name}
                  onChange={e => {
                    const next = [...clients];
                    next[idx] = { ...c, name: e.target.value };
                    setClients(next);
                  }}
                />
              </Col>
              <Col span={6}>
                <Select
                  style={{ width: '100%' }}
                  placeholder='Venue category'
                  value={c.venueCategory}
                  onChange={v => {
                    const next = [...clients];
                    next[idx] = { ...c, venueCategory: v };
                    setClients(next);
                  }}
                  options={VENUE_CATEGORIES.map(v => ({ value: v, label: v }))}
                />
              </Col>
              <Col span={5}>
                <Select
                  style={{ width: '100%' }}
                  placeholder='State'
                  value={c.state}
                  showSearch
                  onChange={v => {
                    const next = [...clients];
                    next[idx] = { ...c, state: v };
                    setClients(next);
                  }}
                  options={STATES.map(s => ({ value: s.name, label: s.name }))}
                />
              </Col>
              <Col span={1}>
                <Button danger onClick={() => setClients(clients.filter((_, i) => i !== idx))}>
                  ×
                </Button>
              </Col>
            </Row>
          ))}
          <Button
            icon={<PlusOutlined />}
            onClick={() => setClients([...clients, { name: '', venueCategory: 'Other', state: 'California' }])}
            style={{ marginBottom: 16 }}
          >
            Add client venue
          </Button>

          <div style={{ textAlign: 'right' }}>
            <Button type='primary' onClick={handleCreate} loading={creating} icon={<RocketOutlined />}>
              Create RSP
            </Button>
          </div>
        </Form>
      )}
    </Card>
  );
}

// ─── Step 2 ─────────────────────────────────────────────────────────────────

function Step2Key({
  orgId,
  orgName,
  onCreated,
  onBack
}: {
  orgId: string;
  orgName: string;
  onCreated: (key: CreatedKey) => void;
  onBack: () => void;
}) {
  const [label, setLabel] = useState(`Sim key — ${new Date().toISOString().slice(0, 10)}`);
  const [misconfig, setMisconfig] = useState<'none' | 'expired' | 'inactive'>('none');
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<CreatedKey | null>(null);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/rsp/simulator/create-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, label, misconfig })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Create failed');
      setRevealed(json);
    } catch (err: any) {
      message.error(err?.message ?? 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card title={`Step 2 — Generate API key for ${orgName}`} extra={<Button onClick={onBack}>← Back</Button>}>
      {!revealed ? (
        <Form layout='vertical'>
          <Form.Item label='Key label'>
            <Input value={label} onChange={e => setLabel(e.target.value)} />
          </Form.Item>
          <Form.Item
            label='Misconfiguration'
            help='Useful for simulating real customer pain points — they keep auth-failing because they did this.'
          >
            <Radio.Group value={misconfig} onChange={e => setMisconfig(e.target.value)}>
              <Radio.Button value='none'>None — works correctly</Radio.Button>
              <Radio.Button value='expired'>Expired</Radio.Button>
              <Radio.Button value='inactive'>Inactive</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button type='primary' onClick={handleCreate} loading={creating} icon={<KeyOutlined />}>
              Generate key
            </Button>
          </div>
        </Form>
      ) : (
        <>
          <Alert
            type='success'
            showIcon
            message='API key created'
            description='Copy it now — the raw value is only shown once.'
            style={{ marginBottom: 16 }}
          />
          <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
            <Input value={revealed.rawKey} readOnly style={{ fontFamily: 'monospace' }} />
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(revealed.rawKey);
                message.success('Copied');
              }}
            >
              Copy
            </Button>
          </Space.Compact>
          <div style={{ textAlign: 'right' }}>
            <Button type='primary' onClick={() => onCreated(revealed)}>
              Continue → Step 3
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Step 3 ─────────────────────────────────────────────────────────────────

function Step3Burst({
  orgName,
  createdKey,
  accounts,
  onDone,
  onBack
}: {
  orgName: string;
  createdKey: CreatedKey;
  accounts: CreatedAccount[];
  onDone: () => void;
  onBack: () => void;
}) {
  const [submissionsPerAccount, setSubmissionsPerAccount] = useState(6);
  const [granularity, setGranularity] = useState<'weekly' | 'monthly'>('monthly');
  const [errorRate, setErrorRate] = useState(0.15);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ totalSubmissions: number; successCount: number; errorCount: number } | null>(
    null
  );

  async function handleRun() {
    setRunning(true);
    try {
      const res = await fetch('/api/admin/rsp/simulator/burst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKeyId: createdKey.apiKeyId,
          accountIds: accounts.length ? accounts.map(a => a.accountId) : undefined,
          submissionsPerAccount,
          granularity,
          errorRate
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Burst failed');
      setResult(json);
    } catch (err: any) {
      message.error(err?.message ?? 'Burst failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card title={`Step 3 — Generate submissions for ${orgName}`} extra={<Button onClick={onBack}>← Back</Button>}>
      {!result ? (
        <Form layout='vertical'>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label='Submissions per account'>
                <InputNumber
                  min={1}
                  max={36}
                  value={submissionsPerAccount}
                  onChange={v => setSubmissionsPerAccount(v ?? 1)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label='Period granularity'>
                <Radio.Group value={granularity} onChange={e => setGranularity(e.target.value)}>
                  <Radio.Button value='weekly'>Weekly</Radio.Button>
                  <Radio.Button value='monthly'>Monthly</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label={`Error rate: ${Math.round(errorRate * 100)}%`}
            help='Some submissions will fail with auth, validation, or server errors.'
          >
            <Slider min={0} max={1} step={0.05} value={errorRate} onChange={setErrorRate} />
          </Form.Item>
          <Paragraph type='secondary' style={{ fontSize: 12 }}>
            Will generate <strong>{submissionsPerAccount * Math.max(accounts.length, 1)}</strong> submissions across{' '}
            <strong>{Math.max(accounts.length, 1)}</strong> account(s).
          </Paragraph>
          <div style={{ textAlign: 'right' }}>
            <Button type='primary' onClick={handleRun} loading={running} icon={<ThunderboltOutlined />}>
              Run burst
            </Button>
          </div>
        </Form>
      ) : (
        <>
          <Alert
            type='success'
            showIcon
            icon={<CheckCircleFilled />}
            message='Burst complete'
            description={
              <span>
                {result.totalSubmissions} submissions — <strong>{result.successCount}</strong> succeeded,{' '}
                <strong>{result.errorCount}</strong> errored. Open the activity feed to see them roll in.
              </span>
            }
            style={{ marginBottom: 16 }}
          />
          <Space>
            <Link href='/admin/rsp/feed'>
              <Button type='primary' icon={<ThunderboltOutlined />}>
                View activity feed
              </Button>
            </Link>
            <Link href={`/admin/rsp/keys/${createdKey.apiKeyId}`}>
              <Button icon={<KeyOutlined />}>View this key&apos;s timeline</Button>
            </Link>
            <Button icon={<ReloadOutlined />} onClick={onDone}>
              Start over
            </Button>
          </Space>
        </>
      )}
    </Card>
  );
}

TestHubPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='rsp/test-hub' title='RSP Test Hub'>
    {page}
  </AdminLayout>
);

export default TestHubPage;
