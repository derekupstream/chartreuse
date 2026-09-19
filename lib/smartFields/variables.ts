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
  | { kind: 'paren'; value: '(' | ')' }
  /**
   * "Do this math FOR EACH ROW of a list the user filled in, then total the rows."
   * Example: SUM(products, cases * unitsPerCase) — `products` is a list-type input
   * (a small table the user adds rows to); inside the body, a name resolves first to a
   * COLUMN of the current row, then to ordinary inputs/factors. This is how the model's
   * real shape ("for each product line: …, then sum") becomes expressible (spec §4).
   */
  | { kind: 'aggregate'; fn: 'SUM'; group: string; body: EquationToken[] };

/** One row of a list-type input: column key → what the user typed. */
export type GroupRow = Record<string, number | string>;
/** Everything a user has answered: plain numbers, or arrays of rows for list inputs. */
export type FieldValues = Record<string, number | GroupRow[]>;

export type Requirement = {
  kind: 'input' | 'factor' | 'product' | 'intermediate' | 'missing' | 'group';
  key: string;
  label: string;
  /** True when this is satisfied */
  met: boolean;
  /** For kind 'group': column names the equation reads from each row (inferred). */
  columns?: string[];
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
  { key: 'guestCount', label: 'Guests or customers', category: 'Inputs', unit: 'people' },
  {
    key: 'annualNetSavings',
    label: 'Annual net savings',
    category: 'Inputs',
    unit: '$',
    description: 'Net annual saving after all recurring costs'
  },
  {
    key: 'oneTimeCosts',
    label: 'One-time start-up costs',
    category: 'Inputs',
    unit: '$',
    description: 'Reusables, equipment and installation'
  },
  {
    key: 'fundingAmount',
    label: 'Funding amount',
    category: 'Inputs',
    unit: '$',
    description: 'A grant, rebate or incentive amount (applied per occurrence)'
  },
  {
    key: 'fundingTimesPerYear',
    label: 'Funding occurrences per year',
    category: 'Inputs',
    unit: 'times/yr',
    description: '1 for one-time or annual; 12 for monthly'
  },
  {
    key: 'reusablePurchaseCost',
    label: 'Reusable products purchase cost',
    category: 'Inputs',
    unit: '$',
    description: 'One-time cost of the reusable cups, containers or dishes'
  },
  {
    key: 'equipmentCost',
    label: 'Equipment cost',
    category: 'Inputs',
    unit: '$',
    description: 'One-time cost of dishwashers, racks and collection bins'
  },
  {
    key: 'installationCost',
    label: 'Installation cost',
    category: 'Inputs',
    unit: '$',
    description: 'One-time plumbing, electrical and setup work'
  },
  {
    key: 'laborCostAnnual',
    label: 'Annual labor cost',
    category: 'Inputs',
    unit: '$',
    description: 'Yearly staff time for washing, collecting and restocking'
  },
  {
    key: 'otherRecurringCosts',
    label: 'Other recurring costs',
    category: 'Inputs',
    unit: '$',
    description: 'Any other yearly program expense (supplies, service contracts…)'
  }
];

/**
 * Quantities the engine derives, usable as building blocks. The baseline/forecast pairs
 * mirror the projections dashboard's decomposition (single-use today vs the reuse
 * program), so dashboard metrics like "Annual GHG changes" are expressible as
 * baseline − forecast — exactly the shape the comparison chart draws.
 */
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
  { key: 'annualCost', label: 'Annual purchasing cost', category: 'Intermediates', unit: '$' },
  // GHG (lineage: environmentalResults.annualGasEmissionChanges — materials + shipping boxes)
  {
    key: 'baselineMaterialGas',
    label: 'Baseline material emissions',
    category: 'Intermediates',
    unit: 'MTCO2e',
    description: 'Emissions from the single-use materials bought today'
  },
  {
    key: 'baselineShippingGas',
    label: 'Baseline shipping-box emissions',
    category: 'Intermediates',
    unit: 'MTCO2e',
    description: 'Emissions from the cardboard boxes those cases ship in'
  },
  {
    key: 'forecastMaterialGas',
    label: 'Forecast material emissions',
    category: 'Intermediates',
    unit: 'MTCO2e',
    description: 'Material emissions remaining after the switch to reusables'
  },
  {
    key: 'forecastShippingGas',
    label: 'Forecast shipping-box emissions',
    category: 'Intermediates',
    unit: 'MTCO2e',
    description: 'Shipping-box emissions remaining after the switch'
  },
  // Water (lineage: environmentalResults.annualWaterUsageChanges — manufacturing vs dishwashing)
  {
    key: 'baselineWaterUse',
    label: 'Baseline water use',
    category: 'Intermediates',
    unit: 'gal',
    description: 'Water used to manufacture the single-use items bought today'
  },
  {
    key: 'forecastWaterUse',
    label: 'Forecast water use',
    category: 'Intermediates',
    unit: 'gal',
    description: 'Water used after the switch (mostly dishwashing)'
  },
  // Waste (lineage: environmentalResults.annualWasteChanges)
  {
    key: 'baselineWasteWeight',
    label: 'Baseline waste to landfill',
    category: 'Intermediates',
    unit: 'lb',
    description: 'Single-use items and boxes sent to landfill today'
  },
  {
    key: 'forecastWasteWeight',
    label: 'Forecast waste to landfill',
    category: 'Intermediates',
    unit: 'lb',
    description: 'Waste remaining after the switch (breakage, unreturned items)'
  },
  // Cost (lineage: financialResults / annualSummary)
  {
    key: 'baselineAnnualCost',
    label: 'Baseline annual cost',
    category: 'Intermediates',
    unit: '$',
    description: 'What the operation spends per year staying with single-use'
  },
  {
    key: 'forecastAnnualCost',
    label: 'Forecast annual cost',
    category: 'Intermediates',
    unit: '$',
    description: 'What the reuse program costs per year once running'
  },
  {
    key: 'baselineHaulingCost',
    label: 'Baseline waste-hauling cost',
    category: 'Intermediates',
    unit: '$',
    description: 'Hauling paid today for the single-use waste stream'
  },
  {
    key: 'forecastHaulingCost',
    label: 'Forecast waste-hauling cost',
    category: 'Intermediates',
    unit: '$',
    description: 'Hauling remaining after the switch'
  },
  {
    key: 'utilityCostPerRack',
    label: 'Utility cost per dishwasher rack',
    category: 'Intermediates',
    unit: '$/rack',
    description: 'Water + energy cost of washing one rack (from the dishwasher and utility-rate tables)'
  }
];

