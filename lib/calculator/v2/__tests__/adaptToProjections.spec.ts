/**
 * The overlay must write EVERY field the summary cards actually read — annualSummary.* AND
 * the environmentalResults totals. Caught in the wild 2026-09-19: the "Annual GHG changes"
 * card read environmentalResults.annualGasEmissionChanges.total, which the overlay didn't
 * cover, so it showed v1's −82.16 beside a Methodology-2.0 stamp (her Dashboard: 82.21).
 * This spec pins each card's read-path to the golden scenario's 2.0 values, using sentinel
 * v1 numbers that can never be mistaken for the real ones.
 */
import { readFileSync } from 'fs';
import path from 'path';

import { computeCombinedModel } from '../combinedModel';
import type { ModelTables } from '../combinedModel';
import { GOLDEN_INPUTS } from '../goldenDataset';
import { applyV2Overrides } from '../adaptToProjections';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';

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

/** A v1 payload of sentinels: any 999… surviving into an overlaid field is a missed path. */
const SENTINEL = { baseline: 999001, forecast: 999002, change: 999003, changePercent: 999 };
const v1 = {
  annualSummary: {
    dollarCost: { ...SENTINEL },
    singleUseProductCount: { ...SENTINEL },
    wasteWeight: { ...SENTINEL },
    greenhouseGasEmissions: { total: { ...SENTINEL } }
  },
  environmentalResults: {
    annualWaterUsageChanges: { total: { ...SENTINEL }, landfillWaste: { ...SENTINEL } },
    annualGasEmissionChanges: { total: { ...SENTINEL }, landfillWaste: { ...SENTINEL } },
    annualWasteChanges: { summary: { ...SENTINEL }, disposableProductWeight: { ...SENTINEL } }
  },
  financialResults: {
    // Realistic v1 recurring lines so the utilities swap + aggregate shift is checkable:
    // v1 prices the scenario's dishwashing at 1092.33; the model says 1430.83.
    annualCostChanges: {
      change: -66505.39, // v1 net = the sum of its own lines: -67600 + 2.28 + 1092.33
      singleUseProductChange: -67600,
      reusableProductCosts: 2.28,
      laborCosts: 0,
      utilities: 1092.33,
      wasteHauling: 0
    },
    oneTimeCosts: { total: 999004 },
    summary: { annualCost: 999005, paybackPeriodsMonths: 999, annualROIPercent: 999 }
  }
} as unknown as ProjectionsResponse;

describe('applyV2Overrides covers every field the summary cards read', () => {
  const v2 = computeCombinedModel(GOLDEN_INPUTS, tables, { replicateWorkbookBoxLookup: true });
  const out = applyV2Overrides(v1, v2);

  test('annualSummary headline aggregates', () => {
    expect(out.annualSummary.dollarCost.change).toBe(-66167);
    expect(out.annualSummary.singleUseProductCount.change).toBe(-1144000);
    expect(out.annualSummary.wasteWeight.change).toBe(-24953);
    // GHG keeps two decimals (Derek, 2026-09-19) — small projects must not round to 0.
    expect(out.annualSummary.greenhouseGasEmissions.total.change).toBe(-82.21);
  });

  test('environmentalResults totals (what the water/GHG/waste cards read)', () => {
    expect(out.environmentalResults.annualWaterUsageChanges.total.change).toBe(-118144);
    expect(out.environmentalResults.annualGasEmissionChanges.total.change).toBe(-82.21);
    expect(out.environmentalResults.annualWasteChanges.summary.change).toBe(-24953);
    // Percent badges must be v1-convention rounded percentages, never raw fractions —
    // whole numbers even where the value keeps decimals.
    expect(out.environmentalResults.annualWaterUsageChanges.total.changePercent).toBe(-55);
    expect(out.environmentalResults.annualGasEmissionChanges.total.changePercent).toBe(-78);
  });

  test('financial summary speaks 2.0 throughout, in v1 conventions', () => {
    // The golden INPUTS carry no additional costs (the $200k lives on the Scenario Dashboard
    // project), so one-time here is just the reusables purchase: 22.8 → 23.
    expect(out.financialResults.oneTimeCosts.total).toBe(23);
    expect(out.financialResults.summary.paybackPeriodsMonths).toBe(1);
    expect(out.financialResults.summary.annualROIPercent).toBeCloseTo((66166.89255 / 22.8) * 100, 0);
    // Savings total is the model's (negative = savings; the card displays ×−1)…
    expect(out.financialResults.summary.annualCost).toBe(-66166.89);
    // …dishwashing utilities are the model's Dishwashing-tab price, not v1's…
    expect(out.financialResults.annualCostChanges.utilities).toBe(1430.83);
    // …and the recurring aggregate shifted by exactly the utilities delta, so the
    // column still sums: recurring total = change − singleUseProductChange.
    const recurring =
      out.financialResults.annualCostChanges.change - out.financialResults.annualCostChanges.singleUseProductChange;
    expect(recurring).toBeCloseTo(1430.83 + 2.28, 1);
  });

  test('no sentinel survives into an overlaid total', () => {
    const overlaid = [
      out.annualSummary.dollarCost,
      out.annualSummary.singleUseProductCount,
      out.annualSummary.wasteWeight,
      out.annualSummary.greenhouseGasEmissions.total,
      out.environmentalResults.annualWaterUsageChanges.total,
      out.environmentalResults.annualGasEmissionChanges.total,
      out.environmentalResults.annualWasteChanges.summary
    ];
    for (const row of overlaid) {
      expect(row.change).not.toBe(SENTINEL.change);
      expect(row.changePercent).not.toBe(SENTINEL.changePercent);
      expect(Math.abs(row.changePercent)).toBeLessThanOrEqual(100);
    }
  });

  test('sub-breakdowns stay v1 until the model defines decompositions (feedback #11)', () => {
    expect((out.environmentalResults.annualGasEmissionChanges as any).landfillWaste.change).toBe(999003);
    expect((out.environmentalResults.annualWasteChanges as any).disposableProductWeight.change).toBe(999003);
  });
});
