import type { ProjectInventory } from 'lib/inventory/types/projects';

import { getEnvironmentalResults } from './getEnvironmentalResults';
import { getFinancialResults } from './getFinancialResults';
import { getSingleUseResults } from './foodware/getSingleUseResults';

export function getAnnualSummary(project: ProjectInventory) {
  const financeResults = getFinancialResults(project);
  const environmentalResults = getEnvironmentalResults(project);
  const singleUseResults = getSingleUseResults(project);
  return {
    dollarCost: financeResults.annualCostChanges,
    singleUseProductCount: singleUseResults.summary.annualUnits,
    greenhouseGasEmissions: environmentalResults.annualGasEmissionChanges,
    wasteWeight: environmentalResults.annualWasteChanges.summary
  };
}
