/**
 * The console half of the Field Builder's Visual | Console split view: a smart-field
 * equation as editable text, round-tripping losslessly with the pill editor
 * (docs/CR2-PRODUCT-STUDIO-SPEC.md §3).
 *
 * Grammar (deliberately tiny — exactly what EquationToken can express):
 *   expression := term (('+'|'-'|'*'|'/') term)*
 *   term       := number | identifier | '(' expression ')' | aggregate
 *   aggregate  := 'SUM' '(' identifier ',' expression ')'
 *   identifier := [A-Za-z_][A-Za-z0-9_]*     — a variable key from the catalog, or a NEW
 *                                              input key (free identifiers are how the
 *                                              console introduces user inputs)
 *
 * SUM(list, body) means: compute the body once for every row the user added to the
 * list-type input, then add the rows together. Inside the body, a name resolves first
 * to a COLUMN of the current row.
 */
import type { EquationToken } from './variables';

/** Equation tokens → console text. */
export function serializeEquation(tokens: EquationToken[]): string {
  const parts: string[] = [];
  for (const token of tokens) {
    if (token.kind === 'number') parts.push(String(token.value));
    else if (token.kind === 'variable') parts.push(token.key);
    else if (token.kind === 'aggregate') parts.push(`SUM(${token.group}, ${serializeEquation(token.body)})`);
    else parts.push(token.value);
  }
  // No space after "(" or before ")" — reads like math, still splits cleanly.
  return parts.join(' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
}

export type ParseResult = { ok: true; tokens: EquationToken[] } | { ok: false; error: string };

/** Console text → equation tokens, with a human error when it can't be. */
export function parseEquation(text: string): ParseResult {
  const s = text.trim();
  if (!s) return { ok: true, tokens: [] };

  try {
    const [tokens, end] = parseSequence(s, 0, false);
    if (end !== s.length) throw new Error(`“${s[end]}” closes nothing`);
    const structure = validateStructure(tokens);
    if (structure) throw new Error(structure);
    return { ok: true, tokens };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Reads tokens from position `i` until the end of the string — or, when `insideParens`,
 * until the matching ')' or a top-level ',' (both left unconsumed for the caller).
 */
function parseSequence(s: string, i: number, insideParens: boolean): [EquationToken[], number] {
  const tokens: EquationToken[] = [];
  let depth = 0;

  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i += 1;
    } else if (ch === '(') {
      tokens.push({ kind: 'paren', value: '(' });
      depth += 1;
      i += 1;
    } else if (ch === ')') {
      if (depth === 0) {
        if (insideParens) return [tokens, i]; // the caller consumes it
        throw new Error('A “)” closes nothing');
      }
      tokens.push({ kind: 'paren', value: ')' });
      depth -= 1;
      i += 1;
    } else if (ch === ',') {
      if (insideParens && depth === 0) return [tokens, i];
      throw new Error('A “,” only belongs inside SUM(list, …)');
    } else if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ kind: 'operator', value: ch });
      i += 1;
    } else if (/[0-9.]/.test(ch)) {
      const match = /^[0-9]*\.?[0-9]+/.exec(s.slice(i));
      if (!match) throw new Error(`Not a number at position ${i + 1}: “${s.slice(i, i + 8)}…”`);
      tokens.push({ kind: 'number', value: Number(match[0]) });
      i += match[0].length;
    } else if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i))!;
      const word = match[0];
      i += word.length;
      // SUM( starts an aggregate; a plain identifier is a variable.
      const rest = s.slice(i).replace(/^\s*/, '');
      if (word.toUpperCase() === 'SUM' && rest.startsWith('(')) {
        i = s.indexOf('(', i) + 1;
        const groupMatch = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*,/.exec(s.slice(i));
        if (!groupMatch) throw new Error('SUM needs a list name first: SUM(listName, …math per row…)');
        const group = groupMatch[1];
        i += groupMatch[0].length;
        const [body, bodyEnd] = parseSequence(s, i, true);
        if (s[bodyEnd] !== ')') throw new Error(`SUM(${group}, …) is never closed`);
        if (!body.length) throw new Error(`SUM(${group}, …) needs math after the comma`);
        const bodyError = validateStructure(body);
        if (bodyError) throw new Error(`Inside SUM(${group}, …): ${bodyError}`);
        tokens.push({ kind: 'aggregate', fn: 'SUM', group, body });
        i = bodyEnd + 1;
      } else {
        tokens.push({ kind: 'variable', key: word });
      }
    } else {
      throw new Error(`“${ch}” isn't part of an equation — use variables, numbers, + - * / ( ) and SUM(list, …)`);
    }
  }

  if (depth > 0) throw new Error('A “(” is never closed');
  if (insideParens) throw new Error('A “(” is never closed');
  return [tokens, i];
}

/** True for tokens that stand for a value in the sequence. */
const isValueToken = (t: EquationToken) => t.kind === 'number' || t.kind === 'variable' || t.kind === 'aggregate';

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
      isValueToken(token) &&
      previous &&
      (isValueToken(previous) || (previous.kind === 'paren' && previous.value === ')'))
    ) {
      return 'Two values in a row — put an operator between them';
    }
    previous = token;
  }
  if (depth > 0) return 'A “(” is never closed';
  if (previous && previous.kind === 'operator') return `The equation ends on “${previous.value}”`;
  return null;
}
