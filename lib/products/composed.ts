/**
 * Composed products — the Product Studio thin slice (docs/CR2-PRODUCT-STUDIO-SPEC.md).
 * A composed product is screens of blocks over input-field definitions and published
 * smart fields; ONE renderer serves the builder preview and the live product, so
 * preview is never a lie.
 */
import type { EquationToken, SmartVariable } from 'lib/smartFields/variables';
import { detectRequirements } from 'lib/smartFields/variables';

export type ComposedBlock =
  | { id: string; kind: 'heading'; text: string }
  | { id: string; kind: 'text'; text: string }
  | { id: string; kind: 'inputField'; inputKey: string }
  /** Several questions presented together under one small title. */
  | { id: string; kind: 'questionGroup'; title?: string; inputKeys: string[] }
  | { id: string; kind: 'smartFieldCard'; smartFieldId: string; label?: string }
  /** A larger baseline-vs-forecast bar chart for a smart field that has a comparison. */
  | { id: string; kind: 'chart'; smartFieldId: string; label?: string }
  | { id: string; kind: 'button'; label: string; action: 'next' | 'back' | 'submit' };

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
  productSource?: { databaseId: string; nameColumnKey: string };
};

/** The catalog rows a product picker offers, keyed by database id. */
export type ProductCatalog = Record<string, { nameColumnKey: string; rows: Record<string, string | number | null>[] }>;

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
  button: 'Button'
};

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
      .flatMap(b => (b.kind === 'inputField' ? [b.inputKey] : b.kind === 'questionGroup' ? b.inputKeys : []))
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
