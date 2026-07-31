import {
  CheckCircleFilled,
  CloseOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  ExportOutlined,
  PlusOutlined,
  SaveOutlined,
  WarningFilled
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { HowTo } from 'components/admin/HowTo';
import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import { detectRequirements, evaluateEquation } from 'lib/smartFields/variables';
import type { EquationToken, SmartVariable, VariableCategory } from 'lib/smartFields/variables';
import type { SmartFieldRecord } from 'pages/api/admin/smart-fields/index';
import type { SourcePreview } from 'pages/api/admin/smart-fields/source-preview';

const { Text, Title, Paragraph } = Typography;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};

const CATEGORIES: VariableCategory[] = ['Inputs', 'Factors', 'Products', 'Intermediates', 'Outputs'];

const CATEGORY_COLOR: Record<VariableCategory, string> = {
  Inputs: '#1677ff',
  Factors: '#722ed1',
  Products: '#13c2c2',
  Intermediates: '#fa8c16',
  Outputs: '#52c41a'
};

const FIELD_CATEGORIES = ['All', 'GHG', 'Water', 'Waste', 'Cost', 'Operational', 'Other'] as const;

const CATEGORY_TAG: Record<string, string> = {
  GHG: 'red',
  Water: 'cyan',
  Waste: 'purple',
  Cost: 'green',
  Operational: 'orange',
  Other: 'default'
};

const EMPTY_FIELD = {
  id: undefined as string | undefined,
  name: '',
  description: '',
  unit: '',
  category: 'Other',
  equation: [] as EquationToken[],
  testInputs: {} as Record<string, number>
};

