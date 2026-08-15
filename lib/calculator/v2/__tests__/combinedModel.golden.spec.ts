/**
 * Golden reproduction of the workbook's Dashboard tab.
 *
 * The scenario and every expected value come from Madhavi's "Combined Data & Calculation
 * Model (Draft)" (2026-08-14): 3 single-use lines, 1 reusable line, California dishwashing.
 * If this spec fails, either the implementation diverged from her formulas or the data
 * release payload changed — both are worth knowing immediately.
 *
 * Her workbook's numbers include the unscoped box-water lookup (double-counts reusable box
 * water) — reproduced with replicateWorkbookBoxLookup so the match is exact. A second test
 * pins the corrected behaviour and the precise size of the correction.
 */
import { readFileSync } from 'fs';
import path from 'path';

import { computeCombinedModel } from '../combinedModel';
import type { ModelInputs, ModelTables } from '../combinedModel';

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

// The workbook's example scenario, verbatim from Scenario_SU / Scenario_Reuse / Dishwashing.
const inputs: ModelInputs = {
  singleUse: [
    {
      productId: 17,
      baselineFrequency: 'Weekly',
      baselineCasesPerFrequency: 10,
      baselineUnitsPerCase: 200,
      baselineCostPerCase: 80,
      forecastFrequency: 'Weekly',
      forecastCasesPerFrequency: 0,
      forecastUnitsPerCase: 200,
      forecastCostPerCase: 80
    },
    {
      productId: 7,
      baselineFrequency: 'Weekly',
      baselineCasesPerFrequency: 15,
      baselineUnitsPerCase: 1000,
      baselineCostPerCase: 30,
      forecastFrequency: 'Weekly',
      forecastCasesPerFrequency: 5,
      forecastUnitsPerCase: 1000,
      forecastCostPerCase: 30
    },
    {
      productId: 3,
      baselineFrequency: 'Weekly',
      baselineCasesPerFrequency: 20,
      baselineUnitsPerCase: 1000,
      baselineCostPerCase: 20,
      forecastFrequency: 'Weekly',
      forecastCasesPerFrequency: 10,
      forecastUnitsPerCase: 1000,
      forecastCostPerCase: 20
    }
  ],
  reusables: [{ productId: 100, initialCases: 10, unitsPerCase: 12, costPerCase: 2.28, annualRepurchaseRate: 0.1 }],
  dishwashing: {
    state: 'California',
    machineType: 'Stationary Single Tank Door',
    temperature: 'High',
    energyStar: true,
    buildingHeaterFuel: 'Electric',
    boosterHeaterFuel: 'Electric',
    operatingDaysPerYear: 365,
    racksPerDay: 80
  }
};

/** Relative closeness for values the workbook shows in full float precision. */
const close = (actual: number, expected: number, relTol = 1e-9) => {
  const scale = Math.max(1, Math.abs(expected));
  expect(Math.abs(actual - expected) / scale).toBeLessThan(relTol);
};

describe('Combined Model 2.0 — golden reproduction of the workbook Dashboard', () => {
  const out = computeCombinedModel(inputs, tables, { replicateWorkbookBoxLookup: true });

  it('reproduces the financial metrics exactly', () => {
    close(out.financial.baselineSingleUseAnnualCost, 85800);
    close(out.financial.forecastAnnualOperatingCost, 19633.10745);
    close(out.financial.annualSavings, 66166.89255);
    close(out.financial.oneTimeStartupCost, 22.8);
    close(out.financial.annualSavingsROI, 2902.056691, 1e-8);
    close(out.financial.paybackMonths!, 0.004134998478, 1e-8);
  });

  it('reproduces single-use units', () => {
    close(out.singleUseUnits.baseline, 1924000);
    close(out.singleUseUnits.forecastAnnual, 780000);
    close(out.singleUseUnits.reduction, 1144000);
    close(out.singleUseUnits.reductionPct, 0.5945945946, 1e-8);
  });

  it('reproduces waste / purchased mass', () => {
    close(out.wasteLb.baseline, 33644);
    close(out.wasteLb.forecastAnnual, 8690.75);
    close(out.wasteLb.forecastFirstYear, 8758.25);
  });

  it('reproduces GHG emissions', () => {
    close(out.ghgMtco2e.baseline, 104.9831739, 1e-8);
    close(out.ghgMtco2e.forecastAnnual, 22.77655856, 1e-8);
    close(out.ghgMtco2e.forecastFirstYear, 22.84475347, 1e-8);
  });

  it('reproduces water use', () => {
    close(out.waterGal.baseline, 213305.5011, 1e-8);
    close(out.waterGal.forecastAnnual, 95161.94939, 1e-8);
    close(out.waterGal.forecastFirstYear, 95377.24762, 1e-8);
  });
});

describe('Combined Model 2.0 — corrected box lookup', () => {
  const workbook = computeCombinedModel(inputs, tables, { replicateWorkbookBoxLookup: true });
  const corrected = computeCombinedModel(inputs, tables);

  it('changes ONLY water, and only through the reusable box term', () => {
    expect(corrected.ghgMtco2e.forecastAnnual).toBeCloseTo(workbook.ghgMtco2e.forecastAnnual, 10);
    expect(corrected.wasteLb.forecastAnnual).toBeCloseTo(workbook.wasteLb.forecastAnnual, 10);
    expect(corrected.financial.annualSavings).toBeCloseTo(workbook.financial.annualSavings, 10);
    expect(corrected.waterGal.forecastAnnual).toBeLessThan(workbook.waterGal.forecastAnnual);
  });

  it('the water difference equals exactly one cardboard water factor on the reusable box mass', () => {
    // Duplicate cardboard row factor: 3.694252415382243 gal/lb; recurring box mass = 10 cases
    // × box_wt/case × 10% repurchase. The workbook counts the factor twice, corrected counts once.
    const reusable = tables.reusableProducts.find(p => Number(p.product_id) === 100)!;
    const recurringBoxLb = 10 * Number(reusable.box_weight_per_case_lbs) * 0.1;
    const cardboardWater = 3.694252415382243;
    const expectedDelta = recurringBoxLb * cardboardWater;
    expect(workbook.waterGal.forecastAnnual - corrected.waterGal.forecastAnnual).toBeCloseTo(expectedDelta, 6);
  });
});
