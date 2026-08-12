/**
 * The integration guide an RSP sees next to their API keys.
 *
 * Until now the Settings tab named the endpoint and stopped there, so a partner had no way to
 * learn the payload shape, the `reusable_type` vocabulary, or that an unmapped `client_id`
 * ingests silently into nothing. The full written spec is `docs/RSP-API.md`; this is the part
 * a developer needs while they have a key in front of them.
 */
import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Collapse, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

import { knownReusableTypes } from 'lib/rsp/payloadWarnings';

const { Paragraph, Text, Title } = Typography;

const WARNING_MEANINGS: { code: string; meaning: string }[] = [
  {
    code: 'unlinked_client_id',
    meaning:
      'Dry runs only: this client_id resolves to no account yet, so a real submission will create one. If the customer already uses Chart-Reuse, ask Upstream to link first.'
  },
  {
    code: 'client_account_created',
    meaning:
      'This submission created a new account for a first-time client_id. Expected when onboarding a customer; on a typo it means a duplicate to merge.'
  },
  {
    code: 'unknown_reusable_type',
    meaning: 'A type was priced with generic fallback factors, making those results approximate.'
  },
  {
    code: 'duplicate_reusable_type',
    meaning: 'The same type appeared twice in events[]. Each entry is stored separately, not summed.'
  },
  {
    code: 'no_outbound_events',
    meaning: 'Every out_warehouse_events was zero, so all impact is zero. Usually outbound and inbound were swapped.'
  }
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ position: 'relative' }}>
      <pre
        style={{
          background: '#1a1a2e',
          color: '#e2e8f0',
          borderRadius: 6,
          padding: '14px 16px',
          fontSize: 12,
          overflowX: 'auto',
          margin: 0
        }}
      >
        {code}
      </pre>
      <Button
        size='small'
        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        onClick={copy}
        style={{ position: 'absolute', top: 8, right: 8 }}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

const DRY_RUN_CURL = `curl -X POST https://chartreuse-bay.vercel.app/api/rsp/usage \\
  -H "Authorization: Bearer cr_rsp_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dry_run": true,
    "client_id": "YOUR_CLIENT_ID",
    "date_min": "2026-07-01",
    "date_max": "2026-07-31",
    "events": [
      { "reusable_type": "cup", "out_warehouse_events": 12400, "in_warehouse_events": 11780 }
    ]
  }'`;

const RESPONSE_EXAMPLE = `{
  "api_signature": "cr-period-8f3c...",
  "status": "accepted",
  "period": { "id": "8f3c...", "date_min": "2026-07-01", "date_max": "2026-07-31", "superseded_count": 0 },
  "metrics": {
    "co2_avoided_kg": 145.51,
    "water_saved_gallons": 5580,
    "waste_diverted_lbs": 403,
    "single_use_equivalents": 15500
  },
  "warnings": []
}`;

const PIPELINE = `Your system
    │
    ▼
POST /api/rsp/usage ─────────── HTTPS · Bearer key (SHA-256 hashed at rest)
    │
    ▼
Schema validation ───────────── 400 names the failing field, e.g. events[2].reusable_type
    │
    ▼
Normalization ───────────────── reusable_type lowercased; unknown types priced with
    │                           fallback factors + unknown_reusable_type warning
    ▼
Record matching ─────────────── client_id → client account (unique per provider);
    │                           first-time client_id creates the account
    ▼
Impact calculation ──────────── out_warehouse_events × per-type factors
    │                           → kg CO2e · gal water · lbs waste · items displaced
    ▼
Period stored ───────────────── overlapping date ranges SUPERSEDE the older record;
    │                           superseded versions retained for audit, never counted
    ▼
Available immediately ───────── API response · customer dashboard ·
                                your Settings totals · GET /api/rsp/impact`;

