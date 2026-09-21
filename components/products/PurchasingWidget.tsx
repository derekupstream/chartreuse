/**
 * The purchasing widgets, reverse-engineered from the REAL projections wizard
 * (Derek, 2026-09-20: "it should look and work JUST like the projections projects…
 * the way the popout comes up and you have choices").
 *
 * Same experience as components/projects/[id]/single-use and reusable-purchasing:
 * item rows grouped by category with baseline/forecast summaries, an "Add" button that
 * opens a right-side drawer, and a stepped form inside it — a cascading product picker
 * (Category → Product → Material → Size → Description, auto-advancing when only one
 * option remains), then quantities with a purchase frequency, then the forecast
 * (new cases for single-use; return rate for reusables).
 *
 * The difference is only where the data lives: rows are written into the composed
 * product's answer values (the widget's fixed list key), and products come from the
 * VERSIONED catalogs rather than the static ones.
 */
import { DeleteOutlined, EditOutlined, LeftOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Drawer, Empty, Form, Input, InputNumber, Popconfirm, Radio, Select, Typography } from 'antd';
import { useMemo, useState } from 'react';

import type { GroupRow } from 'lib/smartFields/variables';

const { Text, Title, Paragraph } = Typography;

type CatalogRow = Record<string, string | number | null>;

export type PurchasingKind = 'singleUseItems' | 'reusableItems';

const FREQUENCIES = [
  { name: 'Daily', annualOccurrence: 365 },
  { name: 'Weekly', annualOccurrence: 52 },
  { name: 'Monthly', annualOccurrence: 12 },
  { name: 'Annually', annualOccurrence: 1 }
] as const;
const annualOccurrence = (frequency: string) => FREQUENCIES.find(f => f.name === frequency)?.annualOccurrence ?? 1;

const DEFAULT_RETURN_RATE = 95;

/** The cascade's features, in pick order — mirrors the wizard's SelectProductStep. */
const CASCADE: { label: string; column: string }[] = [
  { label: 'Category', column: 'product_category' },
  { label: 'Product', column: 'product' },
  { label: 'Material', column: 'primary_material' },
  { label: 'Size', column: 'size_options' },
  { label: 'Product description', column: 'product_description' }
];

const cell = (row: CatalogRow, column: string) => String(row[column] ?? '').trim();
const num = (row: CatalogRow, column: string) => {
  const value = Number(String(row[column] ?? '').replace(/[^0-9.eE+-]/g, ''));
  return Number.isFinite(value) ? value : undefined;
};

/** A human name for a catalog row — description first, falling back to the product type. */
const rowName = (row: CatalogRow) => cell(row, 'product_description') || cell(row, 'product');

