import { DeleteOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { VARIABLE_COLORS, VARIABLE_KIND_LABEL, isValidVariableName, newVariableId } from 'lib/dataProducts/variables';
import type { FormulaToken, Variable, VariableKind, UserInputWidget, ConstantSource } from 'lib/dataProducts/variables';
import type { CatalogProductSummary } from 'pages/api/admin/catalogs/list';

import { FormulaEditor } from './FormulaEditor';

const { Text } = Typography;

type Factor = {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  category?: { name: string };
};

type Props = {
  open: boolean;
  initialVariable?: Variable;
  existingNames: string[];
  factors: Factor[];
  /** All variables in this data product — used to populate the formula editor's
   *  insert-variable picker (the variable currently being edited is excluded). */
  allVariables: Variable[];
  onSave: (v: Variable) => void;
  onCancel: () => void;
  /** Only invoked in edit mode; omit on Add */
  onDelete?: (id: string) => void;
};

export function VariableModal({
  open,
  initialVariable,
  existingNames,
  factors,
  allVariables,
  onSave,
  onCancel,
  onDelete
}: Props) {
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
  const [constSource, setConstSource] = useState<ConstantSource>(initialVariable?.constant?.source ?? 'literal');
  const [literalValue, setLiteralValue] = useState<number | undefined>(initialVariable?.constant?.literalValue);
  const [literalUnit, setLiteralUnit] = useState(initialVariable?.constant?.literalUnit ?? '');
  const [factorId, setFactorId] = useState<string | undefined>(initialVariable?.constant?.factorId);
  const [factorCategoryFilter, setFactorCategoryFilter] = useState<string | undefined>(undefined);
  const [productId, setProductId] = useState<string | undefined>(initialVariable?.constant?.productId);
  const [productField, setProductField] = useState<string | undefined>(initialVariable?.constant?.productField);
  const [catalog, setCatalog] = useState<CatalogProductSummary[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [formulaText, setFormulaText] = useState(initialVariable?.calculation?.formulaText ?? '');
  const [formula, setFormula] = useState<FormulaToken[]>(initialVariable?.calculation?.formula ?? []);

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
      setProductId(undefined);
      setProductField(undefined);
      setFormulaText('');
      setFormula([]);
    }
  }, [open, isEdit]);

  // When opening to edit a different variable, seed the formula state from it
  useEffect(() => {
    if (open && isEdit) {
      setFormula(initialVariable?.calculation?.formula ?? []);
    }
  }, [open, isEdit, initialVariable]);

  // Load catalog when one of the catalog sources is selected
  useEffect(() => {
    if (kind !== 'constant') return;
    if (constSource !== 'single_use_product' && constSource !== 'reusable_product') return;
    const apiSource = constSource === 'single_use_product' ? 'single_use' : 'reusable';
    let cancelled = false;
    setCatalogLoading(true);
    fetch(`/api/admin/catalogs/list?source=${apiSource}`)
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then(data => {
        if (!cancelled) setCatalog(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, constSource]);

  // Factors grouped by category for the picker
  const factorGroups = useMemo(() => {
    const filtered = factorCategoryFilter ? factors.filter(f => f.category?.name === factorCategoryFilter) : factors;
    const byCat = new Map<string, Factor[]>();
    for (const f of filtered) {
      const cat = f.category?.name || 'Uncategorized';
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(f);
    }
    return Array.from(byCat.entries())
      .map(([label, options]) => ({ label, options }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [factors, factorCategoryFilter]);

  const factorCategories = useMemo(
    () =>
      Array.from(new Set(factors.map(f => f.category?.name).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b)
      ),
    [factors]
  );

  const selectedProduct = useMemo(() => catalog.find(p => p.id === productId), [catalog, productId]);

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
      if ((constSource === 'single_use_product' || constSource === 'reusable_product') && (!productId || !productField))
        return;
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
            ? { source: 'literal' as const, literalValue, literalUnit: literalUnit.trim() || undefined }
            : constSource === 'factor'
              ? { source: 'factor' as const, factorId }
              : { source: constSource, productId, productField }
      }),
      ...(kind === 'calculation' && {
        calculation: {
          formula,
          formulaText: formulaText.trim() || undefined,
          unit: unit.trim() || undefined
        }
      })
    };

    onSave(v);
  }

  const saveDisabled = !trimmedName || !!nameInvalid || !!nameDuplicate;

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit variable: ${initialVariable?.name}` : 'Add variable'}
      onCancel={onCancel}
      width={560}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            {isEdit && onDelete && initialVariable && (
              <Popconfirm
                title={`Delete variable "${initialVariable.name}"?`}
                description='Removes the variable and any node placed on the canvas.'
                okText='Delete'
                okButtonProps={{ danger: true }}
                onConfirm={() => onDelete(initialVariable.id)}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            )}
          </div>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type='primary' onClick={handleOk} disabled={saveDisabled}>
              {isEdit ? 'Save' : 'Add'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form layout='vertical'>
        <Form.Item label='Type'>
          <Radio.Group value={kind} onChange={e => setKind(e.target.value)}>
            {(['user_input', 'constant', 'calculation'] as VariableKind[]).map(k => {
              const c = VARIABLE_COLORS[k];
              return (
                <Radio.Button key={k} value={k} style={{ borderColor: c.border }}>
                  <Tag color={c.border} style={{ marginRight: 4 }}>
                    {VARIABLE_KIND_LABEL[k]}
                  </Tag>
                </Radio.Button>
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
              <Space size='middle' style={{ marginBottom: 24, width: '100%' }} wrap>
                <Form.Item label='Min' style={{ marginBottom: 0 }} help='Lowest value the slider can be dragged to'>
                  <InputNumber value={sliderMin} onChange={v => setSliderMin(v ?? 0)} style={{ width: 120 }} />
                </Form.Item>
                <Form.Item label='Max' style={{ marginBottom: 0 }} help='Highest value the slider can be dragged to'>
                  <InputNumber value={sliderMax} onChange={v => setSliderMax(v ?? 100)} style={{ width: 120 }} />
                </Form.Item>
                <Form.Item
                  label='Step'
                  style={{ marginBottom: 0 }}
                  help='How much the slider moves per click (e.g. 1, 0.1, 5)'
                >
                  <InputNumber value={sliderStep} onChange={v => setSliderStep(v ?? 1)} style={{ width: 120 }} />
                </Form.Item>
              </Space>
            )}
          </>
        )}

        {kind === 'constant' && (
          <>
            <Form.Item label='Source'>
              <Radio.Group value={constSource} onChange={e => setConstSource(e.target.value)}>
                <Radio.Button value='literal'>Literal value</Radio.Button>
                <Radio.Button value='factor'>Factor library</Radio.Button>
                <Radio.Button value='single_use_product'>Single-Use Database</Radio.Button>
                <Radio.Button value='reusable_product'>Reusable Database</Radio.Button>
              </Radio.Group>
            </Form.Item>

            {constSource === 'literal' && (
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
            )}

            {constSource === 'factor' && (
              <>
                <Form.Item label='Category'>
                  <Select
                    allowClear
                    value={factorCategoryFilter}
                    onChange={setFactorCategoryFilter}
                    placeholder='All categories'
                    style={{ maxWidth: 280 }}
                    options={factorCategories.map(c => ({ value: c, label: c }))}
                  />
                </Form.Item>
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
                    options={factorGroups.map(g => ({
                      label: g.label,
                      options: g.options.map(f => ({
                        value: f.id,
                        label: `${f.name} = ${f.currentValue} ${f.unit}`
                      }))
                    }))}
                  />
                </Form.Item>
              </>
            )}

            {(constSource === 'single_use_product' || constSource === 'reusable_product') && (
              <>
                <Form.Item label={constSource === 'single_use_product' ? 'Single-use product' : 'Reusable product'}>
                  <Select
                    showSearch
                    loading={catalogLoading}
                    value={productId}
                    onChange={v => {
                      setProductId(v);
                      setProductField(undefined);
                    }}
                    placeholder='Search products…'
                    filterOption={(input, option) =>
                      String(option?.label ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={catalog.map(p => ({
                      value: p.id,
                      label: `${p.label} — ${p.category}`
                    }))}
                  />
                </Form.Item>
                {selectedProduct && (
                  <Form.Item label='Field' help='Which numeric field from this product becomes the constant value.'>
                    <Select
                      value={productField}
                      onChange={setProductField}
                      placeholder='Pick a field'
                      options={selectedProduct.numericFields.map(f => ({
                        value: f.key,
                        label: `${f.label} = ${f.value}${f.unit ? ' ' + f.unit : ''}`
                      }))}
                    />
                  </Form.Item>
                )}
              </>
            )}
          </>
        )}

        {kind === 'calculation' && (
          <>
            <Form.Item
              label='Formula'
              help='Type numbers and operators, drag variable pills from the sidebar, or use the "+ Insert variable" button. Excel functions like IF(), SUM(), ROUND() work too.'
            >
              <FormulaEditor
                value={formula}
                onChange={setFormula}
                variables={allVariables.filter(v => v.id !== initialVariable?.id)}
                placeholder='e.g. ProductVolume * EmissionFactor / 1000'
              />
            </Form.Item>
            <Form.Item label='Unit (optional)'>
              <Input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder='e.g. MTCO2e, kg, USD'
                style={{ maxWidth: 240 }}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
