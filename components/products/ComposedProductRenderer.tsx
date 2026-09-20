/**
 * The ONE renderer for composed products: the UX Builder's canvas/preview and the live
 * /p/<slug> page both render through this, so what you build is exactly what ships
 * (docs/CR2-PRODUCT-STUDIO-SPEC.md §6-7).
 */
import { Button, Card, Input as AntInput, InputNumber, Select, Steps, Tooltip, Typography, message } from 'antd';
import { useMemo, useState } from 'react';

import type {
  ComposedBlock,
  ComposedDefinition,
  ComposedSmartField,
  InputFieldDef,
  ProductCatalog
} from 'lib/products/composed';
import { WIDGET_INPUT_DEFS, catalogKey } from 'lib/products/composed';
import type { FieldValues, GroupRow, SmartVariable } from 'lib/smartFields/variables';
import { evaluateEquation, toVariableKey } from 'lib/smartFields/variables';

const { Title, Text, Paragraph } = Typography;

export type SubmitResult = Record<string, { name: string; value: number | null; unit: string | null }>;

type Props = {
  definition: ComposedDefinition;
  smartFields: ComposedSmartField[];
  variables: SmartVariable[];
  /** 'live': stepper + submit; 'builder': render one screen, blocks selectable */
  mode: 'live' | 'builder';
  /** Catalog rows for any question with a product wizard, keyed by database id. */
  productCatalog?: ProductCatalog;
  screenIndex?: number;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  onSubmit?: (values: FieldValues, results: SubmitResult) => Promise<void> | void;
};

// Display rule (Derek, 2026-09-19): "$" renders BEFORE the number; every other unit after.
export const fmtValue = (value: number, unit: string | null) => {
  const n =
    Math.abs(value) >= 100 ? Math.round(value).toLocaleString() : parseFloat(value.toPrecision(4)).toLocaleString();
  if (!unit) return n;
  if (unit.trim() === '$') return `$${n}`;
  return `${n} ${unit}`;
};

/**
 * The baseline-vs-forecast bar pair from the mockups: two horizontal bars scaled to the
 * larger value, with a legend. Shared by the Field Builder preview, the gallery cards,
 * and the live product's chart block, so the comparison looks identical everywhere.
 */
export function ComparisonBars({
  baseline,
  forecast,
  unit,
  size = 'regular'
}: {
  baseline: number;
  forecast: number;
  unit: string | null;
  size?: 'mini' | 'regular';
}) {
  const max = Math.max(Math.abs(baseline), Math.abs(forecast), 1e-9);
  const barHeight = size === 'mini' ? 8 : 16;
  const bar = (value: number, color: string, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: size === 'mini' ? 3 : 6 }}>
      <div
        style={{
          width: `${Math.max((Math.abs(value) / max) * 100, 2)}%`,
          maxWidth: 'calc(100% - 120px)',
          height: barHeight,
          borderRadius: 4,
          background: color,
          transition: 'width 0.3s',
          flexShrink: 0
        }}
      />
      {size === 'regular' && (
        <Text type='secondary' style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {label}: <Text style={{ fontSize: 12 }}>{fmtValue(value, unit)}</Text>
        </Text>
      )}
    </div>
  );
  return (
    <div style={{ marginTop: size === 'mini' ? 6 : 10 }}>
      {bar(baseline, '#d3ecb2', 'Baseline')}
      {bar(forecast, '#52a41c', 'Forecast')}
      <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
        {[
          ['#d3ecb2', 'Baseline'],
          ['#52a41c', 'Forecast']
        ].map(([color, label]) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
            <Text type='secondary' style={{ fontSize: size === 'mini' ? 10 : 11 }}>
              {label}
            </Text>
          </span>
        ))}
      </div>
    </div>
  );
}

/** The green "↓ 81%" chip next to a compared value. */
export function DeltaChip({
  baseline,
  forecast,
  size = 'regular'
}: {
  baseline: number;
  forecast: number;
  size?: 'mini' | 'regular';
}) {
  if (!Number.isFinite(baseline) || Math.abs(baseline) < 1e-9) return null;
  const pct = Math.round(((baseline - forecast) / Math.abs(baseline)) * 100);
  const down = pct >= 0;
  return (
    <span
      style={{
        background: down ? '#e9f6dc' : '#fff1f0',
        color: down ? '#3f8600' : '#cf1322',
        borderRadius: 999,
        padding: size === 'mini' ? '0 6px' : '1px 8px',
        fontSize: size === 'mini' ? 10 : 12,
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }}
    >
      {down ? '↓' : '↑'} {Math.abs(pct)}%
    </span>
  );
}

