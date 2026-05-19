import { ExperimentOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Empty, Input, InputNumber, Row, Select, Space, Statistic, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

import { RealEngineTests } from './RealEngineTests';

const { Text, Title, Paragraph } = Typography;

// Slugs that route to the real-engine Tests UX (vs. AI executionCode sandbox).
const REAL_ENGINE_SLUGS = new Set(['projections-model', 'actuals-event-model', 'rsp-ingestion-model']);

// ─── Types ──────────────────────────────────────────────────────────────────

export type InputField = {
  key: string;
  label: string;
  type?: 'number' | 'text' | 'select';
  unit?: string;
  defaultValue?: number | string;
  min?: number;
  max?: number;
  helpText?: string;
  options?: Array<{ value: string | number; label: string }>;
};

export type OutputMetric = {
  key: string;
  label: string;
  unit?: string;
  description?: string;
  format?: 'number' | 'currency' | 'percent';
  decimals?: number;
};

type Props = {
  inputSchema: { fields?: unknown[] } | null;
  outputSchema: { metrics?: unknown[] } | null;
  executionCode: string | null;
  productSlug?: string;
  productCategory?: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildInitialValues(fields: InputField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.defaultValue !== undefined) {
      out[f.key] = f.defaultValue;
    } else if (f.type === 'number' || !f.type) {
      out[f.key] = 0;
    } else {
      out[f.key] = '';
    }
  }
  return out;
}

