/**
 * The variable catalog a smart field is built from, and the logic that turns an
 * equation into a value plus a list of what it still needs.
 *
 * A variable is one of:
 *   factor  — a number from an uploaded database, traceable to a table, row and cell
 *   input   — something a user has to enter on a calculator
 *   product — a value read from a product catalog row
 *   output  — another smart field's result
 *
 * The point of the `source` block is that any variable in an equation can be traced
 * back to exactly where its number came from.
 */

export type VariableCategory = 'Inputs' | 'Factors' | 'Products' | 'Intermediates' | 'Outputs';

export type VariableSource = {
  /** Which database supplied it */
  database: string;
  /** The table or sheet within that database */
  table: string;
  /** Spreadsheet-style cell reference, e.g. "C11" */
  cell: string;
  /** Row index (0-based) and column key, for opening the exact row */
  rowIndex: number;
  columnKey: string;
  version: string;
  databaseId: string;
};

export type SmartVariable = {
  /** Identifier used inside an equation */
  key: string;
  label: string;
  category: VariableCategory;
  unit?: string;
  /** Resolved value, when there is one. Inputs have no value until the user supplies it. */
  value?: number;
  description?: string;
  source?: VariableSource;
};

/** Equation tokens — deliberately simple so the builder stays legible. */
export type EquationToken =
  | { kind: 'variable'; key: string }
  | { kind: 'number'; value: number }
  | { kind: 'operator'; value: '+' | '-' | '*' | '/' }
  | { kind: 'paren'; value: '(' | ')' };

export type Requirement = {
  kind: 'input' | 'factor' | 'missing';
  key: string;
  label: string;
  /** True when this is satisfied */
  met: boolean;
};

/** A1-style reference from a zero-based row and column index. Data starts at row 2. */
export function cellRef(columnIndex: number, rowIndex: number): string {
  let letters = '';
  let n = columnIndex;
  do {
    letters = String.fromCharCode(65 + (n % 26)) + letters;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `${letters}${rowIndex + 2}`;
}

/** Turns a free-text name into a stable camelCase variable key. */
export function toVariableKey(name: string): string {
  const parts = name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ');
  if (!parts.length) return 'variable';
  return parts
    .map((p, i) => (i === 0 ? p.charAt(0).toLowerCase() + p.slice(1) : p.charAt(0).toUpperCase() + p.slice(1)))
    .join('');
}

/** Inputs a calculator can ask a user for. These have no value until entered. */
export const KNOWN_INPUTS: SmartVariable[] = [
  {
    key: 'casesPurchased',
    label: 'Cases purchased',
    category: 'Inputs',
    unit: 'cases',
    description: 'How many cases the operation buys'
  },
  {
    key: 'unitsPerCase',
    label: 'Units per case',
    category: 'Inputs',
    unit: 'units',
    description: 'How many items are in a case'
  },
  { key: 'caseCost', label: 'Cost per case', category: 'Inputs', unit: '$', description: 'Wholesale cost of one case' },
  {
    key: 'forecastCases',
    label: 'Forecast cases',
    category: 'Inputs',
    unit: 'cases',
    description: 'Cases still purchased after switching'
  },
  {
    key: 'returnRate',
    label: 'Return rate',
    category: 'Inputs',
    unit: '%',
    description: 'Share of reusables customers bring back'
  },
  { key: 'racksPerDay', label: 'Dishwasher racks per day', category: 'Inputs', unit: 'racks/day' },
  { key: 'operatingDays', label: 'Operating days per year', category: 'Inputs', unit: 'days' },
  { key: 'guestCount', label: 'Guests or customers', category: 'Inputs', unit: 'people' }
];

/** Quantities the engine derives, usable as building blocks. */
export const KNOWN_INTERMEDIATES: SmartVariable[] = [
  {
    key: 'annualItems',
    label: 'Annual items',
    category: 'Intermediates',
    unit: 'items',
    description: 'cases × units per case × times per year'
  },
  { key: 'annualMaterialWeight', label: 'Annual material weight', category: 'Intermediates', unit: 'lb' },
  { key: 'annualBoxWeight', label: 'Annual shipping box weight', category: 'Intermediates', unit: 'lb' },
  { key: 'annualCost', label: 'Annual purchasing cost', category: 'Intermediates', unit: '$' }
];

/** Evaluates an equation, returning the value or the reason it can't be computed. */
export function evaluateEquation(
  tokens: EquationToken[],
  variables: Map<string, SmartVariable>,
  testInputs: Record<string, number> = {}
): { value: number | null; error?: string; expression: string } {
  if (!tokens.length) return { value: null, error: 'The equation is empty', expression: '' };

  const parts: string[] = [];
  const readable: string[] = [];

  for (const token of tokens) {
    if (token.kind === 'number') {
      parts.push(String(token.value));
      readable.push(String(token.value));
    } else if (token.kind === 'operator' || token.kind === 'paren') {
      parts.push(token.value);
      readable.push(token.value);
    } else {
      const variable = variables.get(token.key);
      const supplied = testInputs[token.key];
      const value = supplied !== undefined ? supplied : variable?.value;
      if (value === undefined || value === null || !Number.isFinite(value)) {
        return {
          value: null,
          error: `${variable?.label ?? token.key} has no value yet`,
          expression: readable.join(' ')
        };
      }
      parts.push(String(value));
      readable.push(String(value));
    }
  }

  const expression = parts.join(' ');
  if (!/^[0-9+\-*/(). ]+$/.test(expression)) {
    return { value: null, error: 'The equation contains something that cannot be evaluated', expression };
  }

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expression});`)();
    if (!Number.isFinite(result))
      return { value: null, error: 'The equation does not resolve to a number', expression };
    return { value: result, expression: readable.join(' ') };
  } catch {
    return { value: null, error: 'The equation is not complete', expression: readable.join(' ') };
  }
}

/**
 * Reports what a smart field still needs: which user inputs a calculator must collect,
 * which factors it depends on, and any variable that no longer resolves to anything.
 */
export function detectRequirements(
  tokens: EquationToken[],
  variables: Map<string, SmartVariable>,
  testInputs: Record<string, number> = {}
): Requirement[] {
  const requirements: Requirement[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    if (token.kind !== 'variable' || seen.has(token.key)) continue;
    seen.add(token.key);

    const variable = variables.get(token.key);
    if (!variable) {
      requirements.push({ kind: 'missing', key: token.key, label: token.key, met: false });
      continue;
    }
    if (variable.category === 'Inputs') {
      requirements.push({
        kind: 'input',
        key: token.key,
        label: variable.label,
        met: testInputs[token.key] !== undefined
      });
    } else {
      const resolved = variable.value !== undefined && Number.isFinite(variable.value);
      requirements.push({
        kind: resolved ? 'factor' : 'missing',
        key: token.key,
        label: variable.label,
        met: resolved
      });
    }
  }

  return requirements;
}
