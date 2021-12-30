import { ProjectInput } from '../types/projects'
import { getEnvironmentalResults } from './environmental-results'
import { getFinancialResults } from './financial-results'
import { getSingleUseProductResults } from './single-use-product-results'

export function getAnnualSummary(project: ProjectInput) {
  const financeResults = getFinancialResults(project)
  const environmentalResults = getEnvironmentalResults(project)
  const singleUseProductResults = getSingleUseProductResults(project)

  return {
    dollarCost: financeResults.annualCostChanges,
    singleUseProductCount: singleUseProductResults.summary.annualUnits,
    greenhouseGasEmissions: environmentalResults.annualGasEmissionChanges,
    wasteWeight: environmentalResults.annualWasteChanges.total,
  }
}