const SCHEMA_ROWS = [
  {
    field: 'client_id',
    type: 'string',
    req: 'required',
    notes:
      'Your stable ID for the customer. Case-sensitive. Unique per provider — this is the matching key; a new value creates a new client account.'
  },
  {
    field: 'client_name',
    type: 'string',
    req: 'optional',
    notes: 'Display name used only if this submission creates the account.'
  },
  {
    field: 'date_min',
    type: 'string (YYYY-MM-DD)',
    req: 'required',
    notes: 'First day of the reporting period. Plain date, no timezone.'
  },
  { field: 'date_max', type: 'string (YYYY-MM-DD)', req: 'required', notes: 'Last day. Must be on or after date_min.' },
  {
    field: 'events[]',
    type: 'array',
    req: 'required',
    notes: 'One entry per product type per period. Repeats are stored as separate rows and warned about.'
  },
  {
    field: 'events[].reusable_type',
    type: 'string',
    req: 'required',
    notes: 'Product type. Case-insensitive. See supported types below.'
  },
  {
    field: 'events[].out_warehouse_events',
    type: 'integer ≥ 0',
    req: 'required',
    notes: 'Items sent out. This drives all impact metrics.'
  },
  {
    field: 'events[].in_warehouse_events',
    type: 'integer ≥ 0',
    req: 'required',
    notes: 'Items returned. Stored for return-rate reporting; does not drive impact.'
  },
  {
    field: 'dry_run',
    type: 'boolean',
    req: 'optional',
    notes: 'true = validate and price, store nothing. Never creates accounts.'
  }
];

const BEHAVIOR_ROWS = [
  { q: 'Mechanism', a: 'REST over HTTPS, JSON body. No SDK, no file uploads, no webhooks.' },
  { q: 'Single vs bulk', a: 'One customer per request. A batch is a loop of requests — each is independent.' },
  {
    q: 'Create vs update',
    a: 'Submissions only add. To correct a period, re-send the same date range: the new record supersedes the old (superseded_count in the response tells you how many).'
  },
  {
    q: 'Duplicate handling',
    a: 'No duplicate rejection. Overlapping periods supersede; identical re-sends are safe and idempotent in effect.'
  },
  {
    q: 'Processing model',
    a: 'Synchronous. Metrics are computed and returned in the response — there is no ingestion queue; data is on dashboards immediately.'
  },
  {
    q: 'Versioning / history',
    a: 'Superseded periods are retained with a superseded status and excluded from every total. Nothing is silently overwritten.'
  },
  {
    q: 'Partial failure',
    a: 'A request is atomic: it is either stored whole (200) or rejected whole (4xx). Warnings accompany a 200 and mean "stored, but fix this".'
  }
];

/**
 * The data ingestion model, in the code-first shape an integrating engineer expects:
 * pipeline, schema, wire examples, and ingestion semantics (matching, supersession,
 * processing model). A partner asked for exactly this on a call — keep it current
 * with pages/api/rsp/usage.ts.
 */
export function RspIngestionModelCard() {
  return (
    <Card style={{ marginTop: 24 }} title='Data ingestion model'>
      <Paragraph type='secondary' style={{ marginBottom: 16 }}>
        What you can send, in what structure, through what mechanism, and what happens to it after you send it.
      </Paragraph>

      <Title level={5}>Pipeline</Title>
      <CodeBlock code={PIPELINE} />

      <Title level={5} style={{ marginTop: 20 }}>
        Schema — <code>POST /api/rsp/usage</code>
      </Title>
      <Table
        size='small'
        pagination={false}
        rowKey='field'
        dataSource={SCHEMA_ROWS}
        columns={[
          { title: 'Field', dataIndex: 'field', width: 230, render: (v: string) => <code>{v}</code> },
          {
            title: 'Type',
            dataIndex: 'type',
            width: 150,
            render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>
          },
          {
            title: '',
            dataIndex: 'req',
            width: 80,
            render: (v: string) => <Tag color={v === 'required' ? 'blue' : 'default'}>{v}</Tag>
          },
          { title: 'Notes', dataIndex: 'notes' }
        ]}
      />

      <Title level={5} style={{ marginTop: 20 }}>
        Ingestion semantics
      </Title>
      <Table
        size='small'
        pagination={false}
        rowKey='q'
        showHeader={false}
        dataSource={BEHAVIOR_ROWS}
        columns={[
          { title: '', dataIndex: 'q', width: 170, render: (v: string) => <Text strong>{v}</Text> },
          { title: '', dataIndex: 'a' }
        ]}
      />

      <Paragraph type='secondary' style={{ fontSize: 12, marginTop: 16, marginBottom: 0 }}>
        The stored record is: your client_id, the period dates, and the per-type counts — plus the metrics we compute
        from them. There is no mechanism in this API for sending pricing, contracts, routes, or personal data.
      </Paragraph>
    </Card>
  );
}

