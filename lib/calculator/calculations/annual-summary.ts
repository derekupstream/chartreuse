import type { ProjectInventory } from 'lib/inventory/types/projects';

import { getEnvironmentalResults } from './environmental-results';
import { getFinancialResults } from './financial-results';
import { getSingleUseResults } from './line-items-single-use';

export function getAnnualSummary(project: ProjectInventory) {
  const financeResults = getFinancialResults(project);
  const environmentalResults = getEnvironmentalResults(project);
  const singleUseResults = getSingleUseResults(project);
  return {
    dollarCost: financeResults.annualCostChanges,
    singleUseProductCount: singleUseResults.summary.annualUnits,
    greenhouseGasEmissions: environmentalResults.annualGasEmissionChanges,
    wasteWeight: environmentalResults.annualWasteChanges.total
  };
}
