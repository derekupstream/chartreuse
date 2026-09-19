/**
 * Product UX Builder — compose a product from screens of blocks over input fields and
 * published smart fields, then publish it (docs/CR2-PRODUCT-STUDIO-SPEC.md §6, mockup 2).
 *
 * Preview / Data / UX are three views of the same definition. The canvas and the live
 * /p/<slug> page share ComposedProductRenderer, so preview is never a lie. Publishing is
 * blocked while a placed smart field needs an input no screen collects.
 */
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  DownOutlined,
  EyeOutlined,
  HolderOutlined,
  PlusOutlined,
  RobotOutlined,
  SaveOutlined,
  SendOutlined
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Dropdown,
  Input,
  InputNumber,
  Modal,
  Radio,
  Segmented,
  Select,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import { SmartFieldBuilder } from 'components/admin/SmartFieldBuilder';
import { ComposedProductRenderer } from 'components/products/ComposedProductRenderer';
import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import type { ComposedBlock, ComposedDefinition, ComposedSmartField, InputFieldDef } from 'lib/products/composed';
import { BLOCK_LABELS, analyzeDependencies, newBlockId } from 'lib/products/composed';
import type { EquationToken, SmartVariable } from 'lib/smartFields/variables';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  version: number;
  audience?: string;
  isPublic?: boolean;
  screensJson: { screens: ComposedDefinition['screens'] } | null;
  inputSchemaJson: { fields: InputFieldDef[] } | null;
};

type SmartFieldApi = {
  id: string;
  name: string;
  unit: string | null;
  description: string | null;
  equation: EquationToken[];
  isPublished: boolean;
};

const PALETTE: { kind: ComposedBlock['kind']; hint: string }[] = [
  { kind: 'heading', hint: 'A screen title' },
  { kind: 'text', hint: 'Guidance or explanation' },
  { kind: 'inputField', hint: 'A question the user answers' },
  { kind: 'questionGroup', hint: 'Several questions together under one title' },
  { kind: 'smartFieldCard', hint: 'A computed metric card' },
  { kind: 'button', hint: 'Continue / back / save' }
];

