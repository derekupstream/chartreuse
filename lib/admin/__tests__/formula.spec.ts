import { evaluateFormula, isFormula, makeTableResolver, parseTokens } from '../formula';

const tables = new Map([
  [
    'GHG Factors',
    {
      keyColumn: 'scope,material',
      rows: [
        { scope: 'Single-Use', material: 'Paper', ghg_factor_mtco2e_per_lb: 0.004685 },
        { scope: 'Reusable', material: 'Glass', ghg_factor_mtco2e_per_lb: 0.00028 }
      ]
    }
  ],
  ['Purchase Frequency', { keyColumn: 'Frequency', rows: [{ Frequency: 'Weekly', Annual_Factor: 52 }] }]
]);
const resolve = makeTableResolver(tables);

describe('formula', () => {
  it('detects formulas by the leading =', () => {
    expect(isFormula('= 1 + 2')).toBe(true);
    expect(isFormula('12')).toBe(false);
    expect(isFormula(12)).toBe(false);
  });

  it('parses variable tokens with composite row keys', () => {
    const tokens = parseTokens('= 12 * @{GHG Factors.ghg_factor_mtco2e_per_lb:single-use|paper}');
    expect(tokens).toEqual([
      {
        raw: '@{GHG Factors.ghg_factor_mtco2e_per_lb:single-use|paper}',
        database: 'GHG Factors',
        column: 'ghg_factor_mtco2e_per_lb',
        rowKey: 'single-use|paper'
      }
    ]);
  });

  it('evaluates arithmetic over resolved variables', () => {
    const result = evaluateFormula('= 12 * @{GHG Factors.ghg_factor_mtco2e_per_lb:single-use|paper}', resolve);
    expect(result).toEqual({ ok: true, value: 12 * 0.004685 });
  });

  it('mixes variables from different databases', () => {
    const result = evaluateFormula(
      '= @{Purchase Frequency.Annual_Factor:weekly} * (1 + @{GHG Factors.ghg_factor_mtco2e_per_lb:reusable|glass})',
      resolve
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(52 * 1.00028, 10);
  });

  it('fails loudly on an unresolvable variable', () => {
    const result = evaluateFormula('= @{GHG Factors.ghg_factor_mtco2e_per_lb:single-use|granite}', resolve);
    expect(result.ok).toBe(false);
  });

  it('never executes non-arithmetic input', () => {
    for (const hostile of ['= alert(1)', '= process.exit()', '= [].constructor', '= 1; 2', '= a']) {
      expect(evaluateFormula(hostile, resolve).ok).toBe(false);
    }
  });

  it('rejects empty and non-finite results', () => {
    expect(evaluateFormula('=', resolve).ok).toBe(false);
    expect(evaluateFormula('= 1/0', resolve).ok).toBe(false);
  });
});