function formatMetric(value: unknown, metric: OutputMetric): string {
  if (value === null || value === undefined || (typeof value === 'number' && !Number.isFinite(value))) {
    return '—';
  }
  if (typeof value !== 'number') return String(value);

  const decimals = metric.decimals ?? (metric.format === 'currency' ? 2 : 2);
  if (metric.format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
  if (metric.format === 'percent') {
    return `${(value * 100).toFixed(decimals)}%`;
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Run user-supplied JS body as `(inputs) => outputs`. Uses `new Function`, which
 * is eval-adjacent — this is an admin-only, upstream-gated page, so acceptable
 * in exchange for a realtime calculator experience without a server round-trip.
 */
function runExecutionCode(code: string, inputs: Record<string, unknown>): Record<string, unknown> {
  // Wrap in a function that always returns an object
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function('inputs', `"use strict"; ${code}`) as (i: Record<string, unknown>) => unknown;
  const result = fn(inputs);
  if (result && typeof result === 'object') return result as Record<string, unknown>;
  return {};
}

// ─── Component ──────────────────────────────────────────────────────────────

export function LiveCalculator({ inputSchema, outputSchema, executionCode, productSlug, productCategory }: Props) {
  const fields = useMemo<InputField[]>(() => (inputSchema?.fields as InputField[] | undefined) ?? [], [inputSchema]);
  const metrics = useMemo<OutputMetric[]>(
    () => (outputSchema?.metrics as OutputMetric[] | undefined) ?? [],
    [outputSchema]
  );

  // Real-engine path: delegate the entire Tests tab. Skips the AI executionCode sandbox.
  if (productSlug && REAL_ENGINE_SLUGS.has(productSlug)) {
    return (
      <RealEngineTests
        productSlug={productSlug}
        productCategory={productCategory ?? 'default'}
        outputMetrics={metrics}
      />
    );
  }

  const [values, setValues] = useState<Record<string, unknown>>(() => buildInitialValues(fields));
  const [outputs, setOutputs] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  // Reset values when the fields change (e.g. after AI regeneration or manual schema edit)
  const fieldKeysRef = useRef('');
  useEffect(() => {
    const sig = fields.map(f => f.key).join('|');
    if (sig !== fieldKeysRef.current) {
      fieldKeysRef.current = sig;
      setValues(buildInitialValues(fields));
    }
  }, [fields]);

  // Recompute outputs whenever inputs or the executionCode change
  useEffect(() => {
    if (!executionCode) {
      setOutputs({});
      setError(null);
      return;
    }
    try {
      const out = runExecutionCode(executionCode, values);
      setOutputs(out);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Execution failed');
      setOutputs({});
    }
  }, [executionCode, values]);

  const handleChange = (key: string, v: unknown) => {
    setValues(prev => ({ ...prev, [key]: v }));
  };

  const handleReset = () => setValues(buildInitialValues(fields));

  // ─── Empty states ─────────────────────────────────────────────────────────

  if (!inputSchema?.fields?.length && !outputSchema?.metrics?.length && !executionCode) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Paragraph type='secondary'>
                No calculator is defined for this data product yet. Go to the <strong>AI Designer</strong> tab and
                generate a flow — the AI will populate input fields, output metrics, and the execution logic
                automatically.
              </Paragraph>
              <Paragraph type='secondary' style={{ fontSize: 12 }}>
                You can also define inputs, outputs, and execution code manually via the <strong>Inputs</strong> and{' '}
                <strong>Outputs</strong> tabs.
              </Paragraph>
            </div>
          }
        />
      </Card>
    );
  }

  if (!executionCode) {
    return (
      <Alert
        type='warning'
        showIcon
        icon={<WarningOutlined />}
        message='No execution code'
        description='Input and output schemas exist, but no execution code has been generated. Rerun the AI Designer to produce live calculation logic.'
      />
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <ExperimentOutlined style={{ fontSize: 22, color: '#722ed1' }} />
        <Title level={4} style={{ margin: 0 }}>
          Live Calculator
        </Title>
        <Text type='secondary' style={{ fontSize: 12 }}>
          Enter inputs on the left — outputs update in real time.
        </Text>
        <div style={{ flex: 1 }} />
        <Button size='small' icon={<ReloadOutlined />} onClick={handleReset}>
          Reset to defaults
        </Button>
      </div>

      <Row gutter={24}>
        {/* ── Inputs ── */}
        <Col xs={24} md={10}>
          <Card title='Inputs' size='small' style={{ height: '100%' }}>
            {fields.length === 0 ? (
              <Text type='secondary' style={{ fontSize: 12 }}>
                No input fields defined.
              </Text>
            ) : (
              <Space direction='vertical' size={16} style={{ width: '100%' }}>
                {fields.map(field => (
                  <div key={field.key}>
                    <div style={{ marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 13 }}>
                        {field.label}
                      </Text>
                      {field.unit && (
                        <Text type='secondary' style={{ fontSize: 11, marginLeft: 6 }}>
                          ({field.unit})
                        </Text>
                      )}
                    </div>
                    {field.type === 'select' && field.options ? (
                      <Select
                        style={{ width: '100%' }}
                        value={values[field.key] as string}
                        onChange={v => handleChange(field.key, v)}
                        options={field.options}
                      />
                    ) : field.type === 'text' ? (
                      <Input
                        value={values[field.key] as string}
                        onChange={e => handleChange(field.key, e.target.value)}
                      />
                    ) : (
                      <InputNumber
                        style={{ width: '100%' }}
                        value={values[field.key] as number}
                        onChange={v => handleChange(field.key, v ?? 0)}
                        min={field.min}
                        max={field.max}
                      />
                    )}
                    {field.helpText && (
                      <Text type='secondary' style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                        {field.helpText}
                      </Text>
                    )}
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>

        {/* ── Outputs ── */}
        <Col xs={24} md={14}>
          <Card title='Outputs' size='small' style={{ height: '100%' }}>
            {error && (
              <Alert
                type='error'
                showIcon
                message='Execution error'
                description={<code style={{ fontSize: 11 }}>{error}</code>}
                style={{ marginBottom: 16 }}
              />
            )}
            {metrics.length === 0 ? (
              <Text type='secondary' style={{ fontSize: 12 }}>
                No output metrics defined.
              </Text>
            ) : (
              <Row gutter={[16, 16]}>
                {metrics.map(metric => (
                  <Col xs={24} sm={12} key={metric.key}>
                    <Card size='small' style={{ background: '#fafafa' }}>
                      <Statistic
                        title={
                          <div>
                            <div>{metric.label}</div>
                            {metric.description && (
                              <Text type='secondary' style={{ fontSize: 10, fontWeight: 400 }}>
                                {metric.description}
                              </Text>
                            )}
                          </div>
                        }
                        value={formatMetric(outputs[metric.key], metric)}
                        suffix={
                          metric.unit && metric.format !== 'currency' && metric.format !== 'percent' ? (
                            <Text type='secondary' style={{ fontSize: 12 }}>
                              {metric.unit}
                            </Text>
                          ) : undefined
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