const money = (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/**
 * The cascading picker. Selections narrow the catalog; a feature with exactly one
 * remaining option is chosen automatically (like the wizard); changing an earlier
 * feature clears everything after it. Resolves when one row remains.
 */
function ProductCascade({
  rows,
  selected,
  onChange
}: {
  rows: CatalogRow[];
  selected: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  // Walk the features, filtering as we go; collect what to render.
  const rendered: { label: string; column: string; options: string[]; value?: string; disabled: boolean }[] = [];
  let remaining = rows;
  let blocked = false;
  const effective: Record<string, string> = {};
  for (const feature of CASCADE) {
    if (blocked) break;
    const options = Array.from(new Set(remaining.map(r => cell(r, feature.column)).filter(Boolean))).sort();
    if (options.length === 0) continue; // the catalog has no such column values — skip
    if (options.length === 1) {
      // Auto-advance: show it locked, keep filtering.
      effective[feature.column] = options[0];
      remaining = remaining.filter(r => cell(r, feature.column) === options[0]);
      rendered.push({ ...feature, options, value: options[0], disabled: true });
      continue;
    }
    const chosen = selected[feature.column];
    rendered.push({ ...feature, options, value: chosen, disabled: false });
    if (!chosen) {
      blocked = true; // later features wait until this one is picked
      continue;
    }
    effective[feature.column] = chosen;
    remaining = remaining.filter(r => cell(r, feature.column) === chosen);
  }
  return (
    <>
      {rendered.map(feature => (
        <Form.Item key={feature.column} label={feature.label} style={{ marginBottom: 12 }}>
          <Select
            showSearch
            disabled={feature.disabled}
            placeholder={`Select a ${feature.label.toLowerCase()}`}
            value={feature.value || undefined}
            options={feature.options.map(o => ({ value: o, label: o }))}
            onChange={value => {
              // Keep choices up to and including this feature; clear the rest.
              const next: Record<string, string> = {};
              for (const f of CASCADE) {
                if (f.column === feature.column) break;
                if (selected[f.column]) next[f.column] = selected[f.column];
              }
              next[feature.column] = value;
              onChange(next);
            }}
          />
        </Form.Item>
      ))}
    </>
  );
}

/** Re-derives the row the current cascade selections resolve to (single source of truth). */
export function resolveCascade(rows: CatalogRow[], selected: Record<string, string>): CatalogRow | null {
  let remaining = rows;
  for (const feature of CASCADE) {
    const options = Array.from(new Set(remaining.map(r => cell(r, feature.column)).filter(Boolean)));
    if (options.length === 0) continue;
    const chosen = options.length === 1 ? options[0] : selected[feature.column];
    if (!chosen) return null;
    remaining = remaining.filter(r => cell(r, feature.column) === chosen);
  }
  return remaining.length === 1 ? remaining[0] : null;
}

export function PurchasingWidget({
  kind,
  title,
  help,
  catalogRows,
  rows,
  setRows
}: {
  kind: PurchasingKind;
  title: string;
  help?: string;
  catalogRows: CatalogRow[];
  rows: GroupRow[];
  setRows: (rows: GroupRow[]) => void;
}) {
  const isSingleUse = kind === 'singleUseItems';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [cascade, setCascade] = useState<Record<string, string>>({});
  const [item, setItem] = useState<GroupRow>({});

  const resolved = useMemo(() => resolveCascade(catalogRows, cascade), [catalogRows, cascade]);

  function openAdd() {
    setEditIndex(null);
    setCascade({});
    setItem(isSingleUse ? { frequency: 'Weekly' } : {});
    setStep(1);
    setDrawerOpen(true);
  }

  function openEdit(index: number) {
    const row = rows[index];
    setEditIndex(index);
    // Rebuild the cascade from the stored catalog identity so step 1 shows the choice.
    const source = catalogRows.find(r => String(r.product_id ?? '') === String(row.productId ?? ''));
    const selected: Record<string, string> = {};
    if (source) for (const f of CASCADE) if (cell(source, f.column)) selected[f.column] = cell(source, f.column);
    setCascade(selected);
    setItem({ ...row });
    setStep(1);
    setDrawerOpen(true);
  }

  /** Step 1 → 2: carry the resolved product's catalog values into the item. */
  function chooseProduct() {
    if (!resolved) return;
    setItem(previous => ({
      ...previous,
      productId: cell(resolved, 'product_id'),
      productName: rowName(resolved),
      category: cell(resolved, 'product_category'),
      unitsPerCase: num(resolved, 'case_count') ?? (previous.unitsPerCase as number) ?? 0,
      itemWeightLbs: num(resolved, 'item_weight_lbs') ?? 0,
      ...(isSingleUse ? {} : { caseCost: num(resolved, 'case_price') ?? (previous.caseCost as number) ?? 0 })
    }));
    setStep(2);
  }

  /** Final save: derive the per-year columns the equations read, then store the row. */
  function saveItem(finalPatch: GroupRow) {
    const complete: GroupRow = { ...item, ...finalPatch };
    if (isSingleUse) {
      const occurrence = annualOccurrence(String(complete.frequency ?? 'Annually'));
      complete.casesPerYear = Number(complete.casesPurchased ?? 0) * occurrence;
      complete.newCasesPerYear = Number(complete.newCasesPurchased ?? 0) * occurrence;
      if (complete.newCaseCost === undefined) complete.newCaseCost = complete.caseCost;
    }
    const next = editIndex === null ? [...rows, complete] : rows.map((r, i) => (i === editIndex ? complete : r));
    setRows(next);
    setDrawerOpen(false);
  }

  // ── the item rows, grouped by category like the real page ────────────────────
  const grouped = useMemo(() => {
    const byCategory = new Map<string, { row: GroupRow; index: number }[]>();
    rows.forEach((row, index) => {
      const category = String(row.category ?? 'Other');
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category)!.push({ row, index });
    });
    return Array.from(byCategory.entries());
  }, [rows]);

  const totals = useMemo(() => {
    let baseline = 0;
    let forecast = 0;
    for (const row of rows) {
      if (isSingleUse) {
        baseline += Number(row.casesPerYear ?? 0) * Number(row.caseCost ?? 0);
        forecast += Number(row.newCasesPerYear ?? 0) * Number(row.newCaseCost ?? row.caseCost ?? 0);
      } else {
        baseline += Number(row.casesPurchased ?? 0) * Number(row.caseCost ?? 0);
        forecast +=
          (Number(row.casesPurchased ?? 0) * Number(row.caseCost ?? 0) * Number(row.repurchasePercent ?? 0)) / 100;
      }
    }
    return { baseline, forecast };
  }, [rows, isSingleUse]);

  const addLabel = isSingleUse ? 'Add a single-use item' : 'Add a reusable item';

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <Text strong style={{ fontSize: 16 }}>
          {title}
        </Text>
        {rows.length > 0 && (
          <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>
            {addLabel}
          </Button>
        )}
      </div>
      {help && (
        <Text type='secondary' style={{ display: 'block', fontSize: 13, marginTop: 2 }}>
          {help}
        </Text>
      )}

      {rows.length === 0 && (
        <div
          style={{
            border: '1px dashed #d9d9d9',
            borderRadius: 8,
            padding: 24,
            marginTop: 12,
            textAlign: 'center'
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              isSingleUse
                ? 'No single-use items yet. Add the products you purchase regularly.'
                : 'No reusable items yet. Add the reusables you will purchase.'
            }
          >
            <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>
              {addLabel}
            </Button>
          </Empty>
        </div>
      )}

      {grouped.map(([category, items]) => (
        <div key={category}>
          <Title level={5} style={{ marginBottom: 0, marginTop: 16 }}>
            {category}
          </Title>
          <Divider style={{ margin: '8px 0' }} />
          {items.map(({ row, index }) => {
            const baseline = isSingleUse
              ? Number(row.casesPerYear ?? 0) * Number(row.caseCost ?? 0)
              : Number(row.casesPurchased ?? 0) * Number(row.caseCost ?? 0);
            const forecast = isSingleUse
              ? Number(row.newCasesPerYear ?? 0) * Number(row.newCaseCost ?? row.caseCost ?? 0)
              : (Number(row.casesPurchased ?? 0) * Number(row.caseCost ?? 0) * Number(row.repurchasePercent ?? 0)) /
                100;
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  border: '1px solid #ececea',
                  borderRadius: 8,
                  marginBottom: 8,
                  background: '#fff',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: '2 1 220px', minWidth: 0 }}>
                  <Text strong>{String(row.productName ?? '—')}</Text>
                  <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                    {isSingleUse
                      ? `${row.casesPurchased ?? 0} cases ${String(row.frequency ?? '').toLowerCase()} · ${row.unitsPerCase ?? 0} units/case · ${money(Number(row.caseCost ?? 0))}/case`
                      : `${row.casesPurchased ?? 0} cases · ${row.unitsPerCase ?? 0} units/case · ${money(Number(row.caseCost ?? 0))}/case`}
                  </Text>
                </div>
                <div style={{ flex: '1 0 130px' }}>
                  <Text type='secondary' style={{ fontSize: 11, display: 'block' }}>
                    {isSingleUse ? 'Baseline / year' : 'One-time cost'}
                  </Text>
                  <Text strong>{money(baseline)}</Text>
                </div>
                <div style={{ flex: '1 0 130px' }}>
                  <Text type='secondary' style={{ fontSize: 11, display: 'block' }}>
                    {isSingleUse ? 'Forecast / year' : 'Restock / year'}
                  </Text>
                  <Text strong>{money(forecast)}</Text>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button size='small' type='text' icon={<EditOutlined />} onClick={() => openEdit(index)} />
                  <Popconfirm title='Remove this item?' onConfirm={() => setRows(rows.filter((_, i) => i !== index))}>
                    <Button size='small' type='text' danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {rows.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 24,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#f8faf3',
            border: '1px solid #e4eecf',
            flexWrap: 'wrap'
          }}
        >
          <Text strong>Totals</Text>
          <Text>
            {isSingleUse ? 'Baseline' : 'One-time'}: <strong>{money(totals.baseline)}</strong>
          </Text>
          <Text>
            {isSingleUse ? 'Forecast' : 'Restock'}: <strong>{money(totals.forecast)}</strong>
            {isSingleUse ? '/yr' : '/yr'}
          </Text>
        </div>
      )}

      <Drawer
        title={
          step === 3
            ? isSingleUse
              ? 'Add purchasing forecast'
              : 'Return rate'
            : editIndex !== null
              ? isSingleUse
                ? 'Edit single-use item'
                : 'Edit reusable item'
              : addLabel
        }
        placement='right'
        width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 40 : 600)}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        {step === 1 && (
          <Form layout='vertical'>
            <Paragraph type='secondary'>
              Select a product from the {isSingleUse ? 'single-use' : 'reusable'} product database. Pick a category and
              narrow down — when only one option fits, it is chosen for you.
            </Paragraph>
            <ProductCascade rows={catalogRows} selected={cascade} onChange={setCascade} />
            {resolved && (
              <Paragraph style={{ background: '#f8faf3', borderRadius: 6, padding: '8px 10px' }}>
                <Text strong>{rowName(resolved)}</Text>
                {num(resolved, 'case_count') !== undefined && (
                  <Text type='secondary'> · {num(resolved, 'case_count')} units/case</Text>
                )}
              </Paragraph>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button size='large' type='primary' disabled={!resolved} onClick={chooseProduct}>
                Next
              </Button>
            </div>
          </Form>
        )}

        {step === 2 && (
          <Form layout='vertical' onFinish={() => (isSingleUse ? setStep(3) : setStep(3))} initialValues={{}}>
            <Title level={4} style={{ marginTop: 0 }}>
              {String(item.productName ?? '')}
            </Title>
            {isSingleUse && (
              <Form.Item label='How often do you purchase?' required>
                <Radio.Group
                  value={String(item.frequency ?? 'Weekly')}
                  onChange={e => setItem({ ...item, frequency: e.target.value })}
                >
                  {FREQUENCIES.map(f => (
                    <Radio.Button key={f.name} value={f.name}>
                      {f.name}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
            )}
            <Form.Item label='Cases purchased' required>
              <InputNumber
                autoFocus
                min={0}
                style={{ width: '100%' }}
                value={item.casesPurchased !== undefined ? Number(item.casesPurchased) : undefined}
                onChange={v => setItem({ ...item, casesPurchased: v ?? 0 })}
              />
            </Form.Item>
            <Form.Item label='Units per case' required>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                value={item.unitsPerCase !== undefined ? Number(item.unitsPerCase) : undefined}
                onChange={v => setItem({ ...item, unitsPerCase: v ?? 0 })}
              />
            </Form.Item>
            <Form.Item label='Cost per case' required>
              <InputNumber
                min={0}
                prefix='$'
                style={{ width: '100%' }}
                value={item.caseCost !== undefined ? Number(item.caseCost) : undefined}
                onChange={v => setItem({ ...item, caseCost: v ?? 0 })}
              />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button icon={<LeftOutlined />} onClick={() => setStep(1)}>
                Go Back
              </Button>
              <Button
                size='large'
                type='primary'
                disabled={item.casesPurchased === undefined || item.caseCost === undefined}
                onClick={() => setStep(3)}
              >
                Next
              </Button>
            </div>
          </Form>
        )}

        {step === 3 && isSingleUse && (
          <Form layout='vertical'>
            <Paragraph type='secondary'>
              Set your project goals by forecasting the purchasing you expect AFTER switching to reusables — zero if
              this item goes away entirely.
            </Paragraph>
            <Title level={4} style={{ marginTop: 0 }}>
              {String(item.productName ?? '')}
            </Title>
            <Form.Item label={`New cases purchased ${String(item.frequency ?? '').toLowerCase()}`} required>
              <InputNumber
                autoFocus
                min={0}
                style={{ width: '100%' }}
                value={item.newCasesPurchased !== undefined ? Number(item.newCasesPurchased) : undefined}
                onChange={v => setItem({ ...item, newCasesPurchased: v ?? 0 })}
              />
            </Form.Item>
            <Form.Item label='Cost per case'>
              <InputNumber
                min={0}
                prefix='$'
                style={{ width: '100%' }}
                value={
                  item.newCaseCost !== undefined
                    ? Number(item.newCaseCost)
                    : item.caseCost !== undefined
                      ? Number(item.caseCost)
                      : undefined
                }
                onChange={v => setItem({ ...item, newCaseCost: v ?? 0 })}
              />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button icon={<LeftOutlined />} onClick={() => setStep(2)}>
                Go Back
              </Button>
              <Button
                size='large'
                type='primary'
                disabled={item.newCasesPurchased === undefined}
                onClick={() => saveItem({})}
              >
                {editIndex !== null ? 'Save' : 'Add item'}
              </Button>
            </div>
          </Form>
        )}

        {step === 3 && !isSingleUse && (
          <Form layout='vertical'>
            <Paragraph type='secondary'>
              How many reusables come back? Customers can lose or damage some — the rest you&apos;ll need to repurchase.
              If <strong>95%</strong> come back, you&apos;ll repurchase about <strong>5%</strong> of your initial order
              each year.
            </Paragraph>
            <Title level={4} style={{ marginTop: 0 }}>
              {String(item.productName ?? '')}
            </Title>
            <Form.Item
              label='Return Rate (%)'
              help='Percentage of reusables your customers return. Industry typical is 90–98%.'
            >
              <InputNumber
                autoFocus
                min={0}
                max={100}
                addonAfter='%'
                style={{ width: '100%' }}
                value={
                  item.repurchasePercent !== undefined
                    ? Math.max(0, Math.min(100, 100 - Number(item.repurchasePercent)))
                    : DEFAULT_RETURN_RATE
                }
                onChange={v => setItem({ ...item, repurchasePercent: 100 - (v ?? DEFAULT_RETURN_RATE) })}
              />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button icon={<LeftOutlined />} onClick={() => setStep(2)}>
                Previous
              </Button>
              <Button
                size='large'
                type='primary'
                onClick={() =>
                  saveItem(item.repurchasePercent === undefined ? { repurchasePercent: 100 - DEFAULT_RETURN_RATE } : {})
                }
              >
                {editIndex !== null ? 'Save' : 'Add item'}
              </Button>
            </div>
          </Form>
        )}
      </Drawer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * The Dishwashing widget — the real page's "Add dishwasher" experience
 * (components/projects/[id]/dishwashing): machine rows with utility summaries,
 * and a drawer form with type / temperature / Energy Star and the usage numbers.
 * The machine list comes from the versioned Dishwasher Factors table.
 * ──────────────────────────────────────────────────────────────────────────── */

export function DishwasherWidget({
  title,
  help,
  catalogRows,
  rows,
  setRows
}: {
  title: string;
  help?: string;
  catalogRows: CatalogRow[];
  rows: GroupRow[];
  setRows: (rows: GroupRow[]) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [item, setItem] = useState<GroupRow>({});

  const machineTypes = useMemo(
    () => Array.from(new Set(catalogRows.map(r => cell(r, 'machine_type')).filter(Boolean))).sort(),
    [catalogRows]
  );
  const temperatures = useMemo(
    () =>
      Array.from(
        new Set(
          catalogRows
            .filter(r => !item.machineType || cell(r, 'machine_type') === item.machineType)
            .map(r => cell(r, 'temperature'))
            .filter(Boolean)
        )
      ).sort(),
    [catalogRows, item.machineType]
  );
  const factorRow = useMemo(
    () =>
      catalogRows.find(
        r => cell(r, 'machine_type') === item.machineType && cell(r, 'temperature') === item.temperature
      ) ?? null,
    [catalogRows, item.machineType, item.temperature]
  );
  const isEnergyStar = item.energyStar !== 'No';
  const waterPerRack = factorRow
    ? num(factorRow, isEnergyStar ? 'water_gal_per_rack_energy_star' : 'water_gal_per_rack_conventional')
    : undefined;

  function openAdd() {
    setEditIndex(null);
    setItem({ energyStar: 'Yes' });
    setDrawerOpen(true);
  }
  function openEdit(index: number) {
    setEditIndex(index);
    setItem({ ...rows[index] });
    setDrawerOpen(true);
  }
  function save() {
    const complete: GroupRow = { ...item };
    if (waterPerRack !== undefined) complete.waterGalPerRack = waterPerRack;
    if (complete.oneTimeCost === undefined) complete.oneTimeCost = 0;
    const next = editIndex === null ? [...rows, complete] : rows.map((r, i) => (i === editIndex ? complete : r));
    setRows(next);
    setDrawerOpen(false);
  }

  const yearly = (row: GroupRow) =>
    Number(row.racksPerDay ?? 0) * Number(row.operatingDays ?? 0) * Number(row.utilityCostPerRack ?? 0);
  const totals = rows.reduce<{ utilities: number; oneTime: number }>(
    (sum, row) => ({ utilities: sum.utilities + yearly(row), oneTime: sum.oneTime + Number(row.oneTimeCost ?? 0) }),
    { utilities: 0, oneTime: 0 }
  );
  const canSave =
    !!item.machineType && !!item.temperature && item.racksPerDay !== undefined && item.operatingDays !== undefined;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <Text strong style={{ fontSize: 16 }}>
          {title}
        </Text>
        {rows.length > 0 && (
          <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>
            Add dishwasher
          </Button>
        )}
      </div>
      {help && (
        <Text type='secondary' style={{ display: 'block', fontSize: 13, marginTop: 2 }}>
          {help}
        </Text>
      )}

      {rows.length === 0 && (
        <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: 24, marginTop: 12, textAlign: 'center' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No dish machines yet.'>
            <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>
              Add dishwasher
            </Button>
          </Empty>
        </div>
      )}

      {rows.map((row, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            border: '1px solid #ececea',
            borderRadius: 8,
            marginTop: 8,
            background: '#fff',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: '2 1 220px', minWidth: 0 }}>
            <Text strong>
              {String(row.machineType ?? '—')} · {String(row.temperature ?? '')} temp
              {row.energyStar !== 'No' ? ' · ENERGY STAR' : ''}
            </Text>
            <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
              {row.racksPerDay ?? 0} racks/day × {row.operatingDays ?? 0} days ·{' '}
              {money(Number(row.utilityCostPerRack ?? 0))}
              /rack
              {row.waterGalPerRack !== undefined ? ` · ${row.waterGalPerRack} gal/rack` : ''}
            </Text>
          </div>
          <div style={{ flex: '1 0 130px' }}>
            <Text type='secondary' style={{ fontSize: 11, display: 'block' }}>
              Utilities / year
            </Text>
            <Text strong>{money(yearly(row))}</Text>
          </div>
          <div style={{ flex: '1 0 130px' }}>
            <Text type='secondary' style={{ fontSize: 11, display: 'block' }}>
              One-time cost
            </Text>
            <Text strong>{money(Number(row.oneTimeCost ?? 0))}</Text>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button size='small' type='text' icon={<EditOutlined />} onClick={() => openEdit(index)} />
            <Popconfirm title='Remove this dishwasher?' onConfirm={() => setRows(rows.filter((_, i) => i !== index))}>
              <Button size='small' type='text' danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        </div>
      ))}

      {rows.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 24,
            padding: '10px 12px',
            marginTop: 8,
            borderRadius: 8,
            background: '#f8faf3',
            border: '1px solid #e4eecf',
            flexWrap: 'wrap'
          }}
        >
          <Text strong>Totals</Text>
          <Text>
            Utilities: <strong>{money(totals.utilities)}</strong>/yr
          </Text>
          <Text>
            One-time: <strong>{money(totals.oneTime)}</strong>
          </Text>
        </div>
      )}

      <Drawer
        title={editIndex !== null ? 'Update dishwashing expense' : 'Add dishwashing expense'}
        placement='right'
        width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 40 : 600)}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        <Form layout='vertical'>
          <Form.Item label='Dishwasher type' required>
            <Select
              showSearch
              placeholder='Select a machine type'
              value={(item.machineType as string) || undefined}
              options={machineTypes.map(t => ({ value: t, label: t }))}
              onChange={machineType => setItem({ ...item, machineType, temperature: undefined as never })}
            />
          </Form.Item>
          <Form.Item label='Temperature' required>
            <Radio.Group
              value={(item.temperature as string) || undefined}
              onChange={e => setItem({ ...item, temperature: e.target.value })}
            >
              {temperatures.map(t => (
                <Radio.Button key={t} value={t}>
                  {t}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label='Energy star certification' required>
            <Radio.Group
              value={(item.energyStar as string) ?? 'Yes'}
              onChange={e => setItem({ ...item, energyStar: e.target.value })}
            >
              <Radio.Button value='Yes'>Yes</Radio.Button>
              <Radio.Button value='No'>No</Radio.Button>
            </Radio.Group>
          </Form.Item>
          {factorRow && waterPerRack !== undefined && (
            <Paragraph style={{ background: '#f8faf3', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
              This machine uses about <Text strong>{waterPerRack} gallons per rack</Text>
              {isEnergyStar ? ' (ENERGY STAR)' : ' (conventional)'} — from the Dishwasher Factors table.
            </Paragraph>
          )}
          <Form.Item label='Racks per day for reusables' required>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              value={item.racksPerDay !== undefined ? Number(item.racksPerDay) : undefined}
              onChange={v => setItem({ ...item, racksPerDay: v ?? 0 })}
            />
          </Form.Item>
          <Form.Item label='Dish machine operating days per year' required>
            <InputNumber
              min={0}
              max={365}
              style={{ width: '100%' }}
              value={item.operatingDays !== undefined ? Number(item.operatingDays) : undefined}
              onChange={v => setItem({ ...item, operatingDays: v ?? 0 })}
            />
          </Form.Item>
          <Form.Item
            label='Utility cost per rack'
            help='Water + energy to wash one rack. A typical door machine runs $0.15–$0.30.'
          >
            <InputNumber
              min={0}
              step={0.01}
              prefix='$'
              style={{ width: '100%' }}
              value={item.utilityCostPerRack !== undefined ? Number(item.utilityCostPerRack) : undefined}
              onChange={v => setItem({ ...item, utilityCostPerRack: v ?? 0 })}
            />
          </Form.Item>
          <Form.Item label='Purchase & installation cost (one-time, optional)'>
            <InputNumber
              min={0}
              prefix='$'
              style={{ width: '100%' }}
              value={item.oneTimeCost !== undefined ? Number(item.oneTimeCost) : undefined}
              onChange={v => setItem({ ...item, oneTimeCost: v ?? 0 })}
            />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size='large' type='primary' disabled={!canSave} onClick={save}>
              {editIndex !== null ? 'Save' : 'Add dishwasher'}
            </Button>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * The Additional-costs widget — the real page's Labor / Waste hauling / Other
 * expense drawers folded into one: expense rows with per-year or one-time
 * amounts (negative = savings), and a drawer form with category, frequency,
 * amount and description.
 * ──────────────────────────────────────────────────────────────────────────── */

const EXPENSE_CATEGORIES = ['Labor', 'Waste hauling', 'Other'] as const;
const EXPENSE_FREQUENCIES = ['One Time', 'Daily', 'Weekly', 'Monthly', 'Annually'] as const;

export function AdditionalCostsWidget({
  title,
  help,
  rows,
  setRows
}: {
  title: string;
  help?: string;
  rows: GroupRow[];
  setRows: (rows: GroupRow[]) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [item, setItem] = useState<GroupRow>({});

  function openAdd() {
    setEditIndex(null);
    setItem({ category: 'Labor', frequency: 'Annually' });
    setDrawerOpen(true);
  }
  function openEdit(index: number) {
    setEditIndex(index);
    setItem({ ...rows[index] });
    setDrawerOpen(true);
  }
  function save() {
    const cost = Number(item.cost ?? 0);
    const frequency = String(item.frequency ?? 'Annually');
    const complete: GroupRow = {
      ...item,
      // The derived columns equations SUM over: recurring spend lands in amountPerYear,
      // one-time spend in oneTimeAmount — never both.
      amountPerYear: frequency === 'One Time' ? 0 : cost * annualOccurrence(frequency),
      oneTimeAmount: frequency === 'One Time' ? cost : 0
    };
    const next = editIndex === null ? [...rows, complete] : rows.map((r, i) => (i === editIndex ? complete : r));
    setRows(next);
    setDrawerOpen(false);
  }

  const totals = rows.reduce<{ perYear: number; oneTime: number }>(
    (sum, row) => ({
      perYear: sum.perYear + Number(row.amountPerYear ?? 0),
      oneTime: sum.oneTime + Number(row.oneTimeAmount ?? 0)
    }),
    { perYear: 0, oneTime: 0 }
  );
  const canSave = item.cost !== undefined && !!String(item.description ?? '').trim();

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <Text strong style={{ fontSize: 16 }}>
          {title}
        </Text>
        {rows.length > 0 && (
          <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>
            Add an expense
          </Button>
        )}
      </div>
      {help && (
        <Text type='secondary' style={{ display: 'block', fontSize: 13, marginTop: 2 }}>
          {help}
        </Text>
      )}

      {rows.length === 0 && (
        <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: 24, marginTop: 12, textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description='No additional costs yet. Add labor, waste hauling or other program expenses — or savings.'
          >
            <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>
              Add an expense
            </Button>
          </Empty>
        </div>
      )}

      {EXPENSE_CATEGORIES.map(category => {
        const items = rows.map((row, index) => ({ row, index })).filter(({ row }) => row.category === category);
        if (!items.length) return null;
        return (
          <div key={category}>
            <Title level={5} style={{ marginBottom: 0, marginTop: 16 }}>
              {category}
            </Title>
            <Divider style={{ margin: '8px 0' }} />
            {items.map(({ row, index }) => {
              const oneTime = Number(row.oneTimeAmount ?? 0) !== 0;
              const amount = oneTime ? Number(row.oneTimeAmount ?? 0) : Number(row.amountPerYear ?? 0);
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    border: '1px solid #ececea',
                    borderRadius: 8,
                    marginBottom: 8,
                    background: '#fff',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: '2 1 220px', minWidth: 0 }}>
                    <Text strong>{String(row.description ?? '—')}</Text>
                    <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                      {String(row.frequency ?? 'Annually')}
                      {!oneTime && Number(row.cost ?? 0) !== amount ? ` · ${money(Number(row.cost ?? 0))} each` : ''}
                    </Text>
                  </div>
                  <div style={{ flex: '1 0 150px' }}>
                    <Text type='secondary' style={{ fontSize: 11, display: 'block' }}>
                      {oneTime ? 'One-time' : 'Per year'}
                    </Text>
                    <Text strong style={{ color: amount < 0 ? '#3f8600' : undefined }}>
                      {money(amount)}
                      {amount < 0 ? ' (savings)' : ''}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button size='small' type='text' icon={<EditOutlined />} onClick={() => openEdit(index)} />
                    <Popconfirm
                      title='Remove this expense?'
                      onConfirm={() => setRows(rows.filter((_, i) => i !== index))}
                    >
                      <Button size='small' type='text' danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {rows.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 24,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#f8faf3',
            border: '1px solid #e4eecf',
            flexWrap: 'wrap'
          }}
        >
          <Text strong>Totals</Text>
          <Text>
            Recurring: <strong>{money(totals.perYear)}</strong>/yr
          </Text>
          <Text>
            One-time: <strong>{money(totals.oneTime)}</strong>
          </Text>
        </div>
      )}

      <Drawer
        title={editIndex !== null ? 'Update expense' : 'Add an expense'}
        placement='right'
        width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 40 : 600)}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        <Form layout='vertical'>
          <Form.Item label='Category' required>
            <Radio.Group
              value={(item.category as string) ?? 'Labor'}
              onChange={e => setItem({ ...item, category: e.target.value })}
            >
              {EXPENSE_CATEGORIES.map(c => (
                <Radio.Button key={c} value={c}>
                  {c}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label='Frequency' required>
            <Radio.Group
              value={(item.frequency as string) ?? 'Annually'}
              onChange={e => setItem({ ...item, frequency: e.target.value })}
            >
              {EXPENSE_FREQUENCIES.map(f => (
                <Radio.Button key={f} value={f}>
                  {f}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label='Cost or savings'
            help='A positive number is a cost; a negative number is a saving (for example a hauling bill that shrinks).'
            required
          >
            <InputNumber
              prefix='$'
              style={{ width: '100%' }}
              value={item.cost !== undefined ? Number(item.cost) : undefined}
              onChange={v => setItem({ ...item, cost: v ?? 0 })}
            />
          </Form.Item>
          <Form.Item label='Description' required>
            <Input
              value={(item.description as string) ?? ''}
              placeholder='e.g. Dish room staffing, evening shift'
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItem({ ...item, description: e.target.value })}
            />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size='large' type='primary' disabled={!canSave} onClick={save}>
              {editIndex !== null ? 'Save' : 'Add expense'}
            </Button>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
