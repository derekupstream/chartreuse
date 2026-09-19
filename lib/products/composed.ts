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
  | { id: string; kind: 'smartFieldCard'; smartFieldId: string; label?: string }
  | { id: string; kind: 'button'; label: string; action: 'next' | 'back' | 'submit' };

export type ComposedScreen = { id: string; title: string; blocks: ComposedBlock[] };

/** A question the product asks — key matches equation variables (spec §4). */
export type InputFieldDef = {
  key: string;
  label: string;
  type: 'number' | 'currency';
  unit?: string;
  help?: string;
  defaultValue?: number;
};

export type ComposedDefinition = { screens: ComposedScreen[]; inputFields: InputFieldDef[] };

export type ComposedSmartField = {
  id: string;
  name: string;
  unit: string | null;
  description: string | null;
  equation: EquationToken[];
};

export const BLOCK_LABELS: Record<ComposedBlock['kind'], string> = {
  heading: 'Heading',
  text: 'Text',
  inputField: 'Input field',
  smartFieldCard: 'Smart field card',
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
    definition.screens.flatMap(s => s.blocks).flatMap(b => (b.kind === 'smartFieldCard' ? [b.smartFieldId] : []))
  );
  const collectedKeys = new Set(
    definition.screens.flatMap(s => s.blocks).flatMap(b => (b.kind === 'inputField' ? [b.inputKey] : []))
  );

  const requiredInputs = new Map<string, { label: string; collected: boolean }>();
  const requiredFactors: { key: string; label: string; met: boolean }[] = [];
  const missing: string[] = [];

  for (const field of smartFields) {
    if (!placedFieldIds.has(field.id)) continue;
    for (const req of detectRequirements(field.equation, variables)) {
      if (req.kind === 'input' || req.kind === 'intermediate') {
        if (!requiredInputs.has(req.key))
          requiredInputs.set(req.key, { label: req.label, collected: collectedKeys.has(req.key) });
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
