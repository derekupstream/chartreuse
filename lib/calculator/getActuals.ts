import { getSingleUseProductActuals } from './actuals/single-use-actuals'
import { DateRange } from './types'
import { ProjectInventory } from 'lib/inventory/types/projects'

export type ActualsResponse = ReturnType<typeof getActuals>

export function getActuals(inventory: ProjectInventory, filters: { dateRange?: DateRange; categoryId?: string }) {
  // const annualSummary = getAnnualSummary(project)
  // const environmentalResults = getEnvironmentalResults(project, dateRange)
  // const financialResults = getFinancialResults(project)
  const singleUseProducts = getSingleUseProductActuals(inventory, filters)

  return {
    // annualSummary,
    // environmentalResults,
    // financialResults,
    singleUseProducts,
  }
}
