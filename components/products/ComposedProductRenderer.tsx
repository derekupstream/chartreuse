/**
 * The ONE renderer for composed products: the UX Builder's canvas/preview and the live
 * /p/<slug> page both render through this, so what you build is exactly what ships
 * (docs/CR2-PRODUCT-STUDIO-SPEC.md §6-7).
 */
import { Button, Card, Input as AntInput, InputNumber, Steps, Tooltip, Typography, message } from 'antd';
import { useMemo, useState } from 'react';

import type { ComposedBlock, ComposedDefinition, ComposedSmartField, InputFieldDef } from 'lib/products/composed';
import type { FieldValues, GroupRow, SmartVariable } from 'lib/smartFields/variables';
import { evaluateEquation } from 'lib/smartFields/variables';

const { Title, Text, Paragraph } = Typography;

export type SubmitResult = Record<string, { name: string; value: number | null; unit: string | null }>;

type Props = {
  definition: ComposedDefinition;
  smartFields: ComposedSmartField[];
  variables: SmartVariable[];
  /** 'live': stepper + submit; 'builder': render one screen, blocks selectable */
  mode: 'live' | 'builder';
  screenIndex?: number;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  onSubmit?: (values: FieldValues, results: SubmitResult) => Promise<void> | void;
};

const fmtValue = (value: number, unit: string | null) => {
  const n =
    Math.abs(value) >= 100 ? Math.round(value).toLocaleString() : parseFloat(value.toPrecision(4)).toLocaleString();
  if (!unit) return n;
  if (unit.trim() === '$') return `$${n}`;
  return `${n} ${unit}`;
};

