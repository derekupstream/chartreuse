import {
  CheckCircleFilled,
  CloseCircleFilled,
  DatabaseOutlined,
  EditOutlined,
  ExperimentOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import {
  PROJECTIONS_FIXTURE_FIELDS,
  applyFixtureValues as applyProjectionsFixtureValues,
  extractFixtureValues as extractProjectionsFixtureValues,
  type FixtureField,
  type FixtureValues
} from 'lib/admin/projectionsFixture';
import {
  EVENT_FIXTURE_FIELDS,
  applyEventFixtureValues,
  applyFoodwareItemEdit,
  extractEventFixtureValues
} from 'lib/admin/eventFixture';
import {
  RSP_FIXTURE_FIELDS,
  applyRspFixtureValues,
  applyRspUsageRowEdit,
  extractRspFixtureValues
} from 'lib/admin/rspFixture';
import type { ProjectInventory } from 'lib/inventory/types/projects';

import { EventFoodwareEditor } from './EventFoodwareEditor';
import { RspUsageRowsEditor } from './RspUsageRowsEditor';

const ENGINE_ENDPOINT_BY_SLUG: Record<string, string> = {
  'projections-model': '/api/admin/data-products/run-projections',
  'actuals-event-model': '/api/admin/data-products/run-projections',
  'rsp-ingestion-model': '/api/admin/data-products/run-rsp-ingestion'
};

const ENGINE_INPUT_KEY_BY_SLUG: Record<string, 'inventory' | 'input'> = {
  'projections-model': 'inventory',
  'actuals-event-model': 'inventory',
  'rsp-ingestion-model': 'input'
};

type FixtureBinding = {
  fields: FixtureField[];
  extract: (inv: any) => FixtureValues;
  apply: (inv: any, values: FixtureValues) => any;
};

const FIXTURE_BY_SLUG: Record<string, FixtureBinding> = {
  'projections-model': {
    fields: PROJECTIONS_FIXTURE_FIELDS,
    extract: extractProjectionsFixtureValues,
    apply: applyProjectionsFixtureValues
  },
  'actuals-event-model': {
    fields: EVENT_FIXTURE_FIELDS,
    extract: extractEventFixtureValues,
    apply: applyEventFixtureValues
  },
  'rsp-ingestion-model': {
    fields: RSP_FIXTURE_FIELDS,
    extract: extractRspFixtureValues,
    apply: applyRspFixtureValues
  }
};

const { Text, Title, Paragraph } = Typography;

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ─── Types ──────────────────────────────────────────────────────────────────

type DatasetSummary = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  tolerance: number;
  tags: string[];
  createdAt: string;
};

type DatasetFull = DatasetSummary & {
  inputs: ProjectInventory;
  expectedOutputs: unknown;
};

type OutputMetric = {
  key: string;
  label: string;
  unit?: string;
  description?: string;
  format?: 'number' | 'currency' | 'percent';
  decimals?: number;
};

