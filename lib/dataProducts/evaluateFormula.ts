import type { FormulaToken, Variable } from 'lib/dataProducts/variables';

export type EvaluationContext = {
  /** Resolves a constant variable's effective numeric value */
  resolveConstant: (v: Variable) => number | undefined;
  /** Current user input values keyed by variable id; falls back to defaults */
  inputValues: Record<string, number | undefined>;
};

export type EvaluationResult =
  | { ok: true; value: number; formula: string }
  | { ok: false; error: string; formula?: string };

/**
 * Flatten a formula token list into an Excel-style expression string with
 * variable references substituted by their concrete numeric values.
 * Returns null if any referenced variable can't be resolved.
 */
function buildExpression(
  tokens: FormulaToken[],
  variables: Variable[],
  ctx: EvaluationContext,
  visiting: Set<string> = new Set()
): { ok: true; expr: string } | { ok: false; error: string } {
  const parts: string[] = [];
  for (const t of tokens) {
    if (t.type === 'text') {
      parts.push(t.value);
      continue;
    }
    if (visiting.has(t.id)) {
      return { ok: false, error: `Circular reference to ${t.name}` };
    }
    const v = variables.find(x => x.id === t.id);
    if (!v) return { ok: false, error: `Unknown variable: ${t.name}` };
    const resolved = resolveVariable(v, variables, ctx, new Set(visiting).add(t.id));
    if (!resolved.ok) return resolved;
    parts.push(`(${resolved.value})`);
  }
  return { ok: true, expr: parts.join('') };
}

function resolveVariable(
  v: Variable,
  allVars: Variable[],
  ctx: EvaluationContext,
  visiting: Set<string>
): { ok: true; value: number } | { ok: false; error: string } {
  if (v.kind === 'user_input') {
    const supplied = ctx.inputValues[v.id];
    if (supplied !== undefined && supplied !== null && !Number.isNaN(supplied)) {
      return { ok: true, value: supplied };
    }
    const def = v.userInput?.defaultValue;
    if (typeof def === 'number') return { ok: true, value: def };
    if (typeof def === 'string') {
      const n = Number(def);
      if (!Number.isNaN(n)) return { ok: true, value: n };
    }
    return { ok: false, error: `No value for input "${v.name}"` };
  }
  if (v.kind === 'constant') {
    const value = ctx.resolveConstant(v);
    if (value === undefined || Number.isNaN(value)) {
      return { ok: false, error: `Constant "${v.name}" has no value` };
    }
    return { ok: true, value };
  }
  // calculation
  const tokens = v.calculation?.formula ?? [];
  if (tokens.length === 0) return { ok: false, error: `"${v.name}" has no formula` };
  const built = buildExpression(tokens, allVars, ctx, visiting);
  if (!built.ok) return built;
  return evaluateExpression(built.expr);
}

/** Evaluate an Excel-style expression string with HyperFormula. Lazy-loaded. */
async function evaluateWithHyperFormula(
  expr: string
): Promise<{ ok: true; value: number } | { ok: false; error: string }> {
  const trimmed = expr.trim();
  if (!trimmed) return { ok: false, error: 'Empty formula' };
  try {
    const { HyperFormula } = await import('hyperformula');
    const hf = HyperFormula.buildFromArray([[`=${trimmed}`]], { licenseKey: 'gpl-v3' });
    const cell = hf.getCellValue({ sheet: 0, col: 0, row: 0 });
    hf.destroy();
    if (cell && typeof cell === 'object' && 'type' in cell) {
      return { ok: false, error: `Formula error: ${(cell as { type: string }).type}` };
    }
    if (typeof cell === 'number' && !Number.isNaN(cell)) {
      return { ok: true, value: cell };
    }
    return { ok: false, error: 'Formula did not produce a number' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to evaluate formula' };
  }
}

/** Synchronous best-effort evaluation using Function() for simple math.
 *  Used to keep the canvas preview snappy without a HyperFormula round-trip.
 *  Falls back to error if the expression uses anything beyond `+ - * / ( )`
 *  digits, decimal points, whitespace.
 */
function evaluateExpression(expr: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = expr.trim();
  if (!trimmed) return { ok: false, error: 'Empty formula' };
  if (!/^[\d+\-*/().\s,eE]+$/.test(trimmed)) {
    return { ok: false, error: 'Use the "Evaluate" button for Excel functions' };
  }
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${trimmed});`)();
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return { ok: false, error: 'Formula did not produce a number' };
    }
    return { ok: true, value };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to evaluate' };
  }
}

/**
 * Evaluate a single calculation variable. Returns the numeric value
 * and the substituted formula string for display.
 * Uses fast synchronous eval when possible; falls back to HyperFormula for
 * anything involving named functions (IF, SUM, etc.).
 */
export async function evaluateCalculation(
  calcVar: Variable,
  variables: Variable[],
  ctx: EvaluationContext
): Promise<EvaluationResult> {
  if (calcVar.kind !== 'calculation') {
    return { ok: false, error: 'Variable is not a calculation' };
  }
  const tokens = calcVar.calculation?.formula ?? [];
  if (tokens.length === 0) return { ok: false, error: 'No formula yet' };

  const built = buildExpression(tokens, variables, ctx, new Set([calcVar.id]));
  if (!built.ok) return { ok: false, error: built.error };

  const fast = evaluateExpression(built.expr);
  if (fast.ok) return { ok: true, value: fast.value, formula: built.expr };

  // Fall back to HyperFormula for Excel function support
  const hf = await evaluateWithHyperFormula(built.expr);
  if (hf.ok) return { ok: true, value: hf.value, formula: built.expr };
  return { ok: false, error: hf.error, formula: built.expr };
}
