import { useState } from 'react';

import { NodeIndexOutlined } from '@ant-design/icons';
import { Alert, Button, Radio, Select, Space, Tag, Typography } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import useSWR from 'swr';

const { Text } = Typography;

const DEFAULT_PAYLOAD = JSON.stringify(
  {
    client_id: 'sharewares-client-001',
    date_min: '2026-01-01',
    date_max: '2026-01-31',
    events: [
      { reusable_type: 'plate', out_warehouse_events: 500, in_warehouse_events: 470 },
      { reusable_type: 'cup', out_warehouse_events: 300, in_warehouse_events: 280 }
    ]
  },
  null,
  2
);

type ApiKey = {
  id: string;
  label: string;
  keyPrefix: string;
  isActive: boolean;
  org: { id: string; name: string };
};

type ValidationCheck = { name: string; passed: boolean; message?: string };

type ValidateResult = {
  mode: 'validate';
  valid: boolean;
  checks: ValidationCheck[];
  overlapCount: number;
  overlappingPeriodIds: string[];
};

type IngestModeResult = {
  mode: 'ingest';
  newPeriodId: string;
  overlappingCount: number;
  metrics: {
    co2AvoidedKg: number;
    waterSavedGallons: number;
    wasteDivertedLbs: number;
    totalUnits: number;
  };
};

type PlaygroundResult = ValidateResult | IngestModeResult;

interface PlaygroundPanelProps {
  onIngest: (newPeriodId: string) => void;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function PlaygroundPanel({ onIngest }: PlaygroundPanelProps) {
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [apiKeyId, setApiKeyId] = useState<string>('');
  const [mode, setMode] = useState<'validate' | 'ingest'>('validate');
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: keysData } = useSWR<ApiKey[]>('/api/admin/rsp/api-keys', fetcher);
  const activeKeys = Array.isArray(keysData) ? keysData.filter(k => k.isActive) : [];

  async function handleRun() {
    setError(null);
    setResult(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadText);
    } catch {
      setError('Invalid JSON — please check your payload syntax');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/data-map/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeyId, mode, payload: parsed })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `Request failed with status ${res.status}`);
      } else {
        setResult(data as PlaygroundResult);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {mode === 'ingest' && (
        <Alert
          type='warning'
          showIcon
          message='Ingest mode writes to the production database'
          style={{ marginBottom: 16 }}
        />
      )}

      <Space direction='vertical' style={{ width: '100%' }}>
        {/* API key select */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 4 }}>
            API Key
          </Text>
          <Select
            placeholder='Select an active API key'
            style={{ width: '100%' }}
            value={apiKeyId || undefined}
            onChange={val => setApiKeyId(val)}
            options={activeKeys.map(k => ({
              label: `${k.org.name} — ${k.keyPrefix}...`,
              value: k.id
            }))}
            notFoundContent='No active API keys found'
          />
        </div>

        {/* Mode radio */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 4 }}>
            Mode
          </Text>
          <Radio.Group
            value={mode}
            onChange={e => {
              setMode(e.target.value as 'validate' | 'ingest');
              setResult(null);
              setError(null);
            }}
            options={[
              { label: 'Validate Only', value: 'validate' },
              { label: 'Ingest', value: 'ingest' }
            ]}
          />
        </div>

        {/* JSON textarea */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 4 }}>
            Paste RSP payload JSON (same format as POST /api/rsp/usage)
          </Text>
          <TextArea
            rows={16}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
            value={payloadText}
            onChange={e => setPayloadText(e.target.value)}
          />
        </div>

        {/* Run button */}
        <Button type='primary' disabled={!apiKeyId || loading} loading={loading} onClick={handleRun}>
          {mode === 'validate' ? 'Validate Payload' : 'Run Ingest'}
        </Button>

        {/* Error display */}
        {error && <Alert type='error' showIcon message={error} />}

        {/* Result display */}
        {result && result.mode === 'validate' && (
          <div>
            <Alert
              type={result.valid ? 'success' : 'error'}
              showIcon
              message={result.valid ? 'Payload valid' : 'Payload has errors'}
              style={{ marginBottom: 8 }}
            />
            <Space wrap style={{ marginBottom: 8 }}>
              {result.checks.map(c => (
                <Tag key={c.name} color={c.passed ? 'green' : 'red'}>
                  {c.name}
                </Tag>
              ))}
            </Space>
            {result.overlapCount > 0 && (
              <Alert
                type='warning'
                showIcon
                message={`Overlap: ${result.overlapCount} active period(s) would be superseded`}
              />
            )}
          </div>
        )}

        {result && result.mode === 'ingest' && (
          <div>
            <Alert type='success' showIcon message='Ingest complete' style={{ marginBottom: 8 }} />
            <Space direction='vertical' style={{ width: '100%', marginBottom: 8 }}>
              <Text>
                <Text strong>Period ID: </Text>
                <Text code>{result.newPeriodId}</Text>
              </Text>
              {result.overlappingCount > 0 && (
                <Text>
                  <Text strong>Superseded: </Text>
                  {result.overlappingCount} previous period(s)
                </Text>
              )}
              <Text>
                <Text strong>CO₂ avoided: </Text>
                {result.metrics.co2AvoidedKg.toFixed(2)} kg
              </Text>
              <Text>
                <Text strong>Water saved: </Text>
                {result.metrics.waterSavedGallons.toFixed(2)} gal
              </Text>
              <Text>
                <Text strong>Waste diverted: </Text>
                {result.metrics.wasteDivertedLbs.toFixed(2)} lbs
              </Text>
              <Text>
                <Text strong>Total units: </Text>
                {result.metrics.totalUnits}
              </Text>
            </Space>
            <Button type='primary' icon={<NodeIndexOutlined />} onClick={() => onIngest(result.newPeriodId)}>
              View in Graph
            </Button>
          </div>
        )}
      </Space>
    </div>
  );
}