/** Evaluates an equation, returning the value or the reason it can't be computed. */
export function evaluateEquation(
  tokens: EquationToken[],
  variables: Map<string, SmartVariable>,
  testInputs: FieldValues = {},
  /** Column values of the current row, while evaluating inside a SUM. */
  rowScope?: GroupRow
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
    } else if (token.kind === 'aggregate') {
      // "For each row of the list, compute the body; then add the rows together."
      const rows = testInputs[token.group];
      if (!Array.isArray(rows) || rows.length === 0) {
        return { value: null, error: `The list “${token.group}” has no rows yet`, expression: readable.join(' ') };
      }
      let total = 0;
      for (const row of rows) {
        const rowResult = evaluateEquation(token.body, variables, testInputs, row);
        if (rowResult.value === null) {
          return { value: null, error: rowResult.error, expression: readable.join(' ') };
        }
        total += rowResult.value;
      }
      parts.push(String(total));
      readable.push(`SUM(${token.group})=${total}`);
    } else {
      // A name resolves in this order: the current row's column (inside a SUM), then the
      // user's answers, then the variable catalog (factors and other known values).
      const fromRow = rowScope?.[token.key];
      const supplied = testInputs[token.key];
      const variable = variables.get(token.key);
      const value = fromRow !== undefined ? Number(fromRow) : typeof supplied === 'number' ? supplied : variable?.value;
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
  testInputs: FieldValues = {}
): Requirement[] {
  const requirements: Requirement[] = [];
  const seen = new Set<string>();

  const walk = (list: EquationToken[], insideGroupColumns?: Set<string>) => {
    for (const token of list) {
      if (token.kind === 'aggregate') {
        if (!seen.has(token.group)) {
          seen.add(token.group);
          // Column names mirror the EVALUATOR's resolution order (row first): inside a SUM,
          // an identifier is a row column unless it is a catalog variable that already
          // carries a value (a factor). A catalog INPUT with the same name must not shadow
          // a column — found 2026-09-19 when "unitsPerCase" (also a known input) wrongly
          // blocked publishing as "uncollected".
          const columns = new Set<string>();
          for (const inner of token.body) {
            if (inner.kind !== 'variable') continue;
            const catalogValue = variables.get(inner.key)?.value;
            if (catalogValue === undefined || !Number.isFinite(catalogValue)) columns.add(inner.key);
          }
          const rows = testInputs[token.group];
          requirements.push({
            kind: 'group',
            key: token.group,
            label: token.group,
            met: Array.isArray(rows) && rows.length > 0,
            columns: Array.from(columns)
          });
          walk(token.body, columns);
        }
        continue;
      }
      if (token.kind !== 'variable' || seen.has(token.key)) continue;
      // Inside a SUM, a name that is a row column is satisfied by the list itself.
      if (insideGroupColumns?.has(token.key)) continue;
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
      } else if (variable.category === 'Intermediates') {
        // Derived by the calculator upstream of this field, so it needs a test value here
        // to preview — it is not a missing factor.
        requirements.push({
          kind: 'intermediate',
          key: token.key,
          label: variable.label,
          met: testInputs[token.key] !== undefined
        });
      } else if (variable.category === 'Products') {
        // A product column only has a value once a specific product is chosen on the
        // calculator — that is a pending selection, not a missing factor.
        requirements.push({
          kind: 'product',
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
  };

  walk(tokens);
  return requirements;
}