type Props = {
  productSlug: string;
  productCategory: string;
  outputMetrics: unknown;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function formatNumber(value: unknown, metric: OutputMetric): string {
  if (value === null || value === undefined || (typeof value === 'number' && !Number.isFinite(value))) return '—';
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
  if (metric.format === 'percent') return `${(value * 100).toFixed(decimals)}%`;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(
    value
  );
}

function compare(actual: unknown, expected: unknown, tolerance: number): 'pass' | 'fail' | 'na' {
  if (typeof actual !== 'number' || typeof expected !== 'number') return 'na';
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return 'na';
  if (expected === 0) return Math.abs(actual) <= tolerance ? 'pass' : 'fail';
  return Math.abs((actual - expected) / expected) <= tolerance ? 'pass' : 'fail';
}

function normalizeMetrics(raw: unknown): OutputMetric[] {
  if (!Array.isArray(raw)) return [];
  const out: OutputMetric[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const tail = trimmed.split('.').pop() ?? trimmed;
      const label = tail
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, c => c.toUpperCase())
        .trim();
      out.push({ key: trimmed, label });
      continue;
    }
    if (item && typeof item === 'object') {
      const m = item as Partial<OutputMetric>;
      if (typeof m.key === 'string' && m.key.trim()) {
        out.push({
          key: m.key,
          label: typeof m.label === 'string' && m.label ? m.label : m.key,
          unit: m.unit,
          description: m.description,
          format: m.format,
          decimals: m.decimals
        });
      }
    }
  }
  return out;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RealEngineTests({ productSlug, productCategory, outputMetrics }: Props) {
  const [inventory, setInventory] = useState<any | null>(null);
  const [fixtureValues, setFixtureValues] = useState<FixtureValues>({});
  const [inventoryText, setInventoryText] = useState<string>('');
  const [outputs, setOutputs] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedDatasetId, setLoadedDatasetId] = useState<string | null>(null);
  const [loadedDatasetName, setLoadedDatasetName] = useState<string | null>(null);
  const [expectedOutputs, setExpectedOutputs] = useState<unknown | null>(null);
  const [tolerance, setTolerance] = useState<number>(0.02);
  const [chooseModalOpen, setChooseModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [running, setRunning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');

  const { data: datasets } = useSWR<DatasetSummary[]>('/api/admin/datasets', fetcher);
  const compatible = useMemo(
    () => (datasets ?? []).filter(d => d.category === productCategory),
    [datasets, productCategory]
  );
  const normalizedMetrics = useMemo(() => normalizeMetrics(outputMetrics), [outputMetrics]);
  const fixture = FIXTURE_BY_SLUG[productSlug];
  const fixtureFields: FixtureField[] = fixture?.fields ?? [];
  const hasFixture = fixtureFields.length > 0;

  // Default the input tab to JSON when no structured fixture is available for this product
  useEffect(() => {
    if (!hasFixture && activeTab === 'form') setActiveTab('json');
  }, [hasFixture, activeTab]);

  useEffect(() => {
    if (!inventory) {
      setOutputs(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setRunning(true);
    const endpoint = ENGINE_ENDPOINT_BY_SLUG[productSlug] ?? '/api/admin/data-products/run-projections';
    const inputKey = ENGINE_INPUT_KEY_BY_SLUG[productSlug] ?? 'inventory';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [inputKey]: inventory })
    })
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (json.error) {
          setError(json.error);
          setOutputs(null);
        } else {
          setError(null);
          setOutputs(json.outputs);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err?.message ?? 'Engine call failed');
      })
      .finally(() => {
        if (!cancelled) setRunning(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inventory]);

  // ─── Loaders ──────────────────────────────────────────────────────────────

  function loadInventory(inv: any) {
    setInventory(inv);
    if (fixture) setFixtureValues(fixture.extract(inv));
    setInventoryText(JSON.stringify(inv, null, 2));
    setParseError(null);
  }

  async function loadDataset(datasetId: string) {
    const dataset: DatasetFull = await fetch(`/api/admin/datasets/${datasetId}`).then(r => r.json());
    loadInventory(dataset.inputs);
    setExpectedOutputs(dataset.expectedOutputs ?? null);
    setTolerance(dataset.tolerance ?? 0.02);
    setLoadedDatasetId(dataset.id);
    setLoadedDatasetName(dataset.name);
    setChooseModalOpen(false);
  }

  async function generateTestProject() {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/data-products/generate-test-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: productCategory })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to generate test project');
      loadInventory(json.inventory);
      setExpectedOutputs(null);
      setLoadedDatasetId(null);
      setLoadedDatasetName(`AI-generated: ${json.venue ?? 'test project'}`);
      message.success(`Generated in-memory test project for ${json.venue ?? 'a venue'}`);
    } catch (err: any) {
      message.error(err?.message ?? 'Failed to generate test project');
    } finally {
      setGenerating(false);
    }
  }

  // ─── Editors ──────────────────────────────────────────────────────────────

  function handleFixtureChange(key: string, value: string | number) {
    if (!inventory || !fixture) return;
    const nextValues = { ...fixtureValues, [key]: value };
    setFixtureValues(nextValues);
    const nextInventory = fixture.apply(inventory, nextValues);
    setInventory(nextInventory);
    setInventoryText(JSON.stringify(nextInventory, null, 2));
  }

  function handleJsonEdit(text: string) {
    setInventoryText(text);
    try {
      const parsed = JSON.parse(text);
      setInventory(parsed);
      if (fixture) setFixtureValues(fixture.extract(parsed));
      setParseError(null);
    } catch (err: any) {
      setParseError(err?.message ?? 'Invalid JSON');
    }
  }

  function handleResetToDefaults() {
    if (!inventory || !fixture) return;
    setFixtureValues(fixture.extract(inventory));
  }

  function handleFoodwarePatch(
    index: number,
    patch: Partial<{
      reusableItemCount: number;
      reusableReturnCount: number;
      waterUsageGallons: number;
      reusableCostPerItem: number;
      singleUseCostPerItem: number;
    }>
  ) {
    if (!inventory) return;
    const nextInventory = applyFoodwareItemEdit(inventory, index, patch);
    setInventory(nextInventory);
    setInventoryText(JSON.stringify(nextInventory, null, 2));
  }

  const isEventProduct = productSlug === 'actuals-event-model';
  const isRspProduct = productSlug === 'rsp-ingestion-model';

  function handleRspRowPatch(
    index: number,
    patch: Partial<{
      reusableType: string;
      materialType: string;
      weightLbsPerItem: number;
      inWarehouseEvents: number;
      outWarehouseEvents: number;
      deliveriesCount: number;
      singleUseMaterial: string;
    }>
  ) {
    if (!inventory) return;
    const nextInventory = applyRspUsageRowEdit(inventory, index, patch);
    setInventory(nextInventory);
    setInventoryText(JSON.stringify(nextInventory, null, 2));
  }

  function handleClear() {
    setInventory(null);
    setInventoryText('');
    setFixtureValues({});
    setOutputs(null);
    setLoadedDatasetId(null);
    setLoadedDatasetName(null);
    setExpectedOutputs(null);
  }

  // ─── Save actions ─────────────────────────────────────────────────────────

  async function saveAsNew() {
    if (!saveName.trim()) {
      message.error('Name is required');
      return;
    }
    if (!inventory || !outputs) {
      message.error('Run the engine first');
      return;
    }
    try {
      const res = await fetch('/api/admin/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          inputs: inventory,
          expectedOutputs: outputs,
          category: productCategory,
          tolerance,
          tags: [productSlug]
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      setLoadedDatasetId(json.id);
      setLoadedDatasetName(json.name);
      setExpectedOutputs(outputs);
      setSaveModalOpen(false);
      setSaveName('');
      globalMutate('/api/admin/datasets');
      message.success(`Saved as "${json.name}"`);
    } catch (err: any) {
      message.error(err?.message ?? 'Save failed');
    }
  }

  async function saveChanges() {
    if (!loadedDatasetId || !inventory) return;
    try {
      const res = await fetch(`/api/admin/datasets/${loadedDatasetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: inventory })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Save failed');
      }
      message.success('Saved input changes');
      globalMutate('/api/admin/datasets');
    } catch (err: any) {
      message.error(err?.message ?? 'Save failed');
    }
  }

  async function captureExpected() {
    if (!loadedDatasetId || !outputs) return;
    try {
      const res = await fetch(`/api/admin/datasets/${loadedDatasetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedOutputs: outputs })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Save failed');
      }
      setExpectedOutputs(outputs);
      message.success('Expected outputs updated');
    } catch (err: any) {
      message.error(err?.message ?? 'Save failed');
    }
  }

  // ─── Empty state ──────────────────────────────────────────────────────────

  if (!inventory) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <ThunderboltOutlined style={{ fontSize: 36, color: '#722ed1' }} />
          <Title level={4} style={{ marginTop: 16 }}>
            Test the real engine
          </Title>
          <Paragraph type='secondary' style={{ maxWidth: 520, margin: '0 auto 24px' }}>
            This data product runs against the live calculation engine — same code path as the projections page on a
            real project. Pick a saved golden dataset, or generate an AI-built test project that lives in memory until
            you save it.
          </Paragraph>
          <Space size='middle'>
            <Button
              size='large'
              icon={<DatabaseOutlined />}
              onClick={() => setChooseModalOpen(true)}
              disabled={!compatible.length}
            >
              Choose from golden dataset projects
              {compatible.length ? ` (${compatible.length})` : ' (none yet)'}
            </Button>
            <Button
              size='large'
              type='primary'
              icon={<PlayCircleOutlined />}
              loading={generating}
              onClick={() => {
                Modal.confirm({
                  title: 'Generate a test project?',
                  content:
                    'Claude will generate a plausible inventory for a randomly chosen venue (cafeteria, coffee shop, fast casual, etc.). It lives in memory only — save it explicitly to keep it.',
                  okText: 'Generate',
                  onOk: generateTestProject
                });
              }}
            >
              Generate test project
            </Button>
          </Space>
        </div>

        <Modal
          title='Choose a golden dataset'
          open={chooseModalOpen}
          footer={null}
          onCancel={() => setChooseModalOpen(false)}
        >
          {compatible.length === 0 ? (
            <Empty description={`No datasets for category "${productCategory}" yet`} />
          ) : (
            <Space direction='vertical' style={{ width: '100%' }}>
              {compatible.map(d => (
                <Card key={d.id} size='small' hoverable onClick={() => loadDataset(d.id)}>
                  <Space direction='vertical' size={2} style={{ width: '100%' }}>
                    <Text strong>{d.name}</Text>
                    {d.description && (
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        {d.description}
                      </Text>
                    )}
                    <Space size='small'>
                      <Tag>{d.category}</Tag>
                      <Tag>tolerance ±{(d.tolerance * 100).toFixed(1)}%</Tag>
                      {d.tags.map(t => (
                        <Tag key={t} color='blue'>
                          {t}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Modal>
      </Card>
    );
  }

  // ─── Active testing view ──────────────────────────────────────────────────

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap'
        }}
      >
        <ExperimentOutlined style={{ fontSize: 22, color: '#722ed1' }} />
        <Title level={4} style={{ margin: 0 }}>
          Live Calculator
        </Title>
        <Text type='secondary' style={{ fontSize: 12 }}>
          Real engine — outputs update on every input change.
        </Text>
        <Tag>{loadedDatasetName ?? 'Untitled test'}</Tag>
        {running && <Tag color='processing'>Running…</Tag>}
        <div style={{ flex: 1 }} />
        <Space>
          {loadedDatasetId && (
            <Link href={`/admin/data-science/golden-datasets/${loadedDatasetId}`} target='_blank'>
              <Button icon={<EditOutlined />} size='small'>
                Open in dataset editor
              </Button>
            </Link>
          )}
          {loadedDatasetId && (
            <Button icon={<SaveOutlined />} size='small' onClick={saveChanges}>
              Save input changes
            </Button>
          )}
          {loadedDatasetId && outputs && (
            <Button icon={<CheckCircleFilled />} size='small' onClick={captureExpected}>
              Set current as expected
            </Button>
          )}
          <Button
            icon={<SaveOutlined />}
            size='small'
            type='primary'
            onClick={() => {
              setSaveName(loadedDatasetName ? `${loadedDatasetName} (copy)` : '');
              setSaveModalOpen(true);
            }}
            disabled={!outputs}
          >
            Save as new dataset
          </Button>
          <Button icon={<ReloadOutlined />} size='small' onClick={handleClear}>
            Reset
          </Button>
        </Space>
      </div>

      {parseError && (
        <Alert type='error' showIcon message='Invalid JSON' description={parseError} style={{ marginBottom: 16 }} />
      )}
      {error && <Alert type='error' showIcon message='Engine error' description={error} style={{ marginBottom: 16 }} />}

      <Row gutter={16}>
        <Col xs={24} md={11}>
          <Card
            size='small'
            title={
              <Tabs
                activeKey={activeTab}
                onChange={k => setActiveTab(k as 'form' | 'json')}
                size='small'
                style={{ marginBottom: -16 }}
                items={
                  hasFixture
                    ? [
                        { key: 'form', label: 'Inputs' },
                        { key: 'json', label: 'Raw JSON' }
                      ]
                    : [{ key: 'json', label: 'Inputs (JSON)' }]
                }
              />
            }
            extra={
              hasFixture &&
              activeTab === 'form' && (
                <Button size='small' onClick={handleResetToDefaults}>
                  Reset to defaults
                </Button>
              )
            }
            style={{ height: '100%' }}
          >
            {activeTab === 'form' && hasFixture ? (
              <Space direction='vertical' size={16} style={{ width: '100%' }}>
                {isEventProduct && inventory && (
                  <EventFoodwareEditor inventory={inventory} onPatchItem={handleFoodwarePatch} />
                )}
                {isRspProduct && inventory && <RspUsageRowsEditor input={inventory} onPatchRow={handleRspRowPatch} />}
                {fixtureFields.map(field => (
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
                        value={fixtureValues[field.key] as string}
                        onChange={v => handleFixtureChange(field.key, v)}
                        options={field.options}
                        showSearch
                        optionFilterProp='label'
                      />
                    ) : (
                      <InputNumber
                        style={{ width: '100%' }}
                        value={fixtureValues[field.key] as number}
                        onChange={v => handleFixtureChange(field.key, v ?? 0)}
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
                <Paragraph type='secondary' style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                  These fields overlay onto the loaded inventory. For deeper edits (multiple line items, dishwasher
                  type, waste hauling, etc.), use the Raw JSON tab.
                </Paragraph>
              </Space>
            ) : (
              <Input.TextArea
                value={inventoryText}
                onChange={e => handleJsonEdit(e.target.value)}
                autoSize={{ minRows: 24, maxRows: 60 }}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={13}>
          <Card title='Outputs' size='small' style={{ height: '100%' }}>
            {outputs == null ? (
              <Empty description='No outputs yet' />
            ) : normalizedMetrics.length === 0 ? (
              <Paragraph type='secondary' style={{ fontSize: 12 }}>
                No output metrics declared on this data product. Add some on the Outputs tab to see formatted values
                here.
              </Paragraph>
            ) : (
              <Row gutter={[12, 12]}>
                {normalizedMetrics.map(metric => {
                  const actual = getByPath(outputs, metric.key);
                  const expected = expectedOutputs ? getByPath(expectedOutputs, metric.key) : undefined;
                  const status = expected !== undefined ? compare(actual, expected, tolerance) : 'na';
                  return (
                    <Col xs={24} sm={12} key={metric.key}>
                      <div
                        style={{
                          padding: 12,
                          background: '#fafafa',
                          border: '1px solid #f0f0f0',
                          borderRadius: 4,
                          height: '100%'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <Text strong style={{ fontSize: 13 }}>
                            {metric.label}
                          </Text>
                          {status === 'pass' && <CheckCircleFilled style={{ color: '#52c41a' }} />}
                          {status === 'fail' && <CloseCircleFilled style={{ color: '#ff4d4f' }} />}
                        </div>
                        {metric.description && (
                          <Text type='secondary' style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                            {metric.description}
                          </Text>
                        )}
                        <div style={{ marginTop: 8 }}>
                          <Text style={{ fontSize: 22, fontWeight: 600 }}>{formatNumber(actual, metric)}</Text>
                          {metric.unit && (
                            <Text type='secondary' style={{ fontSize: 12, marginLeft: 4 }}>
                              {metric.unit}
                            </Text>
                          )}
                        </div>
                        {expected !== undefined && (
                          <Text type='secondary' style={{ fontSize: 11, display: 'block' }}>
                            expected {formatNumber(expected, metric)} (±{(tolerance * 100).toFixed(1)}%)
                          </Text>
                        )}
                        <Text
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 10,
                            color: '#999',
                            display: 'block',
                            marginTop: 4
                          }}
                        >
                          {metric.key}
                        </Text>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title='Save as new golden dataset'
        open={saveModalOpen}
        onCancel={() => setSaveModalOpen(false)}
        onOk={saveAsNew}
        okText='Save'
      >
        <Paragraph type='secondary' style={{ fontSize: 12 }}>
          Stores the current inventory as <code>inputs</code> and the current engine outputs as{' '}
          <code>expectedOutputs</code>. Tolerance: ±{(tolerance * 100).toFixed(1)}%.
        </Paragraph>
        <Input
          placeholder='Dataset name'
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          autoFocus
          onPressEnter={saveAsNew}
        />
      </Modal>
    </>
  );
}
