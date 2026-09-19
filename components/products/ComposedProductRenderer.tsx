/**
 * The ONE renderer for composed products: the UX Builder's canvas/preview and the live
 * /p/<slug> page both render through this, so what you build is exactly what ships
 * (docs/CR2-PRODUCT-STUDIO-SPEC.md §6-7).
 */
import { Button, Card, InputNumber, Steps, Tooltip, Typography, message } from 'antd';
import { useMemo, useState } from 'react';

import type { ComposedBlock, ComposedDefinition, ComposedSmartField } from 'lib/products/composed';
import type { SmartVariable } from 'lib/smartFields/variables';
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
  onSubmit?: (values: Record<string, number>, results: SubmitResult) => Promise<void> | void;
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
  const [values, setValues] = useState<Record<string, number>>(() => {
    const seeded: Record<string, number> = {};
    for (const input of definition.inputFields) {
      if (input.defaultValue !== undefined && input.defaultValue !== null) seeded[input.key] = input.defaultValue;
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
        return wrap(
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
              value={values[def.key]}
              min={0}
              onChange={v => setValues(prev => ({ ...prev, [def.key]: v === null ? (undefined as any) : Number(v) }))}
              placeholder={def.label}
            />
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
