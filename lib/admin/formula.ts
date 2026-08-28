/**
 * Cell formulas with dynamic variable references.
 *
 * A cell whose text starts with "=" is a formula. Variables are written as
 * `@{Database.column:rowkey}` — a reference to one value in one row of one database,
 * inserted from the @ autocomplete in the spreadsheet's edit field. The stored cell keeps
 * BOTH the evaluated number (so every consumer — the 2.0 engine included — reads a plain
 * value) and the formula (under __formulas), and formulas are re-evaluated whenever
 * database data changes, so a referenced value updates everything computed from it.
 *
 * Evaluation is deliberately tiny: numbers, + - * / ( ) and variables. Nothing else
 * reaches the evaluator — the substituted expression is validated character-by-character,
 * so cell contents can never execute code.
 */

export const FORMULAS_KEY = '__formulas';

export type FormulaToken = {
  /** Verbatim token text including the @{…} wrapper */
  raw: string;
  database: string;
  column: string;
  /** Normalized key of the referenced row (composite parts joined by "|") */
  rowKey: string;
};

export type ResolveVariable = (token: FormulaToken) => number | null;

const TOKEN_PATTERN = /@\{([^.{}]+)\.([^:{}]+):([^{}]*)\}/g;

export const isFormula = (value: unknown): value is string => typeof value === 'string' && value.trim().startsWith('=');

export function parseTokens(formula: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  for (const match of Array.from(formula.matchAll(TOKEN_PATTERN))) {
    tokens.push({ raw: match[0], database: match[1], column: match[2], rowKey: match[3] });
  }
  return tokens;
}

export const normalizeRowKeyPart = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase();

/** The same row-key normalization the merge/diff machinery uses (composite keys join on |). */
export function rowMatchKey(row: Record<string, unknown>, keyColumn: string): string {
  const parts = keyColumn.split(',').map(c => normalizeRowKeyPart(row[c.trim()]));
  return parts.every(p => p === '') ? '' : parts.join('|');
}

export type EvaluationResult = { ok: true; value: number } | { ok: false; error: string };

/**
 * Evaluates "= 12 * @{GHG Factors.ghg_factor_mtco2e_per_lb:single-use|paper}" to a number.
 * Unresolvable variables and any character outside plain arithmetic are hard errors.
 */
export function evaluateFormula(formula: string, resolve: ResolveVariable): EvaluationResult {
  let expression = formula.trim().replace(/^=/, '');
  for (const token of parseTokens(formula)) {
    const value = resolve(token);
    if (value === null || !Number.isFinite(value)) {
      return { ok: false, error: `Could not resolve @${token.column} (${token.database} · ${token.rowKey})` };
    }
    expression = expression.split(token.raw).join(`(${value})`);
  }
  if (!/^[\d+\-*/().\s]*$/.test(expression) || expression.trim() === '') {
    return { ok: false, error: 'Formulas support numbers, + - * / and parentheses' };
  }
  try {
    // Safe by construction: the expression was just validated to contain only arithmetic.
    const value = new Function(`"use strict"; return (${expression});`)() as number;
    if (!Number.isFinite(value)) return { ok: false, error: 'Formula did not produce a finite number' };
    return { ok: true, value };
  } catch {
    return { ok: false, error: 'Formula could not be evaluated — check the arithmetic' };
  }
}

/** A resolver over in-memory tables: { databaseName: { keyColumn, rows } }. */
export function makeTableResolver(
  tables: Map<string, { keyColumn: string; rows: Record<string, unknown>[] }>
): ResolveVariable {
  return token => {
    const table = tables.get(token.database);
    if (!table) return null;
    const row = table.rows.find(r => rowMatchKey(r, table.keyColumn) === token.rowKey);
    if (!row) return null;
    const value = Number(row[token.column]);
    return Number.isFinite(value) ? value : null;
  };
}

/** Reads the formulas map stored on a row, if any. */
export function rowFormulas(row: Record<string, unknown>): Record<string, string> {
  const formulas = row[FORMULAS_KEY];
  return formulas && typeof formulas === 'object' ? (formulas as Record<string, string>) : {};
}
