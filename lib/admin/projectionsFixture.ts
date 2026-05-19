import { STATES } from 'lib/calculator/constants/utilities';
import type { ProjectInventory } from 'lib/inventory/types/projects';

export type FixtureField = {
  key: string;
  label: string;
  type: 'number' | 'select' | 'text';
  unit?: string;
  helpText?: string;
  min?: number;
  max?: number;
  options?: Array<{ value: string | number; label: string }>;
};

/**
 * Flat input schema for the Projections Model — modeled on the K-12 calculator's
 * inputSchema.fields shape so the same form renderer can power both. These fields
 * are overlaid on top of a reference ProjectInventory; products/categories/IDs are
 * preserved from the reference.
 */
export const PROJECTIONS_FIXTURE_FIELDS: FixtureField[] = [
  {
    key: 'state',
    label: 'State',
    type: 'select',
    helpText: 'Drives default utility rates',
    options: STATES.map(s => ({ value: s.name, label: s.name }))
  },
  {
    key: 'singleUseAnnualCases',
    label: 'Single-Use Annual Cases',
    type: 'number',
    unit: 'cases/year',
    helpText: 'Cases of single-use product purchased per year'
  },
  {
    key: 'singleUseCostPerCase',
    label: 'Single-Use Cost / Case',
    type: 'number',
    unit: '$',
    helpText: 'Wholesale cost per case'
  },
  {
    key: 'singleUseUnitsPerCase',
    label: 'Single-Use Units / Case',
    type: 'number',
    unit: 'units'
  },
  {
    key: 'reusableUnitsPurchased',
    label: 'Reusable Units Purchased',
    type: 'number',
    unit: 'units',
    helpText: 'Total reusable units in your fleet'
  },
  {
    key: 'reusableCostPerUnit',
    label: 'Reusable Cost / Unit',
    type: 'number',
    unit: '$'
  },
  {
    key: 'reusableAnnualLossPct',
    label: 'Reusable Annual Loss',
    type: 'number',
    unit: '%',
    min: 0,
    max: 100,
    helpText: 'Percent of fleet replaced annually due to loss/breakage'
  },
  {
    key: 'dishwasherRacksPerDay',
    label: 'Dishwasher Racks / Day',
    type: 'number',
    unit: 'racks/day',
    helpText: 'Forecast racks per day in the reuse scenario'
  },
  {
    key: 'dishwasherOperatingDays',
    label: 'Dishwasher Operating Days',
    type: 'number',
    unit: 'days/year'
  },
  {
    key: 'annualLaborCost',
    label: 'Annual Labor Cost',
    type: 'number',
    unit: '$/year',
    helpText: 'Recurring labor cost for washing/handling reusables'
  }
];

export type FixtureValues = Record<string, string | number>;

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/**
 * Read the flat fixture values out of a full ProjectInventory. Used to populate
 * the form when a dataset is loaded.
 */
export function extractFixtureValues(inventory: ProjectInventory): FixtureValues {
  const su = inventory.singleUseItems?.[0];
  const re = inventory.reusableItems?.[0];
  const dw = inventory.dishwashers?.[0];
  const lc = inventory.laborCosts?.[0];

  const reUnitsPerCase = re?.unitsPerCase ?? 1;
  return {
    state: inventory.state ?? 'California',
    singleUseAnnualCases: su?.newCasesPurchased ?? su?.casesPurchased ?? 0,
    singleUseCostPerCase: su?.newCaseCost ?? su?.caseCost ?? 0,
    singleUseUnitsPerCase: su?.unitsPerCase ?? 0,
    reusableUnitsPurchased: (re?.newCasesPurchased ?? re?.casesPurchased ?? 0) * reUnitsPerCase,
    reusableCostPerUnit: (re?.newCaseCost ?? re?.caseCost ?? 0) / (reUnitsPerCase || 1),
    reusableAnnualLossPct: (re?.annualRepurchasePercentage ?? 0) * 100,
    dishwasherRacksPerDay: dw?.newRacksPerDay ?? dw?.racksPerDay ?? 0,
    dishwasherOperatingDays: dw?.newOperatingDays ?? dw?.operatingDays ?? 0,
    annualLaborCost: lc?.cost ?? 0
  };
}

/**
 * Apply flat fixture values back onto a reference inventory. Returns a deep clone
 * with overrides applied to the first single-use item, first reusable, first
 * dishwasher, and first labor cost. Other inventory rows are preserved.
 */
export function applyFixtureValues(reference: ProjectInventory, values: FixtureValues): ProjectInventory {
  const next: ProjectInventory = JSON.parse(JSON.stringify(reference));

  const stateValue = typeof values.state === 'string' && values.state ? values.state : next.state;
  next.state = stateValue as ProjectInventory['state'];

  const matched = STATES.find(s => s.name === stateValue);
  if (matched) {
    next.utilityRates = {
      gas: matched.gas,
      electric: matched.electric,
      water: next.utilityRates?.water ?? 0.005
    };
  }

  if (next.singleUseItems?.[0]) {
    const item = next.singleUseItems[0];
    item.newCasesPurchased = num(values.singleUseAnnualCases, item.newCasesPurchased);
    item.casesPurchased = item.newCasesPurchased;
    item.newCaseCost = num(values.singleUseCostPerCase, item.newCaseCost);
    item.caseCost = item.newCaseCost;
    item.unitsPerCase = num(values.singleUseUnitsPerCase, item.unitsPerCase);
    item.totalUnits = item.unitsPerCase * item.casesPurchased;
    item.totalCost = item.caseCost * item.casesPurchased;
  }

  if (next.reusableItems?.[0]) {
    const item = next.reusableItems[0];
    const unitsPerCase = item.unitsPerCase || 1;
    const totalUnits = num(values.reusableUnitsPurchased, (item.newCasesPurchased ?? 0) * unitsPerCase);
    item.newCasesPurchased = unitsPerCase ? totalUnits / unitsPerCase : 0;
    item.casesPurchased = item.newCasesPurchased;
    const costPerUnit = num(values.reusableCostPerUnit, (item.newCaseCost ?? 0) / unitsPerCase);
    item.newCaseCost = costPerUnit * unitsPerCase;
    item.caseCost = item.newCaseCost;
    item.annualRepurchasePercentage = num(values.reusableAnnualLossPct, item.annualRepurchasePercentage * 100) / 100;
  }

  if (next.dishwashers?.[0]) {
    const dw = next.dishwashers[0];
    dw.newRacksPerDay = num(values.dishwasherRacksPerDay, dw.newRacksPerDay);
    dw.newOperatingDays = num(values.dishwasherOperatingDays, dw.newOperatingDays);
  }

  if (next.laborCosts?.[0]) {
    next.laborCosts[0].cost = num(values.annualLaborCost, next.laborCosts[0].cost);
  }

  return next;
}