export default function ProductUxBuilderPage(_: { user: DashboardUser }) {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;

  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [smartFields, setSmartFields] = useState<SmartFieldApi[]>([]);
  const [variables, setVariables] = useState<SmartVariable[]>([]);
  const [definition, setDefinition] = useState<ComposedDefinition>({ screens: [], inputFields: [] });
  const [screenIndex, setScreenIndex] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [tab, setTab] = useState<'preview' | 'data' | 'ux'>('ux');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [audience, setAudience] = useState<'public' | 'client' | 'internal'>('client');
  // AI Builder: a prompt becomes a draft of input fields, smart fields and screens.
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMode, setAiMode] = useState<'new' | 'modify'>('new');
  const [aiRunning, setAiRunning] = useState(false);
  /** Desktop / tablet / mobile canvas width — a cheap honesty check on the layout. */
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const deviceWidth = device === 'desktop' ? undefined : device === 'tablet' ? 720 : 390;

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/data-products/${id}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Product not found'))))
      .then((p: ProductRecord) => {
        setProduct(p);
        setDefinition({
          screens: p.screensJson?.screens ?? [],
          inputFields: p.inputSchemaJson?.fields ?? []
        });
      })
      .catch(e => message.error(e.message));
    fetch('/api/admin/smart-fields')
      .then(r => r.json())
      .then((all: SmartFieldApi[]) => setSmartFields(all.filter(f => f.isPublished)));
    fetch('/api/admin/smart-fields/variables')
      .then(r => r.json())
      .then(d => setVariables(d.variables ?? []));
  }, [id]);

  const variableMap = useMemo(() => new Map(variables.map(v => [v.key, v])), [variables]);
  const composedFields: ComposedSmartField[] = useMemo(
    () =>
      smartFields.map(f => ({
        id: f.id,
        name: f.name,
        unit: f.unit,
        description: f.description,
        equation: f.equation
      })),
    [smartFields]
  );
  const dependencies = useMemo(
    () => analyzeDependencies(definition, composedFields, variableMap),
    [definition, composedFields, variableMap]
  );

  const screen = definition.screens[screenIndex];
  const selectedBlock = screen?.blocks.find(b => b.id === selectedBlockId) ?? null;

  function update(mutate: (d: ComposedDefinition) => ComposedDefinition) {
    setDefinition(d => mutate(structuredClone(d)));
    setDirty(true);
  }

  function updateBlock(blockId: string, patch: Partial<ComposedBlock>) {
    update(d => {
      const s = d.screens[screenIndex];
      s.blocks = s.blocks.map(b => (b.id === blockId ? ({ ...b, ...patch } as ComposedBlock) : b));
      return d;
    });
  }

  function addBlock(kind: ComposedBlock['kind']) {
    const idNew = newBlockId();
    // A new input block defaults to the first input NOT yet placed anywhere — adding three
    // questions in a row shouldn't require reassigning two of them (dogfooding 2026-09-19).
    const placedKeys = new Set(
      definition.screens.flatMap(s => s.blocks).flatMap(b => (b.kind === 'inputField' ? [b.inputKey] : []))
    );
    const nextUnplacedInput = definition.inputFields.find(f => !placedKeys.has(f.key)) ?? definition.inputFields[0];
    const block: ComposedBlock =
      kind === 'heading'
        ? { id: idNew, kind, text: 'New heading' }
        : kind === 'text'
          ? { id: idNew, kind, text: 'Explain this step…' }
          : kind === 'inputField'
            ? { id: idNew, kind, inputKey: nextUnplacedInput?.key ?? '' }
            : kind === 'questionGroup'
              ? { id: idNew, kind, title: 'About your operation', inputKeys: [] }
              : kind === 'smartFieldCard'
                ? { id: idNew, kind, smartFieldId: smartFields[0]?.id ?? '' }
                : { id: idNew, kind: 'button', label: 'Continue', action: 'next' };
    update(d => {
      d.screens[screenIndex]?.blocks.push(block);
      return d;
    });
    setSelectedBlockId(idNew);
  }

  function moveBlock(blockId: string, delta: -1 | 1) {
    update(d => {
      const blocks = d.screens[screenIndex].blocks;
      const i = blocks.findIndex(b => b.id === blockId);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= blocks.length) return d;
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return d;
    });
  }

  function addScreen() {
    update(d => {
      d.screens.push({ id: newBlockId(), title: `Screen ${d.screens.length + 1}`, blocks: [] });
      return d;
    });
    setScreenIndex(definition.screens.length);
  }

  function moveScreen(index: number, delta: -1 | 1) {
    const j = index + delta;
    if (j < 0 || j >= definition.screens.length) return;
    update(d => {
      [d.screens[index], d.screens[j]] = [d.screens[j], d.screens[index]];
      return d;
    });
    setScreenIndex(j);
  }

  async function save(extra: Record<string, unknown> = {}, label = 'Draft saved') {
    if (!product) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/data-products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screensJson: { screens: definition.screens },
          inputSchemaJson: { fields: definition.inputFields },
          ...extra
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      const updated = await res.json();
      setProduct(p => (p ? { ...p, status: updated.status, version: updated.version } : p));
      setDirty(false);
      message.success(label);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Publishing controls who can USE the product. The modal asks for the audience;
   * the split button afterwards carries sharing actions (copy the link, open it,
   * take it offline).
   */
  function publish() {
    if (!definition.screens.length) {
      message.warning('Add at least one screen before publishing');
      return;
    }
    if (dependencies.uncollected.length) {
      message.error(`Cannot publish — no screen collects: ${dependencies.uncollected.map(u => u.label).join(', ')}`);
      setTab('data');
      return;
    }
    setPublishOpen(true);
  }

  async function confirmPublish() {
    setPublishOpen(false);
    await save(
      {
        status: 'published',
        publishedVersion: product?.version ?? 1,
        audience,
        isPublic: audience === 'public'
      },
      `Published — live at /p/${product?.slug}`
    );
    setProduct(p => (p ? { ...p, audience, isPublic: audience === 'public' } : p));
  }

  const liveUrl = product ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${product.slug}` : '';

  /** Preview exactly as a user would see it — the draft, in its own browser tab. */
  async function openPreviewTab() {
    await save({}, 'Draft saved — opening preview');
    window.open(`/p/${product?.slug}?draft=1`, '_blank');
  }

  if (!product) return <Spin style={{ display: 'block', margin: '80px auto' }} />;

  const dependenciesPanel = (
    <Card size='small' title='Data dependencies' style={{ marginTop: 12 }}>
      {dependencies.inputs.length === 0 && (
        <Text type='secondary' style={{ fontSize: 12 }}>
          Place a smart field card and its required inputs appear here.
        </Text>
      )}
      {dependencies.inputs.map(input => (
        <div key={input.key} style={{ fontSize: 12, marginBottom: 4 }}>
          {input.collected ? <Tag color='green'>collected</Tag> : <Tag color='red'>not collected</Tag>}
          <Text code>{input.key}</Text> {input.label !== input.key ? `— ${input.label}` : ''}
        </div>
      ))}
      {dependencies.factors.map(f => (
        <div key={f.key} style={{ fontSize: 12, marginBottom: 4 }}>
          <Tag color={f.met ? 'blue' : 'red'}>{f.met ? 'factor' : 'factor missing'}</Tag>
          {f.label}
        </div>
      ))}
      {dependencies.unusedInputs.length > 0 && (
        <Text type='secondary' style={{ fontSize: 12 }}>
          Collected but unused: {dependencies.unusedInputs.join(', ')}
        </Text>
      )}
    </Card>
  );

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <Link href='/admin/data-science/products' style={{ fontSize: 12 }}>
            <ArrowLeftOutlined /> Products
          </Link>
          <Title level={3} style={{ margin: '2px 0 0' }}>
            {product.name} <Tag color={product.status === 'published' ? 'green' : undefined}>{product.status}</Tag>
            {dirty && <Tag color='orange'>unsaved</Tag>}
          </Title>
          <Text type='secondary' style={{ fontSize: 12 }}>
            Product UX Builder — screens, questions and smart fields; publish when the dependencies are green.
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<RobotOutlined />} onClick={() => setAiOpen(true)}>
            AI Builder
          </Button>
          <Button icon={<EyeOutlined />} loading={saving} onClick={openPreviewTab}>
            Preview in new tab
          </Button>
          <Button icon={<SaveOutlined />} loading={saving} onClick={() => save()}>
            Save draft
          </Button>
          {product.status === 'published' ? (
            <Dropdown.Button
              type='primary'
              icon={<DownOutlined />}
              onClick={publish}
              menu={{
                items: [
                  { key: 'copy', label: 'Copy the public link' },
                  { key: 'open', label: 'Open the live product' },
                  { key: 'unpublish', label: 'Unpublish (back to draft)', danger: true }
                ],
                onClick: async ({ key }) => {
                  if (key === 'copy') {
                    await navigator.clipboard.writeText(liveUrl);
                    message.success('Link copied — share it or add it to the marketing site');
                  } else if (key === 'open') {
                    window.open(`/p/${product.slug}`, '_blank');
                  } else if (key === 'unpublish') {
                    await save({ status: 'draft' }, 'Unpublished — the live link now shows nothing');
                  }
                }
              }}
            >
              <SendOutlined /> Republish
            </Dropdown.Button>
          ) : (
            <Button type='primary' icon={<SendOutlined />} loading={saving} onClick={publish}>
              Publish
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={aiOpen}
        title='AI Builder'
        okText={aiMode === 'new' ? 'Create the draft' : 'Apply the changes'}
        confirmLoading={aiRunning}
        onCancel={() => setAiOpen(false)}
        onOk={async () => {
          if (!aiPrompt.trim()) {
            message.warning('Describe the product first');
            return;
          }
          setAiRunning(true);
          try {
            const res = await fetch('/api/admin/products/ai-compose', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId: product.id, prompt: aiPrompt, mode: aiMode })
            });
            const body = await res.json();
            if (!body.ok) throw new Error(body.error);
            const parts = [
              body.createdFields.length ? `created ${body.createdFields.length} smart field(s)` : null,
              body.updatedFields.length ? `updated ${body.updatedFields.length}` : null,
              `${body.screenCount} screen(s)`
            ].filter(Boolean);
            message.success(`AI draft ready — ${parts.join(', ')}. Every equation was checked before saving.`);
            if (body.droppedFields.length) {
              message.warning(
                `Dropped (bad equations): ${body.droppedFields.map((d: any) => `${d.name} (${d.error})`).join('; ')}`
              );
            }
            setAiOpen(false);
            // Reload everything the AI may have touched.
            const [productRes, fieldsRes] = await Promise.all([
              fetch(`/api/admin/data-products/${product.id}`),
              fetch('/api/admin/smart-fields')
            ]);
            const fresh: ProductRecord = await productRes.json();
            setProduct(fresh);
            setDefinition({
              screens: fresh.screensJson?.screens ?? [],
              inputFields: fresh.inputSchemaJson?.fields ?? []
            });
            setScreenIndex(0);
            setSelectedBlockId(null);
            const allFields: SmartFieldApi[] = await fieldsRes.json();
            setSmartFields(allFields.filter(f => f.isPublished));
          } catch (e) {
            message.error((e as Error).message);
          } finally {
            setAiRunning(false);
          }
        }}
      >
        <Paragraph type='secondary' style={{ fontSize: 13 }}>
          Describe the product and the AI drafts it: the questions to ask, the smart-field calculations (every equation
          is verified by the same parser you type into — nothing unchecked is ever saved), and the screens. You then
          review and edit everything here, exactly as if you had built it by hand.
        </Paragraph>
        <Radio.Group value={aiMode} onChange={e => setAiMode(e.target.value)} style={{ marginBottom: 10 }}>
          <Radio value='new'>Start fresh (replaces this product&apos;s screens and questions)</Radio>
          <Radio value='modify'>Modify what&apos;s here</Radio>
        </Radio.Group>
        <Input.TextArea
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          autoSize={{ minRows: 4, maxRows: 10 }}
          placeholder='e.g. A calculator for cafés: they list each single-use product they buy (cases per week, units per case, cost per case), and we show annual purchasing cost, items used per year, and estimated annual savings from switching 60% to reusables.'
        />
      </Modal>

      <Modal
        open={publishOpen}
        title='Publish this product'
        okText='Publish'
        onCancel={() => setPublishOpen(false)}
        onOk={confirmPublish}
      >
        <Paragraph type='secondary' style={{ fontSize: 13 }}>
          Publishing makes the product usable at <Text code>/p/{product.slug}</Text>. Who should be able to open it?
        </Paragraph>
        <Radio.Group
          value={audience}
          onChange={e => setAudience(e.target.value)}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <Radio value='public'>
            <Text strong>Anyone with the link</Text>
            <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
              No sign-in needed — right for the marketing site or sharing outside Chart-Reuse.
            </Text>
          </Radio>
          <Radio value='client'>
            <Text strong>Any signed-in Chart-Reuse user</Text>
            <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
              Visible to every account, not to the open internet.
            </Text>
          </Radio>
          <Radio value='internal'>
            <Text strong>Upstream staff only</Text>
            <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
              For testing with the team before a wider release.
            </Text>
          </Radio>
        </Radio.Group>
      </Modal>

      <Tabs
        activeKey={tab}
        onChange={k => setTab(k as typeof tab)}
        items={[
          {
            key: 'preview',
            label: 'Preview',
            children: (
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <Alert
                    type='info'
                    showIcon
                    style={{ marginBottom: 16, flex: 1, minWidth: 280 }}
                    message='Exactly what a user will see — same renderer, nothing saved from here. "Preview in new tab" opens it as its own page.'
                  />
                  <Segmented
                    value={device}
                    onChange={v => setDevice(v as typeof device)}
                    options={[
                      { label: 'Desktop', value: 'desktop' },
                      { label: 'Tablet', value: 'tablet' },
                      { label: 'Mobile', value: 'mobile' }
                    ]}
                  />
                </div>
                <div style={{ maxWidth: deviceWidth, margin: deviceWidth ? '0 auto' : undefined }}>
                  <ComposedProductRenderer
                    key={JSON.stringify(definition)} // restart the walkthrough when the definition changes
                    definition={definition}
                    smartFields={composedFields}
                    variables={variables}
                    mode='live'
                  />
                </div>
              </Card>
            )
          },
          {
            key: 'data',
            label: 'Data',
            children: (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Card
                  size='small'
                  title='Input fields — the questions this product can ask'
                  style={{ flex: '2 1 520px' }}
                >
                  <Table
                    size='small'
                    rowKey='key'
                    pagination={false}
                    dataSource={definition.inputFields}
                    columns={[
                      { title: 'Key', dataIndex: 'key', render: (v: string) => <Text code>{v}</Text> },
                      {
                        title: 'Question label',
                        dataIndex: 'label',
                        render: (v: string, r: InputFieldDef) => (
                          <Input
                            size='small'
                            value={v}
                            onChange={e =>
                              update(d => {
                                d.inputFields = d.inputFields.map(f =>
                                  f.key === r.key ? { ...f, label: e.target.value } : f
                                );
                                return d;
                              })
                            }
                          />
                        )
                      },
                      {
                        title: 'Type',
                        dataIndex: 'type',
                        width: 120,
                        render: (v: string, r: InputFieldDef) => (
                          <Select
                            size='small'
                            value={v}
                            style={{ width: 110 }}
                            options={[
                              { value: 'number', label: 'number' },
                              { value: 'currency', label: 'currency' },
                              { value: 'group', label: 'list (table)' }
                            ]}
                            onChange={type =>
                              update(d => {
                                d.inputFields = d.inputFields.map(f =>
                                  f.key === r.key
                                    ? {
                                        ...f,
                                        type: type as any,
                                        ...(type === 'group' && !f.columns ? { columns: [] } : {})
                                      }
                                    : f
                                );
                                return d;
                              })
                            }
                          />
                        )
                      },
                      {
                        title: 'Unit / columns',
                        dataIndex: 'unit',
                        width: 180,
                        render: (v: string | undefined, r: InputFieldDef) =>
                          r.type === 'group' ? (
                            <Input
                              size='small'
                              // A list's columns, edited as comma-separated names —
                              // e.g. "cases, unitsPerCase, costPerCase".
                              value={(r.columns ?? []).map(c => c.key).join(', ')}
                              placeholder='columns: cases, unitsPerCase'
                              onChange={e =>
                                update(d => {
                                  const columns = e.target.value
                                    .split(',')
                                    .map(s => s.trim())
                                    .filter(Boolean)
                                    .map(key => {
                                      const existing = r.columns?.find(c => c.key === key);
                                      return existing ?? { key, label: key, type: 'number' as const };
                                    });
                                  d.inputFields = d.inputFields.map(f => (f.key === r.key ? { ...f, columns } : f));
                                  return d;
                                })
                              }
                            />
                          ) : (
                            <Input
                              size='small'
                              value={v}
                              placeholder='unit'
                              onChange={e =>
                                update(d => {
                                  d.inputFields = d.inputFields.map(f =>
                                    f.key === r.key ? { ...f, unit: e.target.value } : f
                                  );
                                  return d;
                                })
                              }
                            />
                          )
                      },
                      {
                        title: '',
                        width: 40,
                        render: (_: unknown, r: InputFieldDef) => (
                          <Button
                            size='small'
                            type='text'
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              update(d => {
                                d.inputFields = d.inputFields.filter(f => f.key !== r.key);
                                return d;
                              })
                            }
                          />
                        )
                      }
                    ]}
                  />
                  <AddInputField
                    onAdd={field =>
                      update(d => {
                        if (d.inputFields.some(f => f.key === field.key)) {
                          message.warning(`“${field.key}” already exists`);
                          return d;
                        }
                        d.inputFields.push(field);
                        return d;
                      })
                    }
                    // Suggestions carry the catalog's label and unit, so one click makes a
                    // finished question — not a key the designer has to re-word (dogfooding
                    // 2026-09-19: labels defaulted to raw keys like "fundingTimesPerYear").
                    suggestions={dependencies.uncollected
                      .filter(u => !definition.inputFields.some(f => f.key === u.key))
                      .map(u => {
                        const variable = variableMap.get(u.key);
                        // A SUM in an equation needs a LIST question — the suggestion
                        // arrives ready-made with the columns the equation reads.
                        if (u.isGroup) {
                          return {
                            key: u.key,
                            label: variable?.label ?? u.label,
                            type: 'group' as const,
                            columns: (u.columns ?? []).map(c => ({ key: c, label: c, type: 'number' as const }))
                          };
                        }
                        return {
                          key: u.key,
                          label: variable?.label ?? u.label,
                          unit: variable?.unit,
                          type: (variable?.unit === '$' ? 'currency' : 'number') as InputFieldDef['type']
                        };
                      })}
                  />
                </Card>
                <div style={{ flex: '1 1 320px' }}>
                  <Card size='small' title='Smart fields this product uses'>
                    {composedFields
                      .filter(f =>
                        definition.screens.some(s =>
                          s.blocks.some(b => b.kind === 'smartFieldCard' && b.smartFieldId === f.id)
                        )
                      )
                      .map(f => (
                        <div key={f.id} style={{ marginBottom: 6, fontSize: 12 }}>
                          <Text strong>{f.name}</Text> {f.unit && <Text type='secondary'>({f.unit})</Text>}
                        </div>
                      ))}
                    <Text type='secondary' style={{ fontSize: 12 }}>
                      Build or edit fields right below — the full Smart Field Builder is part of this tab.
                    </Text>
                  </Card>
                  {dependenciesPanel}
                </div>

                {/* The REAL Smart Field Builder, embedded (Derek, 2026-09-19: "Data should
                    have the Smart Field Builder view") — same component as the standalone
                    page, so nothing here is a copy that can drift. */}
                <div style={{ flexBasis: '100%', borderTop: '1px solid #ececea', paddingTop: 16 }}>
                  <SmartFieldBuilder />
                </div>
              </div>
            )
          },
          {
            key: 'ux',
            label: 'UX',
            children: (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* screens */}
                <Card
                  size='small'
                  title={`Product structure — ${definition.screens.length} screen${definition.screens.length === 1 ? '' : 's'}`}
                  style={{ flex: '0 0 240px' }}
                >
                  {definition.screens.map((s, i) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setScreenIndex(i);
                        setSelectedBlockId(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: i === screenIndex ? '#f0f5e4' : undefined,
                        border: i === screenIndex ? '1px solid #b7d93c' : '1px solid transparent'
                      }}
                    >
                      <Text style={{ flex: 1, fontSize: 13 }}>
                        {i + 1}. {s.title}
                      </Text>
                      <Button
                        size='small'
                        type='text'
                        icon={<ArrowUpOutlined />}
                        onClick={e => (e.stopPropagation(), moveScreen(i, -1))}
                      />
                      <Button
                        size='small'
                        type='text'
                        icon={<ArrowDownOutlined />}
                        onClick={e => (e.stopPropagation(), moveScreen(i, 1))}
                      />
                      <Button
                        size='small'
                        type='text'
                        danger
                        icon={<DeleteOutlined />}
                        onClick={e => {
                          e.stopPropagation();
                          update(d => {
                            d.screens.splice(i, 1);
                            return d;
                          });
                          setScreenIndex(Math.max(0, screenIndex - (i <= screenIndex ? 1 : 0)));
                        }}
                      />
                    </div>
                  ))}
                  <Button block icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={addScreen}>
                    New screen
                  </Button>
                </Card>

                {/* canvas */}
                <Card
                  size='small'
                  style={{ flex: '2 1 460px', minWidth: 380 }}
                  title={
                    screen ? (
                      <Input
                        size='small'
                        value={screen.title}
                        onChange={e =>
                          update(d => {
                            d.screens[screenIndex].title = e.target.value;
                            return d;
                          })
                        }
                        style={{ maxWidth: 280 }}
                      />
                    ) : (
                      'Add a screen to begin'
                    )
                  }
                >
                  {screen ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                        <Segmented
                          size='small'
                          value={device}
                          onChange={v => setDevice(v as typeof device)}
                          options={[
                            { label: 'Desktop', value: 'desktop' },
                            { label: 'Tablet', value: 'tablet' },
                            { label: 'Mobile', value: 'mobile' }
                          ]}
                        />
                      </div>
                      <div
                        style={{
                          border: '1px dashed #d9d9d6',
                          borderRadius: 8,
                          padding: 16,
                          minHeight: 160,
                          background: 'white',
                          maxWidth: deviceWidth,
                          margin: deviceWidth ? '0 auto' : undefined
                        }}
                      >
                        <ComposedProductRenderer
                          definition={definition}
                          smartFields={composedFields}
                          variables={variables}
                          mode='builder'
                          screenIndex={screenIndex}
                          selectedBlockId={selectedBlockId}
                          onSelectBlock={setSelectedBlockId}
                        />
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <Text strong style={{ fontSize: 12 }}>
                          Add a block
                        </Text>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          {PALETTE.map(p => (
                            <Button key={p.kind} size='small' title={p.hint} onClick={() => addBlock(p.kind)}>
                              + {BLOCK_LABELS[p.kind]}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {screen.blocks.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <Text strong style={{ fontSize: 12 }}>
                            Blocks on this screen — drag to reorder
                          </Text>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                            {screen.blocks.map((block, index) => (
                              <div
                                key={block.id}
                                draggable
                                onDragStart={e => e.dataTransfer.setData('text/block-index', String(index))}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                  e.preventDefault();
                                  const from = Number(e.dataTransfer.getData('text/block-index'));
                                  if (Number.isNaN(from) || from === index) return;
                                  update(d => {
                                    const blocks = d.screens[screenIndex].blocks;
                                    const [moved] = blocks.splice(from, 1);
                                    blocks.splice(index, 0, moved);
                                    return d;
                                  });
                                }}
                                onClick={() => setSelectedBlockId(block.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  border: selectedBlockId === block.id ? '1px solid #1677ff' : '1px solid #ececea',
                                  background: 'white',
                                  cursor: 'grab',
                                  fontSize: 12
                                }}
                              >
                                <HolderOutlined style={{ color: '#bbb' }} />
                                <Tag style={{ margin: 0 }}>{BLOCK_LABELS[block.kind]}</Tag>
                                <Text type='secondary' ellipsis style={{ fontSize: 12, flex: 1 }}>
                                  {block.kind === 'heading' || block.kind === 'text'
                                    ? block.text
                                    : block.kind === 'inputField'
                                      ? block.inputKey
                                      : block.kind === 'questionGroup'
                                        ? block.title || `${block.inputKeys.length} questions`
                                        : block.kind === 'smartFieldCard'
                                          ? (composedFields.find(f => f.id === block.smartFieldId)?.name ?? '—')
                                          : block.label}
                                </Text>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Button type='primary' icon={<PlusOutlined />} onClick={addScreen}>
                      Add the first screen
                    </Button>
                  )}
                </Card>

                {/* properties */}
                <div style={{ flex: '1 1 300px', minWidth: 280 }}>
                  <Card size='small' title='Properties'>
                    {!selectedBlock && (
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        Click a block on the canvas to edit it.
                      </Text>
                    )}
                    {selectedBlock && (
                      <>
                        <Tag>{BLOCK_LABELS[selectedBlock.kind]}</Tag>
                        {(selectedBlock.kind === 'heading' || selectedBlock.kind === 'text') && (
                          <Input.TextArea
                            value={selectedBlock.text}
                            autoSize={{ minRows: 2, maxRows: 6 }}
                            style={{ marginTop: 8 }}
                            onChange={e => updateBlock(selectedBlock.id, { text: e.target.value } as any)}
                          />
                        )}
                        {selectedBlock.kind === 'inputField' && (
                          <Select
                            style={{ width: '100%', marginTop: 8 }}
                            value={selectedBlock.inputKey || undefined}
                            placeholder='Which input field?'
                            options={definition.inputFields.map(f => ({
                              value: f.key,
                              label: `${f.label} (${f.key})`
                            }))}
                            onChange={inputKey => updateBlock(selectedBlock.id, { inputKey } as any)}
                            notFoundContent={<Text type='secondary'>Define input fields on the Data tab</Text>}
                          />
                        )}
                        {selectedBlock.kind === 'questionGroup' && (
                          <>
                            <Input
                              style={{ marginTop: 8 }}
                              placeholder='Group title (optional)'
                              value={selectedBlock.title}
                              onChange={e => updateBlock(selectedBlock.id, { title: e.target.value } as any)}
                            />
                            <Select
                              mode='multiple'
                              style={{ width: '100%', marginTop: 8 }}
                              value={selectedBlock.inputKeys}
                              placeholder='Which questions belong in this group?'
                              options={definition.inputFields.map(f => ({
                                value: f.key,
                                label: `${f.label} (${f.key})`
                              }))}
                              onChange={inputKeys => updateBlock(selectedBlock.id, { inputKeys } as any)}
                            />
                          </>
                        )}
                        {selectedBlock.kind === 'smartFieldCard' && (
                          <>
                            <Select
                              style={{ width: '100%', marginTop: 8 }}
                              value={selectedBlock.smartFieldId || undefined}
                              placeholder='Which smart field?'
                              options={smartFields.map(f => ({ value: f.id, label: f.name }))}
                              onChange={smartFieldId => updateBlock(selectedBlock.id, { smartFieldId } as any)}
                            />
                            <Input
                              style={{ marginTop: 8 }}
                              placeholder='Card label (defaults to the field name)'
                              value={selectedBlock.label}
                              onChange={e => updateBlock(selectedBlock.id, { label: e.target.value } as any)}
                            />
                          </>
                        )}
                        {selectedBlock.kind === 'button' && (
                          <>
                            <Input
                              style={{ marginTop: 8 }}
                              value={selectedBlock.label}
                              onChange={e => updateBlock(selectedBlock.id, { label: e.target.value } as any)}
                            />
                            <Select
                              style={{ width: '100%', marginTop: 8 }}
                              value={selectedBlock.action}
                              options={[
                                { value: 'next', label: 'Go to the next screen' },
                                { value: 'back', label: 'Go back' },
                                { value: 'submit', label: 'Save the results (submit)' }
                              ]}
                              onChange={action => updateBlock(selectedBlock.id, { action } as any)}
                            />
                          </>
                        )}
                        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                          <Button
                            size='small'
                            icon={<ArrowUpOutlined />}
                            onClick={() => moveBlock(selectedBlock.id, -1)}
                          />
                          <Button
                            size='small'
                            icon={<ArrowDownOutlined />}
                            onClick={() => moveBlock(selectedBlock.id, 1)}
                          />
                          <Button
                            size='small'
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              update(d => {
                                const s = d.screens[screenIndex];
                                s.blocks = s.blocks.filter(b => b.id !== selectedBlock.id);
                                return d;
                              });
                              setSelectedBlockId(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                  {dependenciesPanel}
                </div>
              </div>
            )
          }
        ]}
      />
    </>
  );
}

type InputSuggestion = {
  key: string;
  label: string;
  unit?: string;
  type: InputFieldDef['type'];
  columns?: InputFieldDef['columns'];
};

/** Inline "new input field" row — suggests the fields placed smart fields still need. */
function AddInputField({ onAdd, suggestions }: { onAdd: (f: InputFieldDef) => void; suggestions: InputSuggestion[] }) {
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'number' | 'currency'>('number');
  const [defaultValue, setDefaultValue] = useState<number | null>(null);

  function add(field?: InputSuggestion) {
    const cleanKey = (field?.key ?? key).trim();
    if (!cleanKey) return;
    onAdd({
      key: cleanKey,
      label: (field?.label ?? label).trim() || cleanKey,
      type: field?.type ?? type,
      ...(field?.unit ? { unit: field.unit } : {}),
      ...(field?.columns ? { columns: field.columns } : {}),
      ...(!field && defaultValue !== null ? { defaultValue } : {})
    });
    setKey('');
    setLabel('');
    setDefaultValue(null);
  }

  return (
    <div style={{ marginTop: 12 }}>
      {suggestions.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Text type='secondary' style={{ fontSize: 12 }}>
            Needed by placed fields:{' '}
          </Text>
          {suggestions.map(s => (
            <Tag key={s.key} color='red' style={{ cursor: 'pointer' }} title={s.key} onClick={() => add(s)}>
              + {s.label}
            </Tag>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Input
          size='small'
          placeholder='key (e.g. fundingAmount)'
          value={key}
          onChange={e => setKey(e.target.value)}
          style={{ width: 190 }}
        />
        <Input
          size='small'
          placeholder='Question label'
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{ width: 220 }}
        />
        <Select
          size='small'
          value={type}
          style={{ width: 100 }}
          options={[
            { value: 'number', label: 'number' },
            { value: 'currency', label: 'currency' }
          ]}
          onChange={v => setType(v)}
        />
        <InputNumber
          size='small'
          placeholder='default'
          value={defaultValue as any}
          onChange={v => setDefaultValue(v === null ? null : Number(v))}
          style={{ width: 100 }}
        />
        <Button size='small' icon={<PlusOutlined />} onClick={() => add()}>
          Add input field
        </Button>
      </div>
    </div>
  );
}

ProductUxBuilderPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/products' title='Product UX Builder'>
    {page}
  </AdminLayout>
);
