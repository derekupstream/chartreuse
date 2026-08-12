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

const { Paragraph, Title } = Typography;

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
