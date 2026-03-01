import { ApiOutlined, DeleteOutlined, KeyOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message
} from 'antd';
import dayjs from 'dayjs';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import useSWR from 'swr';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

const { Text, Title, Paragraph } = Typography;

const REUSABLE_TYPES = ['plate', 'cup', 'bowl', 'container', 'utensils', 'fork', 'knife', 'spoon', 'tray', 'glass'];

type RspOrg = { id: string; name: string };
type EventRow = { reusable_type: string; out_warehouse_events: number; in_warehouse_events: number };

const fetcher = (url: string) => fetch(url).then(r => r.json());

function RspTestHub({ user }: { user: DashboardUser }) {
  const { data: rspsData, isLoading: rspsLoading } = useSWR<{ rsps: RspOrg[] }>('/api/admin/rsp/orgs', fetcher);
  const rsps: RspOrg[] = rspsData?.rsps ?? [];

  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [sessionKey, setSessionKey] = useState<string>('');
  const [generatingKey, setGeneratingKey] = useState(false);

  const [clientId, setClientId] = useState('sharewares-client-001');
  const [dateMin, setDateMin] = useState(dayjs().startOf('month'));
  const [dateMax, setDateMax] = useState(dayjs().endOf('month'));
  const [events, setEvents] = useState<EventRow[]>([
    { reusable_type: 'plate', out_warehouse_events: 500, in_warehouse_events: 470 },
    { reusable_type: 'cup', out_warehouse_events: 300, in_warehouse_events: 280 }
  ]);

  const [sending, setSending] = useState(false);
  const [lastRequest, setLastRequest] = useState<object | null>(null);
  const [lastResponse, setLastResponse] = useState<{ status: number; body: object } | null>(null);

  async function generateKey() {
    if (!selectedOrgId) {
      message.warning('Select an RSP organization first');
      return;
    }
    setGeneratingKey(true);
    try {
      const res = await fetch('/api/admin/rsp/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: selectedOrgId,
          label: `Test Hub Session ${new Date().toISOString().slice(0, 10)}`
        })
      });
      if (!res.ok) throw new Error('Failed to generate key');
      const data = await res.json();
      setSessionKey(data.rawKey);
      message.success('Session key generated — use it to send test requests');
    } catch {
      message.error('Failed to generate API key');
    } finally {
      setGeneratingKey(false);
    }
  }

  async function sendRequest() {
    if (!sessionKey) {
      message.warning('Generate a session key first');
      return;
    }
    const body = {
      client_id: clientId,
      date_min: dateMin.format('YYYY-MM-DD'),
      date_max: dateMax.format('YYYY-MM-DD'),
      events
    };
    setLastRequest(body);
    setSending(true);
    try {
      const res = await fetch('/api/rsp/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionKey}`
        },
        body: JSON.stringify(body)
      });
      const resBody = await res.json();
      setLastResponse({ status: res.status, body: resBody });
    } catch (err: any) {
      setLastResponse({ status: 0, body: { error: err.message } });
    } finally {
      setSending(false);
    }
  }

  function addEvent() {
    setEvents(prev => [...prev, { reusable_type: 'bowl', out_warehouse_events: 100, in_warehouse_events: 90 }]);
  }

  function removeEvent(idx: number) {
    setEvents(prev => prev.filter((_, i) => i !== idx));
  }

  function updateEvent(idx: number, field: keyof EventRow, value: string | number) {
    setEvents(prev => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  }

  const responseOk = lastResponse?.status === 200;

  return (
    <>
      <Title level={2} style={{ marginBottom: 4 }}>
        RSP API Test Hub
      </Title>
      <Paragraph type='secondary' style={{ marginBottom: 24 }}>
        Simulate exactly how Sharewares (or any RSP client) submits usage data via <code>POST /api/rsp/usage</code>.
        Tests the real authentication and data storage pipeline end-to-end.
      </Paragraph>

      <Row gutter={[24, 24]}>
        {/* Left: config + builder */}
        <Col xs={24} lg={14}>
          {/* Step 1: Select org + generate key */}
          <Card
            title={
              <>
                <KeyOutlined style={{ marginRight: 8 }} />
                Step 1: Select RSP & Generate Session Key
              </>
            }
            style={{ marginBottom: 16 }}
          >
            <Space direction='vertical' style={{ width: '100%' }}>
              <Select
                placeholder='Select RSP organization'
                style={{ width: '100%' }}
                loading={rspsLoading}
                value={selectedOrgId || undefined}
                onChange={val => {
                  setSelectedOrgId(val);
                  setSessionKey('');
                }}
                options={rsps.map(r => ({ label: r.name, value: r.id }))}
              />
              <Button icon={<KeyOutlined />} onClick={generateKey} loading={generatingKey} disabled={!selectedOrgId}>
                Generate Session Key
              </Button>

              {sessionKey && (
                <div>
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    Session key (stored in memory only — not shown again after page reload):
                  </Text>
                  <div
                    style={{
                      background: '#1a1a2e',
                      borderRadius: 6,
                      padding: '10px 14px',
                      marginTop: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <code style={{ flex: 1, color: '#4ade80', fontSize: 11, wordBreak: 'break-all' }}>
                      {sessionKey}
                    </code>
                  </div>
                </div>
              )}
            </Space>
          </Card>

          {/* Step 2: Build request */}
          <Card
            title={
              <>
                <ApiOutlined style={{ marginRight: 8 }} />
                Step 2: Build Request
              </>
            }
            extra={<Tag color='blue'>POST /api/rsp/usage</Tag>}
          >
            <Form layout='vertical'>
              <Form.Item label='client_id' style={{ marginBottom: 12 }}>
                <Input
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  placeholder='sharewares-client-001'
                />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='date_min' style={{ marginBottom: 12 }}>
                    <DatePicker style={{ width: '100%' }} value={dateMin} onChange={v => v && setDateMin(v)} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='date_max' style={{ marginBottom: 12 }}>
                    <DatePicker style={{ width: '100%' }} value={dateMax} onChange={v => v && setDateMax(v)} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label='events'>
                {events.map((ev, idx) => (
                  <Row key={idx} gutter={8} style={{ marginBottom: 8, alignItems: 'center' }}>
                    <Col span={8}>
                      <Select
                        value={ev.reusable_type}
                        style={{ width: '100%' }}
                        onChange={v => updateEvent(idx, 'reusable_type', v)}
                        options={REUSABLE_TYPES.map(t => ({ label: t, value: t }))}
                      />
                    </Col>
                    <Col span={7}>
                      <InputNumber
                        style={{ width: '100%' }}
                        addonBefore='Out'
                        value={ev.out_warehouse_events}
                        min={0}
                        onChange={v => updateEvent(idx, 'out_warehouse_events', v ?? 0)}
                      />
                    </Col>
                    <Col span={7}>
                      <InputNumber
                        style={{ width: '100%' }}
                        addonBefore='In'
                        value={ev.in_warehouse_events}
                        min={0}
                        onChange={v => updateEvent(idx, 'in_warehouse_events', v ?? 0)}
                      />
                    </Col>
                    <Col span={2}>
                      <Button
                        icon={<DeleteOutlined />}
                        size='small'
                        danger
                        onClick={() => removeEvent(idx)}
                        disabled={events.length === 1}
                      />
                    </Col>
                  </Row>
                ))}
                <Button size='small' icon={<PlusOutlined />} onClick={addEvent} style={{ marginTop: 4 }}>
                  Add event type
                </Button>
              </Form.Item>

              <Divider />
              <Button
                type='primary'
                icon={<SendOutlined />}
                onClick={sendRequest}
                loading={sending}
                disabled={!sessionKey}
                size='large'
                block
              >
                Send Request to /api/rsp/usage
              </Button>
              {!sessionKey && (
                <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 4, textAlign: 'center' }}>
                  Generate a session key in Step 1 first
                </Text>
              )}
            </Form>
          </Card>
        </Col>

        {/* Right: request + response */}
        <Col xs={24} lg={10}>
          <Card title='Request / Response' style={{ position: 'sticky', top: 16 }}>
            {!lastRequest && !sending && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#8c8c8c' }}>
                <SendOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
                <Text type='secondary'>Send a request to see the output here</Text>
              </div>
            )}

            {sending && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Spin size='large' />
                <Text type='secondary' style={{ display: 'block', marginTop: 12 }}>
                  Sending to /api/rsp/usage...
                </Text>
              </div>
            )}

            {lastRequest && !sending && (
              <>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  Request body
                </Text>
                <pre
                  style={{
                    background: '#f5f5f5',
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 11,
                    overflow: 'auto',
                    maxHeight: 220,
                    marginBottom: 16
                  }}
                >
                  {JSON.stringify(lastRequest, null, 2)}
                </pre>

                {lastResponse && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text strong>Response</Text>
                      <Tag color={responseOk ? 'green' : 'red'}>HTTP {lastResponse.status}</Tag>
                    </div>
                    {responseOk && (
                      <Alert
                        type='success'
                        message='Request accepted — data stored in database'
                        showIcon
                        style={{ marginBottom: 8 }}
                      />
                    )}
                    {!responseOk && (
                      <Alert type='error' message='Request failed' showIcon style={{ marginBottom: 8 }} />
                    )}
                    <pre
                      style={{
                        background: responseOk ? '#f6ffed' : '#fff2f0',
                        borderRadius: 6,
                        padding: 12,
                        fontSize: 11,
                        overflow: 'auto',
                        maxHeight: 280
                      }}
                    >
                      {JSON.stringify(lastResponse.body, null, 2)}
                    </pre>
                    {responseOk && (
                      <Button href='/admin/rsp' style={{ marginTop: 8 }} block>
                        View stored periods in RSP Dashboard →
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
}

RspTestHub.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='rsp/test-hub' title='RSP Test Hub'>
    {page}
  </AdminLayout>
);

export default RspTestHub;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };
  return { props: serializeJSON({ user }) };
};
