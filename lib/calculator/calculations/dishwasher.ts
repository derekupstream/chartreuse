import type { Dishwasher as PrismaDishwasher } from '@prisma/client';

import { getUtilityGasEmissions } from 'lib/calculator/calculations/environmental-results-gas';
import { dishwasherUtilityUsage, dishwasherAnnualCostBreakdown } from 'lib/calculator/calculations/financial-results';
import type { UtilityRates } from 'lib/calculator/constants/utilities';
import type { DishWasher } from 'lib/inventory/types/projects';

import type { ChangeSummary } from '../utils';
import { getChangeSummaryRow } from '../utils';

export type DishwasherStats = {
  electricUsage: ChangeSummary;
  electricCO2Weight: ChangeSummary;
  electricCost: ChangeSummary;
  gasUsage: ChangeSummary;
  gasCO2Weight: ChangeSummary;
  gasCost: ChangeSummary;
  waterUsage: ChangeSummary;
  waterCost: ChangeSummary;
};

export function getDishwasherStats({
  rates,
  dishwasher
}: {
  rates: UtilityRates;
  dishwasher: PrismaDishwasher;
}): DishwasherStats {
  const baseline = { operatingDays: dishwasher.operatingDays, racksPerDay: dishwasher.racksPerDay };
  const forecast = { operatingDays: dishwasher.newOperatingDays, racksPerDay: dishwasher.newRacksPerDay };
  const baselineUsage = dishwasherUtilityUsage(dishwasher as DishWasher, baseline);
  const baselineCosts = dishwasherAnnualCostBreakdown(dishwasher as DishWasher, baseline, rates);
  const baselineEmissions = getUtilityGasEmissions(dishwasher as DishWasher, baseline);
  const forecastUsage = dishwasherUtilityUsage(dishwasher as DishWasher, forecast);
  const forecastCosts = dishwasherAnnualCostBreakdown(dishwasher as DishWasher, forecast, rates);
  const forecastEmissions = getUtilityGasEmissions(dishwasher as DishWasher, forecast);
  const stats: DishwasherStats = {
    electricUsage: getChangeSummaryRow(baselineUsage.electricUsage, forecastUsage.electricUsage),
    electricCO2Weight: getChangeSummaryRow(baselineEmissions.electric, forecastEmissions.electric),
    electricCost: getChangeSummaryRow(baselineCosts.electric, forecastCosts.electric),
    gasUsage: getChangeSummaryRow(baselineUsage.gasUsage, forecastUsage.gasUsage),
    gasCO2Weight: getChangeSummaryRow(baselineEmissions.gas, forecastEmissions.gas),
    gasCost: getChangeSummaryRow(baselineCosts.gas, forecastCosts.gas),
    waterUsage: getChangeSummaryRow(baselineUsage.waterUsage, forecastUsage.waterUsage),
    waterCost: getChangeSummaryRow(baselineCosts.water, forecastCosts.water)
  };
  return stats;
}