export function RspApiQuickStart() {
  return (
    <Card style={{ marginTop: 24 }} title='Integration guide'>
      <Space direction='vertical' size={16} style={{ width: '100%' }}>
        <Alert
          type='warning'
          showIcon
          message='Start with a dry run'
          description={
            <>
              Adding <code>&quot;dry_run&quot;: true</code> validates and prices a payload without storing anything. Use
              it to confirm your <code>client_id</code> resolves and your types are recognised before any real data
              lands. A dry run returns <code>period.account_linked</code> — if that is <code>false</code>, your
              submissions will not reach the customer&apos;s dashboard.
            </>
          }
        />

        <div>
          <Title level={5}>Try it</Title>
          <CodeBlock code={DRY_RUN_CURL} />
        </div>

        <div>
          <Title level={5}>Payload fields</Title>
          <Table
            size='small'
            pagination={false}
            rowKey='field'
            dataSource={[
              {
                field: 'client_id',
                notes: 'Your identifier for the customer. Case-sensitive; must match exactly what Upstream mapped.'
              },
              {
                field: 'date_min / date_max',
                notes: 'Reporting period, YYYY-MM-DD. date_max must not precede date_min.'
              },
              {
                field: 'events[].reusable_type',
                notes: 'One of the supported types below. One entry per type per period.'
              },
              {
                field: 'events[].out_warehouse_events',
                notes: 'Items sent out. This is what impact is calculated from. Cannot be negative.'
              },
              {
                field: 'events[].in_warehouse_events',
                notes: 'Items returned. Stored for return-rate reporting; does not drive impact. Cannot be negative.'
              }
            ]}
            columns={[
              { title: 'Field', dataIndex: 'field', width: 220, render: (v: string) => <code>{v}</code> },
              { title: '', dataIndex: 'notes' }
            ]}
          />
        </div>

        <div>
          <Title level={5}>Supported reusable types</Title>
          <Paragraph type='secondary' style={{ marginBottom: 8 }}>
            Case-insensitive. Anything else is accepted but priced with generic fallback factors, which makes those
            results approximate — tell Upstream instead of inventing a name.
          </Paragraph>
          <Space size={[4, 8]} wrap>
            {knownReusableTypes().map(type => (
              <Tag key={type}>{type}</Tag>
            ))}
          </Space>
        </div>

        <Collapse
          ghost
          items={[
            {
              key: 'response',
              label: 'What comes back',
              children: (
                <>
                  <Paragraph type='secondary'>
                    <code>metrics</code> is what Chart-Reuse computed from your payload — comparing it against your own
                    figures is the fastest way to catch a mapping mistake. Re-sending a period does not fail as a
                    duplicate: overlapping earlier periods are superseded, and <code>superseded_count</code> reports how
                    many.
                  </Paragraph>
                  <CodeBlock code={RESPONSE_EXAMPLE} />
                </>
              )
            },
            {
              key: 'warnings',
              label: 'Warnings — problems that still return 200',
              children: (
                <>
                  <Paragraph type='secondary'>
                    A non-empty <code>warnings</code> array means the submission was stored but something is wrong.
                    Treat it as a failed integration test.
                  </Paragraph>
                  <Table
                    size='small'
                    pagination={false}
                    rowKey='code'
                    dataSource={WARNING_MEANINGS}
                    columns={[
                      { title: 'Code', dataIndex: 'code', width: 220, render: (v: string) => <code>{v}</code> },
                      { title: '', dataIndex: 'meaning' }
                    ]}
                  />
                </>
              )
            },
            {
              key: 'errors',
              label: 'Errors',
              children: (
                <Table
                  size='small'
                  pagination={false}
                  rowKey='status'
                  dataSource={[
                    {
                      status: '400',
                      meaning:
                        'Body failed validation. The message names the field, including the index for a bad event.'
                    },
                    { status: '401', meaning: 'Missing, malformed, revoked or deactivated key.' },
                    { status: '405', meaning: 'Anything other than POST.' },
                    {
                      status: '500',
                      meaning: 'A fault on our side. Safe to retry — a failed submission stores nothing.'
                    }
                  ]}
                  columns={[
                    { title: 'Status', dataIndex: 'status', width: 80 },
                    { title: '', dataIndex: 'meaning' }
                  ]}
                />
              )
            },
            {
              key: 'ops',
              label: 'Going live',
              children: (
                <Paragraph type='secondary' style={{ marginBottom: 0 }}>
                  Dry-run one period and confirm <code>warnings</code> is empty and <code>account_linked</code> is true.
                  Dry-run your full set of types to confirm none fall back. Send one real period and check the metrics.
                  Ask Upstream to confirm it appears on the customer&apos;s dashboard. Then backfill history and move to
                  your regular cadence — monthly is typical.
                  <br />
                  <br />
                  To rotate a key: generate the new one, deploy it, then have the old one deactivated. Both work during
                  the overlap.
                </Paragraph>
              )
            }
          ]}
        />
      </Space>
    </Card>
  );
}
