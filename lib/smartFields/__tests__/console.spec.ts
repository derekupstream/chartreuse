import { parseEquation, serializeEquation } from '../console';
import type { EquationToken } from '../variables';

describe('console grammar round-trip', () => {
  const tokens: EquationToken[] = [
    { kind: 'paren', value: '(' },
    { kind: 'variable', key: 'baselineMaterialGas' },
    { kind: 'operator', value: '+' },
    { kind: 'variable', key: 'baselineShippingGas' },
    { kind: 'paren', value: ')' },
    { kind: 'operator', value: '-' },
    { kind: 'number', value: 2.5 },
    { kind: 'operator', value: '*' },
    { kind: 'variable', key: 'forecastMaterialGas' }
  ];

  test('serialize → parse is lossless', () => {
    const text = serializeEquation(tokens);
    expect(text).toBe('(baselineMaterialGas + baselineShippingGas) - 2.5 * forecastMaterialGas');
    const parsed = parseEquation(text);
    expect(parsed).toEqual({ ok: true, tokens });
  });

  test('free identifiers become variable tokens (how the console introduces inputs)', () => {
    const parsed = parseEquation('fundingAmount * fundingTimesPerYear');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.tokens).toEqual([
        { kind: 'variable', key: 'fundingAmount' },
        { kind: 'operator', value: '*' },
        { kind: 'variable', key: 'fundingTimesPerYear' }
      ]);
    }
  });

  test.each([
    ['2 +', 'ends on “+”'],
    ['(a + b', 'never closed'],
    ['a + b)', 'closes nothing'],
    ['a b', 'operator between'],
    ['* a', 'needs a value before'],
    ['a = b', "isn't part of an equation"]
  ])('%s → clear error', (text, fragment) => {
    const parsed = parseEquation(text);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain(fragment);
  });

  test('empty text is an empty equation, not an error', () => {
    expect(parseEquation('  ')).toEqual({ ok: true, tokens: [] });
  });
});
