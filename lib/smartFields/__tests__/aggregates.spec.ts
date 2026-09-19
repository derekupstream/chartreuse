/**
 * Lists ("repeating groups") — spec §4's make-or-break feature: SUM(list, per-row math).
 * The acceptance test rebuilds a real workbook number: the golden scenario's baseline
 * single-use units. Scenario_SU has three lines, all purchased Weekly:
 *   10 cases × 200/case, 15 × 1,000, 20 × 1,000 → (2,000+15,000+20,000) × 52 = 1,924,000
 * — exactly the workbook Dashboard's "Single-use units — baseline".
 */
import { parseEquation, serializeEquation } from '../console';
import { detectRequirements, evaluateEquation } from '../variables';
import type { FieldValues, SmartVariable } from '../variables';

const noCatalog = new Map<string, SmartVariable>();

const scenario: FieldValues = {
  products: [
    { name: 'Cold cups', cases: 10, unitsPerCase: 200 },
    { name: 'Clamshells', cases: 15, unitsPerCase: 1000 },
    { name: 'Cutlery kits', cases: 20, unitsPerCase: 1000 }
  ],
  weeksPerYear: 52
};

describe('SUM over a list', () => {
  test('parses, serializes and round-trips', () => {
    const parsed = parseEquation('SUM(products, cases * unitsPerCase) * weeksPerYear');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(serializeEquation(parsed.tokens)).toBe('SUM(products, cases * unitsPerCase) * weeksPerYear');
  });

  test('reproduces the workbook baseline single-use units: 1,924,000', () => {
    const parsed = parseEquation('SUM(products, cases * unitsPerCase) * weeksPerYear');
    if (!parsed.ok) throw new Error(parsed.error);
    const { value, error } = evaluateEquation(parsed.tokens, noCatalog, scenario);
    expect(error).toBeUndefined();
    expect(value).toBe(1924000);
  });

  test('aggregates can nest inside larger math and other parens', () => {
    const parsed = parseEquation('(SUM(products, cases) + 5) * 2');
    if (!parsed.ok) throw new Error(parsed.error);
    const { value } = evaluateEquation(parsed.tokens, noCatalog, scenario);
    expect(value).toBe((10 + 15 + 20 + 5) * 2);
  });

  test('requirements: the list is one requirement carrying its inferred columns', () => {
    const parsed = parseEquation('SUM(products, cases * unitsPerCase) * weeksPerYear');
    if (!parsed.ok) throw new Error(parsed.error);
    const reqs = detectRequirements(parsed.tokens, noCatalog, {});
    const group = reqs.find(r => r.kind === 'group');
    expect(group).toMatchObject({ key: 'products', met: false });
    expect(group?.columns?.sort()).toEqual(['cases', 'unitsPerCase']);
    // Row columns must NOT surface as separate missing inputs; weeksPerYear must.
    expect(reqs.some(r => r.key === 'cases')).toBe(false);
    expect(reqs.find(r => r.key === 'weeksPerYear')).toMatchObject({ kind: 'missing', met: false });
    // With rows supplied, the group requirement is met.
    const met = detectRequirements(parsed.tokens, noCatalog, scenario).find(r => r.kind === 'group');
    expect(met?.met).toBe(true);
  });

  test('an empty list explains itself instead of computing 0', () => {
    const parsed = parseEquation('SUM(products, cases)');
    if (!parsed.ok) throw new Error(parsed.error);
    const { value, error } = evaluateEquation(parsed.tokens, noCatalog, { products: [] });
    expect(value).toBeNull();
    expect(error).toContain('has no rows yet');
  });

  test.each([
    ['SUM(products)', 'needs a list name'],
    ['SUM(products, )', 'needs math after the comma'],
    ['SUM(products, cases', 'never closed'],
    ['a, b', 'only belongs inside SUM']
  ])('%s → clear error', (text, fragment) => {
    const parsed = parseEquation(text);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain(fragment);
  });
});

describe('column names shadowed by catalog inputs', () => {
  test('a catalog INPUT with the same name as a SUM column does not become a separate requirement', () => {
    const catalog = new Map<string, SmartVariable>([
      ['unitsPerCase', { key: 'unitsPerCase', label: 'Units per case', category: 'Inputs' }]
    ]);
    const parsed = parseEquation('SUM(products, cases * unitsPerCase)');
    if (!parsed.ok) throw new Error(parsed.error);
    const reqs = detectRequirements(parsed.tokens, catalog, {});
    expect(reqs.find(r => r.key === 'unitsPerCase')).toBeUndefined();
    expect(reqs.find(r => r.kind === 'group')?.columns?.sort()).toEqual(['cases', 'unitsPerCase']);
  });
});
