/**
 * The Validation tool's checks, pinned in CI against the committed Data Release payload —
 * the same tables the golden spec uses. All nine of Madhavi's Validation-tab checks must
 * hold, and the 15-metric golden verification must pass, or the release payload / engine
 * has drifted.
 */
import { readFileSync } from 'fs';
import path from 'path';

import type { ModelTables } from '../combinedModel';
import { runGoldenVerification, runValidationChecks } from '../validationChecks';

const payload = JSON.parse(readFileSync(path.join(process.cwd(), 'scripts/data/cr2-release-2.0.json'), 'utf8'));

const tables: ModelTables = {
  ghgFactors: payload.ghg_factors,
  waterFactors: payload.water_factors,
  transportFactors: payload.transport_factors,
  purchaseFrequency: payload.purchase_frequency,
  utilityRates: payload.utility_rates,
  dishwasherFactors: payload.dishwasher_factors,
  singleUseProducts: payload.single_use_products,
  reusableProducts: payload.reusable_products
};

describe('runValidationChecks (Validation tab, executed)', () => {
  const results = runValidationChecks(tables);

  it('runs all nine of her checks', () => {
    expect(results).toHaveLength(9);
  });

  it('every check passes on the committed Data Release', () => {
    const failing = results.filter(r => !r.pass).map(r => `${r.check}: ${r.evidence}`);
    expect(failing).toEqual([]);
  });

  it('reconciliation evidence carries real numbers, not labels', () => {
    const su = results.find(r => r.check === 'SU GHG equals material + transport');
    expect(su?.evidence).toMatch(/material \d+\.\d+ \+ transport \d+\.\d+/);
  });
});

describe('runGoldenVerification', () => {
  it('reproduces all 15 Dashboard metrics from the workbook', () => {
    const metrics = runGoldenVerification(tables);
    expect(metrics).toHaveLength(15);
    const failing = metrics.filter(m => !m.pass).map(m => `${m.label}: ${m.computed} vs ${m.expected}`);
    expect(failing).toEqual([]);
  });
});
