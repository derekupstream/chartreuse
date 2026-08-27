/**
 * The golden dataset — the workbook's own example scenario and its Dashboard outputs,
 * verbatim from Madhavi's "Combined Data & Calculation Model". One copy, three consumers:
 * the CI golden spec, the Annual Projections bench, and the Validation tool. If any of
 * them disagrees with this file, the model or the data release has drifted.
 */
import type { ModelInputs } from './combinedModel';

/** The workbook's example scenario (Scenario_SU / Scenario_Reuse / Dishwashing). Do not edit; edit copies of it. */
export const GOLDEN_INPUTS: ModelInputs = {
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

export type GoldenMetric = { key: string; label: string; value: number; digits: number };

/** Expected outputs, verbatim from the workbook's Dashboard tab (workbook-faithful mode). */
export const GOLDEN_EXPECTED: GoldenMetric[] = [
  { key: 'baselineCost', label: 'Baseline single-use annual cost ($)', value: 85800, digits: 2 },
  { key: 'forecastCost', label: 'Forecast annual operating cost ($)', value: 19633.10745, digits: 2 },
  { key: 'savings', label: 'Annual savings ($)', value: 66166.89255, digits: 2 },
  { key: 'oneTime', label: 'One-time startup cost ($)', value: 22.8, digits: 2 },
  { key: 'unitsBase', label: 'Single-use units — baseline', value: 1924000, digits: 0 },
  { key: 'unitsFcst', label: 'Single-use units — forecast', value: 780000, digits: 0 },
  { key: 'wasteBase', label: 'Waste / purchased mass (lb) — baseline', value: 33644, digits: 2 },
  { key: 'wasteFcst', label: 'Waste (lb) — forecast annual', value: 8690.75, digits: 2 },
  { key: 'wasteFy', label: 'Waste (lb) — first year', value: 8758.25, digits: 2 },
  { key: 'ghgBase', label: 'GHG (MTCO₂e) — baseline', value: 104.9831739, digits: 4 },
  { key: 'ghgFcst', label: 'GHG (MTCO₂e) — forecast annual', value: 22.77655856, digits: 4 },
  { key: 'ghgFy', label: 'GHG (MTCO₂e) — first year', value: 22.84475347, digits: 4 },
  { key: 'waterBase', label: 'Water (gal) — baseline', value: 213305.5011, digits: 2 },
  { key: 'waterFcst', label: 'Water (gal) — forecast annual', value: 95161.94939, digits: 2 },
  { key: 'waterFy', label: 'Water (gal) — first year', value: 95377.24762, digits: 2 }
];

export const GOLDEN_REL_TOLERANCE = 1e-6;
