/**
 * The console half of the Field Builder's Visual | Console split view: a smart-field
 * equation as editable text, round-tripping losslessly with the pill editor
 * (docs/CR2-PRODUCT-STUDIO-SPEC.md §3).
 *
 * Grammar (deliberately tiny — exactly what EquationToken can express):
 *   expression := term (('+'|'-'|'*'|'/') term)*
 *   term       := number | identifier | '(' expression ')'
 *   identifier := [A-Za-z_][A-Za-z0-9_]*     — a variable key from the catalog, or a NEW
 *                                              input key (free identifiers are how the
 *                                              console introduces user inputs)
 */
import type { EquationToken } from './variables';

/** Equation tokens → console text. */
export function serializeEquation(tokens: EquationToken[]): string {
  const parts: string[] = [];
  for (const token of tokens) {
    if (token.kind === 'number') parts.push(String(token.value));
    else if (token.kind === 'variable') parts.push(token.key);
    else parts.push(token.value);
  }
  // No space after "(" or before ")" — reads like math, still splits cleanly.
  return parts.join(' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
}

export type ParseResult = { ok: true; tokens: EquationToken[] } | { ok: false; error: string };

/** Console text → equation tokens, with a human error when it can't be. */
export function parseEquation(text: string): ParseResult {
  const tokens: EquationToken[] = [];
  let i = 0;
  const s = text.trim();
  if (!s) return { ok: true, tokens: [] };

  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i += 1;
    } else if (ch === '(' || ch === ')') {
      tokens.push({ kind: 'paren', value: ch });
      i += 1;
    } else if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ kind: 'operator', value: ch });
      i += 1;
    } else if (/[0-9.]/.test(ch)) {
      const match = /^[0-9]*\.?[0-9]+/.exec(s.slice(i));
      if (!match) return { ok: false, error: `Not a number at position ${i + 1}: “${s.slice(i, i + 8)}…”` };
      tokens.push({ kind: 'number', value: Number(match[0]) });
      i += match[0].length;
    } else if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i))!;
      tokens.push({ kind: 'variable', key: match[0] });
      i += match[0].length;
    } else {
      return {
        ok: false,
        error: `“${ch}” isn't part of an equation — use variables, numbers, + - * / and parentheses`
      };
    }
  }

  const structure = validateStructure(tokens);
  if (structure) return { ok: false, error: structure };
  return { ok: true, tokens };
}

/** Cheap structural checks so obviously-broken text gets a message, not a silent bad save. */
function validateStructure(tokens: EquationToken[]): string | null {
  let depth = 0;
  let previous: EquationToken | null = null;
  for (const token of tokens) {
    if (token.kind === 'paren') depth += token.value === '(' ? 1 : -1;
    if (depth < 0) return 'A “)” closes nothing';
    if (
      token.kind === 'operator' &&
      (!previous || previous.kind === 'operator' || (previous.kind === 'paren' && previous.value === '('))
    ) {
      return `“${token.value}” needs a value before it`;
    }
    if (
      (token.kind === 'number' || token.kind === 'variable') &&
      previous &&
      (previous.kind === 'number' ||
        previous.kind === 'variable' ||
        (previous.kind === 'paren' && previous.value === ')'))
    ) {
      return 'Two values in a row — put an operator between them';
    }
    previous = token;
  }
  if (depth > 0) return 'A “(” is never closed';
  if (previous && previous.kind === 'operator') return `The equation ends on “${previous.value}”`;
  return null;
}
