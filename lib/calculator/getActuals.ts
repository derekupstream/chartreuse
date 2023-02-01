import type { ProjectInventory } from 'lib/inventory/types/projects';

import { getSingleUseProductActuals } from './actuals/single-use-actuals';
import type { DateRange } from './types';

export type ActualsResponse = ReturnType<typeof getActuals>;

export function getActuals(inventory: ProjectInventory, filters: { dateRange?: DateRange; categoryId?: string } = {}) {
  // const annualSummary = getAnnualSummary(project)
  // const environmentalResults = getEnvironmentalResults(project, dateRange)
  // const financialResults = getFinancialResults(project)
  const singleUseProducts = getSingleUseProductActuals(inventory, filters);

  const recordDates = Object.keys(singleUseProducts.purchases).sort();

  let recordsWindow: { start: Date; end: Date } | null = null;
  if (recordDates.length) {
    const startDate = new Date(recordDates[0]);
    const latestDate = new Date(recordDates[recordDates.length - 1]);
    recordsWindow = { start: startDate, end: latestDate };
  }

  return {
    // annualSummary,
    // environmentalResults,
    // financialResults,
    singleUseProducts,
    recordsWindow
  };
}
