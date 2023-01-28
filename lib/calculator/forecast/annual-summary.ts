import { ProjectInventory } from 'lib/inventory/types/projects'
import { getEnvironmentalResults } from '../calculations/environmental-results'
import { getFinancialResults } from '../calculations/financial-results'
import { getSingleUseProductForecast } from './single-use-forecast'

export function getAnnualSummary(project: ProjectInventory) {
  const financeResults = getFinancialResults(project)
  const environmentalResults = getEnvironmentalResults(project)
  const singleUseProductForecast = getSingleUseProductForecast(project)

  return {
    dollarCost: financeResults.annualCostChanges,
    singleUseProductCount: singleUseProductForecast.summary.annualUnits,
    greenhouseGasEmissions: environmentalResults.annualGasEmissionChanges,
    wasteWeight: environmentalResults.annualWasteChanges.total,
  }
}
