/**
 * Variable model for the Adalo-style data product designer.
 * Stored under `DataProductDefinition.flowDefinitionJson.variables`.
 */

export type VariableKind = 'user_input' | 'calculation' | 'constant';

export type UserInputWidget = 'text' | 'number' | 'slider';

/**
 * Tokens that make up a formula. Either a reference to another variable,
 * or a raw text chunk holding numbers / operators / function names /
 * parens / whitespace. Order matters.
 */
export type FormulaToken = { type: 'var'; id: string; name: string } | { type: 'text'; value: string };

export type UserInputConfig = {
  widget: UserInputWidget;
  defaultValue?: string | number;
  unit?: string;
  // slider-only
  min?: number;
  max?: number;
  step?: number;
};

export type CalculationConfig = {
  formula: FormulaToken[];
  // raw string fallback for Phase 1 before the pill editor lands
  formulaText?: string;
  unit?: string;
};

export type ConstantSource = 'literal' | 'factor' | 'single_use_product' | 'reusable_product';

export type ConstantConfig = {
  source: ConstantSource;
  // literal-source
  literalValue?: number;
  literalUnit?: string;
  // factor-source
  factorId?: string;
  // catalog-source (single_use_product | reusable_product)
  productId?: string;
  productField?: string; // e.g. 'itemWeight'
};

export type Variable = {
  id: string;
  name: string;
  description?: string;
  kind: VariableKind;
  // ReactFlow x/y position if placed on the canvas; null if sidebar-only
  position?: { x: number; y: number };
  userInput?: UserInputConfig;
  calculation?: CalculationConfig;
  constant?: ConstantConfig;
};

export const VARIABLE_COLORS: Record<VariableKind, { bg: string; border: string; chip: string }> = {
  user_input: { bg: '#f6ffed', border: '#52c41a', chip: '#52c41a' },
  calculation: { bg: '#fff7e6', border: '#fa8c16', chip: '#fa8c16' },
  constant: { bg: '#e6f4ff', border: '#1677ff', chip: '#1677ff' }
};

export const VARIABLE_KIND_LABEL: Record<VariableKind, string> = {
  user_input: 'User Input',
  calculation: 'Calculation',
  constant: 'Constant'
};

export function newVariableId(): string {
  return `var_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Validate that a name is a usable identifier in formulas (no spaces, starts with letter). */
export function isValidVariableName(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(name);
}
