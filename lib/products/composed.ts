/**
 * Composed products — the Product Studio thin slice (docs/CR2-PRODUCT-STUDIO-SPEC.md).
 * A composed product is screens of blocks over input-field definitions and published
 * smart fields; ONE renderer serves the builder preview and the live product, so
 * preview is never a lie.
 */
import type { EquationToken, SmartVariable } from 'lib/smartFields/variables';
import { detectRequirements } from 'lib/smartFields/variables';

/**
 * How much of a row a block takes (Derek, 2026-09-20, the Squarespace-style layout):
 * 'full' is its own row; consecutive 'half' blocks pair up side by side, two per row.
 * Only compact blocks may be 'half' — see HALF_CAPABLE_KINDS.
 */
export type BlockWidth = 'full' | 'half';

export type ComposedBlock = { width?: BlockWidth } & (
  | { id: string; kind: 'heading'; text: string }
  | { id: string; kind: 'text'; text: string }
  | { id: string; kind: 'inputField'; inputKey: string }
  /** Several questions presented together under one small title. */
  | { id: string; kind: 'questionGroup'; title?: string; inputKeys: string[] }
  | { id: string; kind: 'smartFieldCard'; smartFieldId: string; label?: string }
  /** A larger baseline-vs-forecast bar chart for a smart field that has a comparison. */
  | { id: string; kind: 'chart'; smartFieldId: string; label?: string }
  /**
   * The Single-Use purchasing widget from the projections wizard: variant 'widget'
   * (default) is the real experience — item rows plus the stepped drawer picker;
   * variant 'simple' is the compact inline table. Rows land under the fixed key
   * 'singleUseProducts' (see WIDGET_INPUT_DEFS) so equations can SUM over them.
   */
  | { id: string; kind: 'singleUseItems'; label?: string; variant?: WidgetVariant }
  /** The Reusables purchasing widget — rows under 'reusableProducts'. */
  | { id: string; kind: 'reusableItems'; label?: string; variant?: WidgetVariant }
  /** The Dishwashing widget (the real page's "Add dishwasher" drawer) — rows under 'dishwashers'. */
  | { id: string; kind: 'dishwashers'; label?: string; variant?: WidgetVariant }
  /** The Additional-costs widget (labor / hauling / other expenses) — rows under 'additionalCosts'. */
  | { id: string; kind: 'additionalCosts'; label?: string; variant?: WidgetVariant }
  | { id: string; kind: 'button'; label: string; action: 'next' | 'back' | 'submit' }
);

/** 'widget' = the real project experience (rows + drawer); 'simple' = the inline table. */
export type WidgetVariant = 'simple' | 'widget';

/** The block kinds that are data-collecting widgets with fixed list keys. */
export const WIDGET_KINDS = ['singleUseItems', 'reusableItems', 'dishwashers', 'additionalCosts'] as const;
export type WidgetKind = (typeof WIDGET_KINDS)[number];
export const isWidgetKind = (kind: ComposedBlock['kind']): kind is WidgetKind =>
  (WIDGET_KINDS as readonly string[]).includes(kind);

/** Blocks compact enough to share a row; everything else is always full width. */
export const HALF_CAPABLE_KINDS: ComposedBlock['kind'][] = ['smartFieldCard', 'chart', 'inputField', 'text'];

export type ComposedScreen = { id: string; title: string; blocks: ComposedBlock[] };

/**
 * A column of a list-type question ("add each product you buy…").
 * `fillFrom` names the catalog column the product wizard copies into this one when the
 * names differ (e.g. unitsPerCase ← case_count); without it, matching is by name.
 */
export type GroupColumn = { key: string; label: string; type: 'number' | 'currency' | 'text'; fillFrom?: string };

/**
 * A question the product asks — key matches equation variables (spec §4).
 * type 'group' is a LIST: the user adds rows to a small table, and equations total them
 * with SUM(key, per-row math).
 */
export type InputFieldDef = {
  key: string;
  label: string;
  type: 'number' | 'currency' | 'group';
  unit?: string;
  help?: string;
  defaultValue?: number;
  /** Only for type 'group': the table's columns. */
  columns?: GroupColumn[];
  /**
   * Only for type 'group': the product wizard. When set, every row gets a product picker
   * fed by this database; choosing a product fills any matching columns of that row
   * (typing stays possible — the wizard is an option, not a replacement;
   * Derek, 2026-09-19).
   */
  productSource?: { databaseId?: string; databaseName?: string; nameColumnKey: string };
};