export function ComposedProductRenderer({
  definition,
  smartFields,
  variables,
  mode,
  productCatalog,
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
        if (block.kind !== 'smartFieldCard' && block.kind !== 'chart') continue;
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
      // The product wizard: an optional picker per row. Choosing a catalog product fills
      // every column it can match; anything can still be typed or corrected by hand.
      const catalog = def.productSource ? productCatalog?.[catalogKey(def.productSource) ?? ''] : undefined;
      const applyProduct = (rowIndex: number, name: string) => {
        if (!catalog || !def.productSource) return;
        // Compare trimmed: the dropdown options are trimmed, and catalog cells can carry
        // stray whitespace (found 2026-09-20: "Ceramic Mug " filled nothing).
        const picked = catalog.rows.find(r => String(r[def.productSource!.nameColumnKey] ?? '').trim() === name);
        if (!picked) return;
        setRows(
          rows.map((row, i) => {
            if (i !== rowIndex) return row;
            const next: GroupRow = { ...row, __product: name };
            for (const column of columns) {
              // A column fills from its explicit mapping first, then a catalog column with
              // the same key, then one whose camelCase form matches (group columns are
              // usually camelCase keys).
              const raw =
                (column.fillFrom ? picked[column.fillFrom] : undefined) ??
                picked[column.key] ??
                Object.entries(picked).find(([k]) => toVariableKey(k) === column.key)?.[1];
              if (raw === undefined || raw === null || raw === '') continue;
              if (column.type === 'text') next[column.key] = String(raw);
              else {
                const num = Number(String(raw).replace(/[^0-9.eE+-]/g, ''));
                if (Number.isFinite(num)) next[column.key] = num;
              }
            }
            // A text column that names the product and got nothing from the mappings
            // receives the picked product's name, so the row reads like the catalog entry.
            for (const column of columns) {
              if (column.type !== 'text' || next[column.key]) continue;
              if (/product|name|item/i.test(column.key) || /product|name|item/i.test(column.label))
                next[column.key] = name;
            }
            return next;
          })
        );
      };
      return (
        <div style={{ marginBottom: 16, maxWidth: 640 }}>
          <Text strong>{def.label}</Text>
          {def.help && (
            <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
              {def.help}
            </Text>
          )}
          {catalog && (
            <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
              Pick a product to fill in its numbers, or type everything yourself — both work.
            </Text>
          )}
          <div style={{ overflowX: 'auto', marginTop: 6 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {catalog && (
                    <th style={{ textAlign: 'left', fontSize: 12, color: '#888', padding: '2px 8px 4px 0' }}>
                      Product
                    </th>
                  )}
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
                    {catalog && def.productSource && (
                      <td style={{ padding: '2px 8px 2px 0', minWidth: 180 }}>
                        <Select
                          style={{ width: '100%' }}
                          showSearch
                          allowClear
                          placeholder='Choose from the catalog…'
                          value={(row.__product as string) || undefined}
                          onChange={name => (name ? applyProduct(rowIndex, name) : undefined)}
                          options={Array.from(
                            new Set(
                              catalog.rows
                                .map(r => String(r[def.productSource!.nameColumnKey] ?? '').trim())
                                .filter(Boolean)
                            )
                          ).map(name => ({ value: name, label: name }))}
                        />
                      </td>
                    )}
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
                            // New rows seed 0 — select it on focus so typing REPLACES it
                            // (found 2026-09-20: typing 40 into a 0 cell produced 400).
                            onFocus={e => e.target.select()}
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
    // The row layout (Derek, 2026-09-20): a 'half' block takes half the row, so two
    // consecutive halves sit side by side; a narrow container wraps them back to stacked.
    const widthStyle: React.CSSProperties =
      block.width === 'half' ? { width: 'calc(50% - 8px)', minWidth: 260 } : { width: '100%' };
    const wrapperStyle: React.CSSProperties = selectable
      ? {
          ...widthStyle,
          cursor: 'pointer',
          borderRadius: 6,
          outline: selectedBlockId === block.id ? '2px solid #1677ff' : undefined,
          outlineOffset: 2
        }
      : widthStyle;
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
      case 'smartFieldCard':
      case 'chart': {
        const field = fieldById.get(block.smartFieldId);
        if (!field) return wrap(<Text type='danger'>This card points at a smart field that no longer exists</Text>);
        const { value, error } = evaluateEquation(field.equation, variableMap, values);
        // The comparison chart only draws once both sides compute.
        const baseline = field.comparison ? evaluateEquation(field.comparison.baseline, variableMap, values) : null;
        const forecast = field.comparison ? evaluateEquation(field.comparison.forecast, variableMap, values) : null;
        const comparable = baseline?.value != null && forecast?.value != null;
        const isChart = block.kind === 'chart';
        return wrap(
          <Card size='small' style={{ maxWidth: isChart ? 560 : 380, marginBottom: 12 }}>
            <Text type='secondary' style={{ fontSize: 12 }}>
              {block.label || field.name}
            </Text>
            <div
              style={{
                fontSize: isChart ? 30 : 26,
                fontWeight: 700,
                lineHeight: 1.3,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              {value === null ? (
                <Tooltip title={error}>
                  <Text type='secondary'>—</Text>
                </Tooltip>
              ) : (
                fmtValue(value, field.unit)
              )}
              {comparable && <DeltaChip baseline={baseline!.value!} forecast={forecast!.value!} />}
            </div>
            {value === null && (
              <Text type='secondary' style={{ fontSize: 12 }}>
                {error?.includes('no value') ? error.replace('has no value yet', 'is still needed') : error}
              </Text>
            )}
            {comparable && (
              <ComparisonBars
                baseline={baseline!.value!}
                forecast={forecast!.value!}
                unit={field.unit}
                size={isChart ? 'regular' : 'mini'}
              />
            )}
            {isChart && !field.comparison && (
              <Text type='secondary' style={{ fontSize: 12 }}>
                This smart field has no baseline/forecast comparison yet — add one in the Field Builder to draw the
                chart.
              </Text>
            )}
          </Card>
        );
      }
      case 'singleUseItems':
      case 'reusableItems': {
        // The purchasing widgets: the projections wizard's line-by-line entry, embeddable
        // as a block. Their question definitions are built in (WIDGET_INPUT_DEFS).
        const def = WIDGET_INPUT_DEFS[block.kind];
        return wrap(renderInput(block.label ? { ...def, label: block.label } : def));
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
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', rowGap: 4, columnGap: 16 }}>
        {screen.blocks.map(renderBlock)}
      </div>
      {mode === 'live' && !screen.blocks.some(b => b.kind === 'button') && !isLast && (
        <Button type='primary' style={{ marginTop: 16 }} onClick={() => setStep(s => s + 1)}>
          Continue
        </Button>
      )}
    </div>
  );
}
