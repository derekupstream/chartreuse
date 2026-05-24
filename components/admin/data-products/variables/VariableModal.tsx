import { Form, Input, InputNumber, Modal, Radio, Select, Space, Tag, Tooltip, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { VARIABLE_COLORS, VARIABLE_KIND_LABEL, isValidVariableName, newVariableId } from 'lib/dataProducts/variables';
import type { Variable, VariableKind, UserInputWidget } from 'lib/dataProducts/variables';

const { Text } = Typography;

type Factor = {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
};

type Props = {
  open: boolean;
  initialVariable?: Variable;
  existingNames: string[];
  factors: Factor[];
  onSave: (v: Variable) => void;
  onCancel: () => void;
};

export function VariableModal({ open, initialVariable, existingNames, factors, onSave, onCancel }: Props) {
  const isEdit = !!initialVariable;
  const [kind, setKind] = useState<VariableKind>(initialVariable?.kind ?? 'user_input');
  const [name, setName] = useState(initialVariable?.name ?? '');
  const [description, setDescription] = useState(initialVariable?.description ?? '');
  const [widget, setWidget] = useState<UserInputWidget>(initialVariable?.userInput?.widget ?? 'number');
  const [unit, setUnit] = useState(initialVariable?.userInput?.unit ?? initialVariable?.calculation?.unit ?? '');
  const [defaultValue, setDefaultValue] = useState<string | number>(initialVariable?.userInput?.defaultValue ?? '');
  const [sliderMin, setSliderMin] = useState<number>(initialVariable?.userInput?.min ?? 0);
  const [sliderMax, setSliderMax] = useState<number>(initialVariable?.userInput?.max ?? 100);
  const [sliderStep, setSliderStep] = useState<number>(initialVariable?.userInput?.step ?? 1);
  const [constSource, setConstSource] = useState<'literal' | 'factor'>(initialVariable?.constant?.source ?? 'literal');
  const [literalValue, setLiteralValue] = useState<number | undefined>(initialVariable?.constant?.literalValue);
  const [literalUnit, setLiteralUnit] = useState(initialVariable?.constant?.literalUnit ?? '');
  const [factorId, setFactorId] = useState<string | undefined>(initialVariable?.constant?.factorId);
  const [formulaText, setFormulaText] = useState(initialVariable?.calculation?.formulaText ?? '');

  useEffect(() => {
    if (open && !isEdit) {
      // reset for a fresh add
      setKind('user_input');
      setName('');
      setDescription('');
      setWidget('number');
      setUnit('');
      setDefaultValue('');
      setSliderMin(0);
      setSliderMax(100);
      setSliderStep(1);
      setConstSource('literal');
      setLiteralValue(undefined);
      setLiteralUnit('');
      setFactorId(undefined);
      setFormulaText('');
    }
  }, [open, isEdit]);

  const trimmedName = name.trim();
  const nameInvalid = trimmedName && !isValidVariableName(trimmedName);
  const nameDuplicate =
    trimmedName &&
    existingNames.some(n => n.toLowerCase() === trimmedName.toLowerCase() && n !== initialVariable?.name);

  function handleOk() {
    if (!trimmedName || nameInvalid || nameDuplicate) return;
    if (kind === 'constant') {
      if (constSource === 'literal' && literalValue === undefined) return;
      if (constSource === 'factor' && !factorId) return;
    }

    const v: Variable = {
      id: initialVariable?.id ?? newVariableId(),
      name: trimmedName,
      description: description.trim() || undefined,
      kind,
      position: initialVariable?.position,
      ...(kind === 'user_input' && {
        userInput: {
          widget,
          unit: unit.trim() || undefined,
          defaultValue: defaultValue === '' ? undefined : defaultValue,
          ...(widget === 'slider' && { min: sliderMin, max: sliderMax, step: sliderStep })
        }
      }),
      ...(kind === 'constant' && {
        constant:
          constSource === 'literal'
            ? { source: 'literal', literalValue, literalUnit: literalUnit.trim() || undefined }
            : { source: 'factor', factorId }
      }),
      ...(kind === 'calculation' && {
        calculation: {
          formula: [],
          formulaText: formulaText.trim() || undefined,
          unit: unit.trim() || undefined
        }
      })
    };

    onSave(v);
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit variable: ${initialVariable?.name}` : 'Add variable'}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEdit ? 'Save' : 'Add'}
      okButtonProps={{ disabled: !trimmedName || !!nameInvalid || !!nameDuplicate }}
      width={560}
      destroyOnClose
    >
      <Form layout='vertical'>
        <Form.Item label='Type'>
          <Radio.Group value={kind} onChange={e => setKind(e.target.value)}>
            {(['user_input', 'constant', 'calculation'] as VariableKind[]).map(k => {
              const c = VARIABLE_COLORS[k];
              const disabled = k === 'calculation';
              const radio = (
                <Radio.Button key={k} value={k} disabled={disabled} style={{ borderColor: c.border }}>
                  <Tag color={c.border} style={{ marginRight: 4 }}>
                    {VARIABLE_KIND_LABEL[k]}
                  </Tag>
                  {disabled && (
                    <Text type='secondary' style={{ fontSize: 11 }}>
                      (next phase)
                    </Text>
                  )}
                </Radio.Button>
              );
              return disabled ? (
                <Tooltip
                  key={k}
                  title='Calculation variables ship in Phase 2 — formula editor with draggable variable pills.'
                >
                  <span>{radio}</span>
                </Tooltip>
              ) : (
                radio
              );
            })}
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label='Name'
          validateStatus={nameInvalid || nameDuplicate ? 'error' : ''}
          help={
            nameInvalid
              ? 'Letters, numbers and underscores only; must start with a letter.'
              : nameDuplicate
                ? 'A variable with this name already exists.'
                : 'Used as the pill label and referenced in formulas. Example: AnnualUsage'
          }
        >
          <Input value={name} onChange={e => setName(e.target.value)} placeholder='e.g. AnnualUsage' autoFocus />
        </Form.Item>

        <Form.Item label='Description (optional)'>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder='What does this variable represent?'
          />
        </Form.Item>

        {kind === 'user_input' && (
          <>
            <Form.Item label='Input widget'>
              <Radio.Group value={widget} onChange={e => setWidget(e.target.value)}>
                <Radio.Button value='number'>Number</Radio.Button>
                <Radio.Button value='text'>Text</Radio.Button>
                <Radio.Button value='slider'>Slider</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item label='Unit (optional)'>
              <Input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder='e.g. cups/year, MTCO2e, USD'
                style={{ maxWidth: 240 }}
              />
            </Form.Item>

            <Form.Item label='Default value'>
              {widget === 'number' || widget === 'slider' ? (
                <InputNumber
                  value={typeof defaultValue === 'number' ? defaultValue : Number(defaultValue) || 0}
                  onChange={v => setDefaultValue(v ?? 0)}
                  style={{ width: 240 }}
                />
              ) : (
                <Input
                  value={String(defaultValue)}
                  onChange={e => setDefaultValue(e.target.value)}
                  style={{ width: 240 }}
                />
              )}
            </Form.Item>

            {widget === 'slider' && (
              <Form.Item label='Slider range'>
                <Space>
                  <InputNumber value={sliderMin} onChange={v => setSliderMin(v ?? 0)} placeholder='Min' />
                  <InputNumber value={sliderMax} onChange={v => setSliderMax(v ?? 100)} placeholder='Max' />
                  <InputNumber value={sliderStep} onChange={v => setSliderStep(v ?? 1)} placeholder='Step' />
                </Space>
              </Form.Item>
            )}
          </>
        )}

        {kind === 'constant' && (
          <>
            <Form.Item label='Source'>
              <Radio.Group value={constSource} onChange={e => setConstSource(e.target.value)}>
                <Radio.Button value='literal'>Literal value</Radio.Button>
                <Radio.Button value='factor'>From Factor library</Radio.Button>
              </Radio.Group>
            </Form.Item>

            {constSource === 'literal' ? (
              <>
                <Form.Item label='Value'>
                  <InputNumber
                    value={literalValue}
                    onChange={v => setLiteralValue(v ?? undefined)}
                    style={{ width: 240 }}
                  />
                </Form.Item>
                <Form.Item label='Unit (optional)'>
                  <Input
                    value={literalUnit}
                    onChange={e => setLiteralUnit(e.target.value)}
                    placeholder='e.g. kg, USD'
                    style={{ maxWidth: 240 }}
                  />
                </Form.Item>
              </>
            ) : (
              <Form.Item label='Factor'>
                <Select
                  showSearch
                  value={factorId}
                  onChange={setFactorId}
                  placeholder='Search the Factor library…'
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={factors.map(f => ({
                    value: f.id,
                    label: `${f.name} = ${f.currentValue} ${f.unit}`
                  }))}
                />
              </Form.Item>
            )}
          </>
        )}

        {kind === 'calculation' && (
          <Form.Item label='Formula (placeholder)'>
            <Input.TextArea
              rows={3}
              value={formulaText}
              onChange={e => setFormulaText(e.target.value)}
              placeholder='Phase 2 ships the proper pill-based editor. For now you can type a placeholder.'
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