/**
 * The catalog rows a product picker offers. Keys are the database id, or
 * `name:<database name>` for name-addressed sources (catalogKey builds them) — the
 * built-in purchasing widgets address by NAME so they work in any environment.
 */
export type ProductCatalog = Record<string, { nameColumnKey: string; rows: Record<string, string | number | null>[] }>;

/** The catalog-map key for a product source: its id, or "name:<database name>". */
export function catalogKey(source: { databaseId?: string; databaseName?: string }): string | null {
  if (source.databaseId) return source.databaseId;
  if (source.databaseName) return `name:${source.databaseName}`;
  return null;
}

/**
 * The built-in purchasing widgets' question definitions (Derek, 2026-09-20: "add the
 * Single-Use Widget or Reusables Widget to a page in the flow"). Fixed keys so equations
 * can rely on them; columns mirror the projections wizard's line items, with catalog
 * auto-fill for units, weight and (for reusables) price.
 */
export const WIDGET_INPUT_DEFS: Record<WidgetKind, InputFieldDef> = {
  singleUseItems: {
    key: 'singleUseProducts',
    label: 'Single-use purchases',
    type: 'group',
    help: 'Add a row for each single-use product you buy. Pick from the catalog to fill in the details, or type them.',
    productSource: { databaseName: 'Single-Use Products', nameColumnKey: 'product' },
    columns: [
      { key: 'productName', label: 'Product name', type: 'text' },
      { key: 'casesPerYear', label: 'Cases / year', type: 'number' },
      { key: 'unitsPerCase', label: 'Units per case', type: 'number', fillFrom: 'case_count' },
      { key: 'caseCost', label: 'Cost per case', type: 'currency' },
      { key: 'itemWeightLbs', label: 'Item weight (lb)', type: 'number', fillFrom: 'item_weight_lbs' },
      { key: 'newCasesPerYear', label: 'Cases / year after switch', type: 'number' },
      { key: 'newCaseCost', label: 'Cost per case after switch', type: 'currency' }
    ]
  },
  reusableItems: {
    key: 'reusableProducts',
    label: 'Reusable purchases',
    type: 'group',
    help: 'Add a row for each reusable product you will buy. Pick from the catalog to fill in the details, or type them.',
    productSource: { databaseName: 'Reusable Products', nameColumnKey: 'product' },
    columns: [
      { key: 'productName', label: 'Product name', type: 'text' },
      { key: 'casesPurchased', label: 'Cases purchased', type: 'number' },
      { key: 'unitsPerCase', label: 'Units per case', type: 'number', fillFrom: 'case_count' },
      { key: 'caseCost', label: 'Cost per case', type: 'currency', fillFrom: 'case_price' },
      { key: 'repurchasePercent', label: 'Restocked yearly (%)', type: 'number' }
    ]
  },
  dishwashers: {
    key: 'dishwashers',
    label: 'Dishwashing',
    type: 'group',
    help: 'Add each dish machine the reuse program relies on.',
    productSource: { databaseName: 'Dishwasher Factors', nameColumnKey: 'machine_type' },
    columns: [
      { key: 'machineType', label: 'Dishwasher type', type: 'text' },
      { key: 'racksPerDay', label: 'Racks per day', type: 'number' },
      { key: 'operatingDays', label: 'Operating days / year', type: 'number' },
      { key: 'utilityCostPerRack', label: 'Utility cost per rack', type: 'currency' },
      { key: 'oneTimeCost', label: 'Purchase & install (one-time)', type: 'currency' }
    ]
  },
  additionalCosts: {
    key: 'additionalCosts',
    label: 'Additional costs',
    type: 'group',
    help: 'Labor, waste hauling, and other program expenses — or savings, entered as negative amounts.',
    columns: [
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'amountPerYear', label: 'Amount / year', type: 'currency' },
      { key: 'oneTimeAmount', label: 'One-time amount', type: 'currency' }
    ]
  }
};

export type ComposedDefinition = { screens: ComposedScreen[]; inputFields: InputFieldDef[] };