export default function SmartFieldsPage({ user }: { user: DashboardUser }) {
  const [fields, setFields] = useState<SmartFieldRecord[] | null>(null);
  const [variables, setVariables] = useState<SmartVariable[]>([]);
  const [draft, setDraft] = useState({ ...EMPTY_FIELD });
  const [selectedVariableKey, setSelectedVariableKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<SourcePreview | null>(null);
  const [category, setCategory] = useState<VariableCategory>('Factors');
  const [search, setSearch] = useState('');
  // library filtering
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldCategory, setFieldCategory] = useState<string>('All');
  const [saving, setSaving] = useState(false);

  const variableMap = useMemo(() => new Map(variables.map(v => [v.key, v])), [variables]);

  const loadFields = useCallback(async () => {
    const res = await fetch('/api/admin/smart-fields');
    setFields(res.ok ? await res.json() : []);
  }, []);

  useEffect(() => {
    loadFields();
    fetch('/api/admin/smart-fields/variables')
      .then(r => r.json())
      .then(d => setVariables(d.variables ?? []))
      .catch(() => message.error('Could not load the variable catalog'));
  }, [loadFields]);

  // Clicking a variable pill shows the exact database rows it came from.
  useEffect(() => {
    const variable = selectedVariableKey ? variableMap.get(selectedVariableKey) : null;
    if (!variable?.source) {
      setPreview(null);
      return;
    }
    const { databaseId, rowIndex, columnKey } = variable.source;
    fetch(`/api/admin/smart-fields/source-preview?databaseId=${databaseId}&rowIndex=${rowIndex}&columnKey=${columnKey}`)
      .then(r => r.json())
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [selectedVariableKey, variableMap]);

  const evaluation = useMemo(
    () => evaluateEquation(draft.equation, variableMap, draft.testInputs),
    [draft.equation, draft.testInputs, variableMap]
  );
  const requirements = useMemo(
    () => detectRequirements(draft.equation, variableMap, draft.testInputs),
    [draft.equation, draft.testInputs, variableMap]
  );

  const filteredVariables = useMemo(
    () =>
      variables
        .filter(v => v.category === category)
        .filter(
          v =>
            !search.trim() ||
            v.label.toLowerCase().includes(search.toLowerCase()) ||
            v.key.toLowerCase().includes(search.toLowerCase())
        ),
    [variables, category, search]
  );

  const addToken = (token: EquationToken) => setDraft(d => ({ ...d, equation: [...d.equation, token] }));
  const removeTokenAt = (index: number) =>
    setDraft(d => ({ ...d, equation: d.equation.filter((_, i) => i !== index) }));

  async function save(publish = false) {
    if (!draft.name.trim()) {
      message.warning('Give the smart field a name first');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/smart-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, isPublished: publish })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not save');
      const saved = await res.json();
      setDraft({ ...draft, id: saved.id });
      message.success(publish ? `Published "${saved.name}"` : `Saved "${saved.name}"`);
      loadFields();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!(await fetch(`/api/admin/smart-fields?id=${id}`, { method: 'DELETE' })).ok) {
      message.error('Could not delete that smart field');
      return;
    }
    message.success(`Deleted "${name}"`);
    if (draft.id === id) setDraft({ ...EMPTY_FIELD });
    loadFields();
  }

  const selectedVariable = selectedVariableKey ? variableMap.get(selectedVariableKey) : null;
  const allFields = fields ?? [];
  const list = allFields
    .filter(f => fieldCategory === 'All' || (f.category ?? 'Other') === fieldCategory)
    .filter(f => {
      const q = fieldSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        (f.description ?? '').toLowerCase().includes(q) ||
        (f.unit ?? '').toLowerCase().includes(q)
      );
    });
  const countFor = (c: string) =>
    c === 'All' ? allFields.length : allFields.filter(f => (f.category ?? 'Other') === c).length;

  return (
    <AdminLayout title='Smart Fields' selectedMenuItem='data-science/smart-fields' user={user}>
      <HowTo tool='smart-fields' />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Smart Field Builder
          </Title>
          <Text type='secondary'>
            Design reusable metric logic, connect dynamic variables, and trace every value back to its source database.
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<SaveOutlined />} loading={saving} onClick={() => save(false)}>
            Save smart field
          </Button>
          <Button type='primary' loading={saving} onClick={() => save(true)}>
            Publish
          </Button>
        </div>
      </div>

      <Row gutter={12}>
        {/* ── the library of smart fields ───────────────────────────── */}
        <Col xs={24} lg={5}>
          <Card size='small' title='Smart fields' styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}>
            <Input.Search
              size='small'
              allowClear
              placeholder='Search smart fields…'
              value={fieldSearch}
              onChange={e => setFieldSearch(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {FIELD_CATEGORIES.filter(c => c === 'All' || countFor(c) > 0).map(c => (
                <Tag.CheckableTag
                  key={c}
                  checked={fieldCategory === c}
                  onChange={() => setFieldCategory(c)}
                  style={{ fontSize: 11, border: '1px solid #f0f0f0' }}
                >
                  {c} {countFor(c)}
                </Tag.CheckableTag>
              ))}
            </div>
            {fields === null && <Spin />}
            {fields !== null && !list.length && (
              <Text type='secondary' style={{ fontSize: 12 }}>
                Nothing matches that filter.
              </Text>
            )}
            {list.map(field => {
              const isOpen = draft.id === field.id;
              return (
                <Card
                  key={field.id}
                  size='small'
                  hoverable
                  style={{ marginBottom: 8, border: isOpen ? '2px solid #52c41a' : undefined }}
                  onClick={() =>
                    setDraft({
                      id: field.id,
                      name: field.name,
                      description: field.description ?? '',
                      unit: field.unit ?? '',
                      category: field.category ?? 'Other',
                      equation: field.equation,
                      testInputs: field.testInputs
                    })
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text strong style={{ fontSize: 13 }}>
                      {field.name}
                    </Text>
                    <Button
                      size='small'
                      type='text'
                      danger
                      icon={<DeleteOutlined />}
                      onClick={e => {
                        e.stopPropagation();
                        remove(field.id, field.name);
                      }}
                    />
                  </div>
                  <Text type='secondary' style={{ fontSize: 11, display: 'block' }}>
                    {field.equation.length} token{field.equation.length === 1 ? '' : 's'}
                    {field.unit ? ` · ${field.unit}` : ''}
                  </Text>
                  <Tag color={CATEGORY_TAG[field.category ?? 'Other']} style={{ marginTop: 4, fontSize: 10 }}>
                    {field.category ?? 'Other'}
                  </Tag>
                  {field.isPublished && (
                    <Tag color='green' style={{ marginTop: 4 }}>
                      published
                    </Tag>
                  )}
                </Card>
              );
            })}

            <Card
              size='small'
              hoverable
              style={{ border: '1px dashed #d9d9d9', textAlign: 'center', background: 'transparent' }}
              onClick={() => {
                setDraft({ ...EMPTY_FIELD });
                setSelectedVariableKey(null);
              }}
            >
              <PlusOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />
              <div>
                <Text type='secondary'>New smart field</Text>
              </div>
            </Card>
          </Card>
        </Col>

        {/* ── the builder ───────────────────────────────────────────── */}
        <Col xs={24} lg={selectedVariable ? 11 : 19}>
          <Card
            size='small'
            title={
              <Input
                variant='borderless'
                placeholder='Name this smart field'
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                style={{ fontWeight: 600, fontSize: 15, padding: 0 }}
              />
            }
            extra={
              <div style={{ display: 'flex', gap: 6 }}>
                <Select
                  size='small'
                  value={draft.category}
                  onChange={v => setDraft({ ...draft, category: v })}
                  style={{ width: 130 }}
                  options={FIELD_CATEGORIES.filter(c => c !== 'All').map(c => ({ value: c, label: c }))}
                />
                <Input
                  size='small'
                  placeholder='unit'
                  value={draft.unit}
                  onChange={e => setDraft({ ...draft, unit: e.target.value })}
                  style={{ width: 120 }}
                />
              </div>
            }
          >
            {/* preview */}
            <Card size='small' style={{ background: '#f6ffed', marginBottom: 12 }}>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {draft.name || 'Your smart field'}
              </Text>
              <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.2 }}>
                {evaluation.value === null ? (
                  <Text type='secondary' style={{ fontSize: 18 }}>
                    —
                  </Text>
                ) : (
                  <>
                    {evaluation.value.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                    <Text type='secondary' style={{ fontSize: 15 }}>
                      {draft.unit}
                    </Text>
                  </>
                )}
              </div>
              {evaluation.error ? (
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {evaluation.error}
                </Text>
              ) : (
                <Text type='secondary' style={{ fontSize: 12, fontFamily: 'monospace' }}>
                  = {evaluation.expression}
                </Text>
              )}
            </Card>

            {/* equation */}
            <Text strong>Equation</Text>
            <div
              style={{
                minHeight: 54,
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: 8,
                margin: '6px 0 10px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                alignItems: 'center'
              }}
            >
              {!draft.equation.length && (
                <Text type='secondary' style={{ fontSize: 12 }}>
                  Add variables, numbers and operators to build the equation
                </Text>
              )}
              {draft.equation.map((token, i) => {
                if (token.kind === 'variable') {
                  const variable = variableMap.get(token.key);
                  const color = variable ? CATEGORY_COLOR[variable.category] : '#ff4d4f';
                  return (
                    <Tag
                      key={i}
                      color={selectedVariableKey === token.key ? 'purple' : undefined}
                      style={{ cursor: 'pointer', borderColor: color, color, margin: 0 }}
                      closable
                      onClose={e => {
                        e.preventDefault();
                        removeTokenAt(i);
                      }}
                      onClick={() => setSelectedVariableKey(token.key === selectedVariableKey ? null : token.key)}
                    >
                      {variable?.label ?? `${token.key} (missing)`}
                    </Tag>
                  );
                }
                return (
                  <Tag key={i} closable style={{ margin: 0 }} onClose={e => (e.preventDefault(), removeTokenAt(i))}>
                    {token.kind === 'number' ? token.value : token.value}
                  </Tag>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {(['+', '-', '*', '/'] as const).map(op => (
                <Button key={op} size='small' onClick={() => addToken({ kind: 'operator', value: op })}>
                  {op}
                </Button>
              ))}
              {(['(', ')'] as const).map(p => (
                <Button key={p} size='small' onClick={() => addToken({ kind: 'paren', value: p })}>
                  {p}
                </Button>
              ))}
              <InputNumber
                size='small'
                placeholder='number'
                style={{ width: 110 }}
                onPressEnter={e => {
                  const value = Number((e.target as HTMLInputElement).value);
                  if (Number.isFinite(value)) {
                    addToken({ kind: 'number', value });
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button size='small' danger onClick={() => setDraft({ ...draft, equation: [] })}>
                Reset
              </Button>
            </div>

            {/* variable picker */}
            <Text strong>Add a variable</Text>
            <Tabs
              size='small'
              activeKey={category}
              onChange={k => setCategory(k as VariableCategory)}
              items={CATEGORIES.map(c => ({ key: c, label: c }))}
            />
            <Input.Search
              size='small'
              allowClear
              placeholder='Search variables…'
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div style={{ maxHeight: 190, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 6 }}>
              {!filteredVariables.length && (
                <div style={{ padding: 12 }}>
                  <Text type='secondary'>Nothing here yet. Upload a database to create factor variables.</Text>
                </div>
              )}
              {filteredVariables.map(variable => (
                <div
                  key={variable.key}
                  onClick={() => addToken({ kind: 'variable', key: variable.key })}
                  style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid #fafafa',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8
                  }}
                >
                  <span>
                    <span style={{ color: CATEGORY_COLOR[variable.category], marginRight: 6 }}>◆</span>
                    <Text style={{ fontSize: 13 }}>{variable.label}</Text>
                  </span>
                  <Text type='secondary' style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                    {variable.value !== undefined ? variable.value : (variable.unit ?? 'needs input')}
                  </Text>
                </div>
              ))}
            </div>

            {/* requirements */}
            {requirements.length > 0 && (
              <Card size='small' style={{ marginTop: 12, background: '#fafafa' }} title='Detected requirements'>
                {requirements.map(requirement => (
                  <div key={requirement.key} style={{ marginBottom: 4, fontSize: 13 }}>
                    {requirement.met ? (
                      <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                    ) : (
                      <WarningFilled
                        style={{ color: requirement.kind === 'missing' ? '#ff4d4f' : '#faad14', marginRight: 8 }}
                      />
                    )}
                    {requirement.kind === 'input' && `Required user input: ${requirement.label}`}
                    {requirement.kind === 'factor' && `Required factor: ${requirement.label}`}
                    {requirement.kind === 'product' && `Requires a product selection: ${requirement.label}`}
                    {requirement.kind === 'intermediate' && `Computed by the calculator: ${requirement.label}`}
                    {requirement.kind === 'missing' && `Missing factor: ${requirement.label}`}
                  </div>
                ))}
                {requirements.some(r => r.kind !== 'factor' && r.kind !== 'missing' && !r.met) && (
                  <>
                    <Text type='secondary' style={{ fontSize: 12, display: 'block', margin: '8px 0 4px' }}>
                      Supply test values to preview the result:
                    </Text>
                    {requirements
                      .filter(r => r.kind === 'input' || r.kind === 'product' || r.kind === 'intermediate')
                      .map(r => (
                        <div key={r.key} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, minWidth: 150 }}>{r.label}</Text>
                          <InputNumber
                            size='small'
                            value={draft.testInputs[r.key]}
                            onChange={v =>
                              setDraft(d => ({
                                ...d,
                                testInputs: { ...d.testInputs, [r.key]: v as number }
                              }))
                            }
                          />
                        </div>
                      ))}
                  </>
                )}
              </Card>
            )}
          </Card>
        </Col>

        {/* ── where a variable comes from ───────────────────────────── */}
        {selectedVariable && (
          <Col xs={24} lg={8}>
            <Card
              size='small'
              title='Variable source'
              extra={
                <Button
                  size='small'
                  type='text'
                  icon={<CloseOutlined />}
                  onClick={() => setSelectedVariableKey(null)}
                />
              }
            >
              <Title level={5} style={{ marginTop: 0 }}>
                <span style={{ color: CATEGORY_COLOR[selectedVariable.category], marginRight: 6 }}>◆</span>
                {selectedVariable.label}
              </Title>

              <Row gutter={[8, 6]} style={{ fontSize: 13, marginBottom: 12 }}>
                <Col span={10}>
                  <Text type='secondary'>Type</Text>
                </Col>
                <Col span={14}>
                  <Tag color={CATEGORY_COLOR[selectedVariable.category]}>{selectedVariable.category}</Tag>
                </Col>
                {selectedVariable.value !== undefined && (
                  <>
                    <Col span={10}>
                      <Text type='secondary'>Value</Text>
                    </Col>
                    <Col span={14}>
                      <Text strong>
                        {selectedVariable.value} {selectedVariable.unit}
                      </Text>
                    </Col>
                  </>
                )}
                {selectedVariable.source && (
                  <>
                    <Col span={10}>
                      <Text type='secondary'>Source DB</Text>
                    </Col>
                    <Col span={14}>{selectedVariable.source.database}</Col>
                    <Col span={10}>
                      <Text type='secondary'>Sheet / Table</Text>
                    </Col>
                    <Col span={14}>{selectedVariable.source.table}</Col>
                    <Col span={10}>
                      <Text type='secondary'>Cell</Text>
                    </Col>
                    <Col span={14}>
                      <Text code>{selectedVariable.source.cell}</Text>
                    </Col>
                    <Col span={10}>
                      <Text type='secondary'>Version</Text>
                    </Col>
                    <Col span={14}>{selectedVariable.source.version}</Col>
                  </>
                )}
                {selectedVariable.unit && (
                  <>
                    <Col span={10}>
                      <Text type='secondary'>Unit</Text>
                    </Col>
                    <Col span={14}>{selectedVariable.unit}</Col>
                  </>
                )}
              </Row>

              {!selectedVariable.source && (
                <Alert
                  type='info'
                  showIcon
                  message={
                    selectedVariable.category === 'Inputs'
                      ? 'This value is collected from the user on a calculator, so it has no database source.'
                      : 'This variable resolves at run time and has no fixed source cell.'
                  }
                />
              )}

              {preview && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text strong style={{ fontSize: 13 }}>
                      <DatabaseOutlined /> Source data preview
                    </Text>
                    <Link
                      href={{
                        pathname: '/admin/data-science/databases',
                        query: {
                          open: preview.databaseId,
                          row: preview.highlightRowIndex,
                          col: preview.highlightColumnKey
                        }
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>
                        Open in database <ExportOutlined />
                      </Text>
                    </Link>
                  </div>
                  <div style={{ overflowX: 'auto', marginTop: 6, border: '1px solid #f0f0f0', borderRadius: 6 }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#fafafa' }}>
                          <th style={{ padding: '4px 6px', borderBottom: '1px solid #f0f0f0' }} />
                          {preview.columns.map(col => (
                            <th
                              key={col.key}
                              style={{
                                padding: '4px 6px',
                                textAlign: 'left',
                                borderBottom: '1px solid #f0f0f0',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map(row => {
                          const isTarget = row.rowIndex === preview.highlightRowIndex;
                          return (
                            <tr key={row.rowIndex} style={{ background: isTarget ? '#f9f0ff' : undefined }}>
                              <td style={{ padding: '4px 6px', color: '#bfbfbf' }}>{row.rowIndex + 2}</td>
                              {preview.columns.map(col => {
                                const isCell = isTarget && col.key === preview.highlightColumnKey;
                                return (
                                  <td
                                    key={col.key}
                                    style={{
                                      padding: '4px 6px',
                                      whiteSpace: 'nowrap',
                                      border: isCell ? '2px solid #722ed1' : undefined,
                                      fontWeight: isCell ? 600 : undefined
                                    }}
                                  >
                                    {String(row.data[col.key] ?? '')}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Text type='secondary' style={{ fontSize: 11 }}>
                    Showing {preview.rows.length} of {preview.totalRows} rows
                  </Text>
                </>
              )}
            </Card>
          </Col>
        )}
      </Row>
    </AdminLayout>
  );
}