export function ComposedProductRenderer({
  definition,
  smartFields,
  variables,
  mode,
  screenIndex,
  selectedBlockId,
  onSelectBlock,
  onSubmit
}: Props) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FieldValues>(() => {
    const seeded: FieldValues = {};
    for (const input of definition.inputFields) {
      if (input.type === 'group') seeded[input.key] = [];
      else if (input.defaultValue !== undefined && input.defaultValue !== null) seeded[input.key] = input.defaultValue;
    }
    return seeded;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const variableMap = useMemo(() => new Map(variables.map(v => [v.key, v])), [variables]);
  const fieldById = useMemo(() => new Map(smartFields.map(f => [f.id, f])), [smartFields]);
  const inputByKey = useMemo(() => new Map(definition.inputFields.map(f => [f.key, f])), [definition.inputFields]);

  const current = mode === 'builder' ? (screenIndex ?? 0) : step;
  const screen = definition.screens[current];
  const isLast = current >= definition.screens.length - 1;

  function computeResults(): SubmitResult {
    const results: SubmitResult = {};
    for (const s of definition.screens) {
      for (const block of s.blocks) {
        if (block.kind !== 'smartFieldCard') continue;
        const field = fieldById.get(block.smartFieldId);
        if (!field) continue;
        const { value } = evaluateEquation(field.equation, variableMap, values);
        results[field.id] = { name: field.name, value, unit: field.unit };
      }
    }
    return results;
  }

  async function submit() {
    setSubmitting(true);
    try {
      await onSubmit?.(values, computeResults());
      setSubmitted(true);
    } catch (e) {
      message.error((e as Error).message || 'Could not save your results');
    } finally {
      setSubmitting(false);
    }
  }

  /** One question, rendered by its definition — a number, a currency, or a LIST (table). */
  function renderInput(def: InputFieldDef) {
    if (def.type === 'group') {
      const rows = Array.isArray(values[def.key]) ? (values[def.key] as GroupRow[]) : [];
      const columns = def.columns ?? [];
      const setRows = (next: GroupRow[]) => setValues(prev => ({ ...prev, [def.key]: next }));
      return (
        <div style={{ marginBottom: 16, maxWidth: 640 }}>
          <Text strong>{def.label}</Text>
          {def.help && (
            <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
              {def.help}
            </Text>
          )}
          <div style={{ overflowX: 'auto', marginTop: 6 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {columns.map(column => (
                    <th
                      key={column.key}
                      style={{ textAlign: 'left', fontSize: 12, color: '#888', padding: '2px 8px 4px 0' }}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th style={{ width: 32 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map(column => (
                      <td key={column.key} style={{ padding: '2px 8px 2px 0' }}>
                        {column.type === 'text' ? (
                          <AntInput
                            size='middle'
                            value={(row[column.key] as string) ?? ''}
                            placeholder={column.label}
                            onChange={e =>
                              setRows(rows.map((r, i) => (i === rowIndex ? { ...r, [column.key]: e.target.value } : r)))
                            }
                          />
                        ) : (
                          <InputNumber
                            style={{ width: '100%' }}
                            prefix={column.type === 'currency' ? '$' : undefined}
                            min={0}
                            value={typeof row[column.key] === 'number' ? (row[column.key] as number) : undefined}
                            placeholder={column.label}
                            onChange={v =>
                              setRows(
                                rows.map((r, i) =>
                                  i === rowIndex ? { ...r, [column.key]: v === null ? 0 : Number(v) } : r
                                )
                              )
                            }
                          />
                        )}
                      </td>
                    ))}
                    <td>
                      <Button
                        size='small'
                        type='text'
                        danger
                        onClick={() => setRows(rows.filter((_, i) => i !== rowIndex))}
                      >
                        ✕
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            size='small'
            style={{ marginTop: 6 }}
            onClick={() =>
              setRows([...rows, Object.fromEntries(columns.map(c => [c.key, c.type === 'text' ? '' : 0]))])
            }
          >
            + Add row
          </Button>
        </div>
      );
    }
    return (
      <div style={{ maxWidth: 380, marginBottom: 12 }}>
        <Text strong>{def.label}</Text>
        {def.help && (
          <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
            {def.help}
          </Text>
        )}
        <InputNumber
          style={{ width: '100%', marginTop: 4 }}
          size='large'
          prefix={def.type === 'currency' ? '$' : undefined}
          addonAfter={def.type !== 'currency' && def.unit ? def.unit : undefined}
          value={typeof values[def.key] === 'number' ? (values[def.key] as number) : undefined}
          min={0}
          onChange={v => setValues(prev => ({ ...prev, [def.key]: v === null ? (undefined as any) : Number(v) }))}
          placeholder={def.label}
        />
      </div>
    );
  }

  function renderBlock(block: ComposedBlock) {
    const selectable = mode === 'builder';
    const wrapperStyle: React.CSSProperties = selectable
      ? {
          cursor: 'pointer',
          borderRadius: 6,
          outline: selectedBlockId === block.id ? '2px solid #1677ff' : undefined,
          outlineOffset: 2
        }
      : {};
    const wrap = (node: React.ReactNode) => (
      <div key={block.id} style={wrapperStyle} onClick={selectable ? () => onSelectBlock?.(block.id) : undefined}>
        {node}
      </div>
    );

    switch (block.kind) {
      case 'heading':
        return wrap(
          <Title level={3} style={{ margin: '8px 0' }}>
            {block.text || 'Heading'}
          </Title>
        );
      case 'text':
        return wrap(<Paragraph style={{ maxWidth: 640 }}>{block.text || 'Text'}</Paragraph>);
      case 'inputField': {
        const def = inputByKey.get(block.inputKey);
        if (!def)
          return wrap(<Text type='danger'>Input “{block.inputKey}” has no definition — add it on the Data tab</Text>);
        return wrap(renderInput(def));
      }
      case 'questionGroup': {
        const defs = block.inputKeys.map(k => inputByKey.get(k)).filter(Boolean) as InputFieldDef[];
        return wrap(
          <div
            style={{
              border: '1px solid #ececea',
              borderRadius: 8,
              padding: '12px 16px 4px',
              marginBottom: 12,
              maxWidth: 640
            }}
          >
            {block.title && (
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                {block.title}
              </Text>
            )}
            {defs.length === 0 && <Text type='secondary'>Pick this group&apos;s questions in Properties.</Text>}
            {defs.map(def => (
              <div key={def.key}>{renderInput(def)}</div>
            ))}
          </div>
        );
      }
      case 'smartFieldCard': {
        const field = fieldById.get(block.smartFieldId);
        if (!field) return wrap(<Text type='danger'>This card points at a smart field that no longer exists</Text>);
        const { value, error } = evaluateEquation(field.equation, variableMap, values);
        return wrap(
          <Card size='small' style={{ maxWidth: 380, marginBottom: 12 }}>
            <Text type='secondary' style={{ fontSize: 12 }}>
              {block.label || field.name}
            </Text>
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.3 }}>
              {value === null ? (
                <Tooltip title={error}>
                  <Text type='secondary'>—</Text>
                </Tooltip>
              ) : (
                fmtValue(value, field.unit)
              )}
            </div>
            {value === null && (
              <Text type='secondary' style={{ fontSize: 12 }}>
                {error?.includes('no value') ? error.replace('has no value yet', 'is still needed') : error}
              </Text>
            )}
          </Card>
        );
      }
      case 'button': {
        if (mode === 'builder')
          return wrap(
            <Button type='primary' style={{ marginTop: 4 }}>
              {block.label || 'Continue'}
            </Button>
          );
        if (block.action === 'back')
          return wrap(
            <Button style={{ marginTop: 4 }} onClick={() => setStep(s => Math.max(0, s - 1))}>
              {block.label || 'Back'}
            </Button>
          );
        if (block.action === 'submit')
          return wrap(
            <Button type='primary' style={{ marginTop: 4 }} loading={submitting} disabled={submitted} onClick={submit}>
              {submitted ? 'Saved ✓' : block.label || 'Save my results'}
            </Button>
          );
        return wrap(
          <Button
            type='primary'
            style={{ marginTop: 4 }}
            onClick={() => setStep(s => Math.min(definition.screens.length - 1, s + 1))}
          >
            {block.label || 'Continue'}
          </Button>
        );
      }
    }
  }

  if (!screen) return <Text type='secondary'>No screens yet.</Text>;

  return (
    <div>
      {mode === 'live' && definition.screens.length > 1 && (
        <Steps
          size='small'
          current={current}
          onChange={i => setStep(i)}
          items={definition.screens.map(s => ({ title: s.title }))}
          style={{ marginBottom: 24 }}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{screen.blocks.map(renderBlock)}</div>
      {mode === 'live' && !screen.blocks.some(b => b.kind === 'button') && !isLast && (
        <Button type='primary' style={{ marginTop: 16 }} onClick={() => setStep(s => s + 1)}>
          Continue
        </Button>
      )}
    </div>
  );
}