export type ComposedSmartField = {
  id: string;
  name: string;
  unit: string | null;
  description: string | null;
  equation: EquationToken[];
  /** Optional baseline-vs-forecast pair for the comparison chart. */
  comparison?: { baseline: EquationToken[]; forecast: EquationToken[] } | null;
};

export const BLOCK_LABELS: Record<ComposedBlock['kind'], string> = {
  heading: 'Heading',
  text: 'Rich text',
  inputField: 'Input field',
  questionGroup: 'Question group',
  smartFieldCard: 'Smart field card',
  chart: 'Chart',
  singleUseItems: 'Single-Use',
  reusableItems: 'Reusables',
  dishwashers: 'Dishwasher',
  additionalCosts: 'Additional Costs',
  button: 'Button'
};

/** Display name for a block, with the widget variant spelled out ("Single-Use (Widget)"). */
export function blockDisplayLabel(block: Pick<ComposedBlock, 'kind'> & { variant?: WidgetVariant }): string {
  const base = BLOCK_LABELS[block.kind];
  if (!isWidgetKind(block.kind)) return base;
  return `${base} (${block.variant === 'simple' ? 'Simple' : 'Widget'})`;
}

export const newBlockId = () => `b${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

/**
 * The dependency contract (spec §2/§6): what the placed smart fields require, versus what
 * the screens collect. A product publishes only when nothing is unsatisfied.
 */
export function analyzeDependencies(
  definition: ComposedDefinition,
  smartFields: ComposedSmartField[],
  variables: Map<string, SmartVariable>
) {
  const placedFieldIds = new Set(
    definition.screens
      .flatMap(s => s.blocks)
      .flatMap(b => (b.kind === 'smartFieldCard' || b.kind === 'chart' ? [b.smartFieldId] : []))
  );
  const collectedKeys = new Set(
    definition.screens
      .flatMap(s => s.blocks)
      .flatMap(b =>
        b.kind === 'inputField'
          ? [b.inputKey]
          : b.kind === 'questionGroup'
            ? b.inputKeys
            : // Widgets collect their fixed list keys, in either variant.
              isWidgetKind(b.kind)
              ? [WIDGET_INPUT_DEFS[b.kind].key]
              : []
      )
  );

  const requiredInputs = new Map<
    string,
    { label: string; collected: boolean; isGroup?: boolean; columns?: string[] }
  >();
  const requiredFactors: { key: string; label: string; met: boolean }[] = [];
  const missing: string[] = [];

  for (const field of smartFields) {
    if (!placedFieldIds.has(field.id)) continue;
    // A comparison's two equations have needs of their own — the chart must not publish
    // with a baseline nobody collects.
    const allTokens = [...field.equation, ...(field.comparison?.baseline ?? []), ...(field.comparison?.forecast ?? [])];
    for (const req of detectRequirements(allTokens, variables)) {
      if (req.kind === 'input' || req.kind === 'intermediate') {
        if (!requiredInputs.has(req.key))
          requiredInputs.set(req.key, { label: req.label, collected: collectedKeys.has(req.key) });
      } else if (req.kind === 'group') {
        // A SUM needs a LIST question; the equation tells us which columns each row needs.
        if (!requiredInputs.has(req.key))
          requiredInputs.set(req.key, {
            label: req.label,
            collected: collectedKeys.has(req.key),
            isGroup: true,
            columns: req.columns
          });
      } else if (req.kind === 'factor') {
        if (!requiredFactors.some(f => f.key === req.key)) requiredFactors.push(req);
      } else if (req.kind === 'missing') {
        // An equation key with no catalog entry is still satisfiable as a product input.
        if (!requiredInputs.has(req.key))
          requiredInputs.set(req.key, { label: req.key, collected: collectedKeys.has(req.key) });
      }
    }
  }

  const inputs = Array.from(requiredInputs.entries()).map(([key, v]) => ({ key, ...v }));
  return {
    inputs,
    factors: requiredFactors,
    missing,
    uncollected: inputs.filter(i => !i.collected),
    /** Inputs a screen collects that no placed field uses — harmless, worth showing. */
    unusedInputs: Array.from(collectedKeys).filter(k => !requiredInputs.has(k))
  };
}
