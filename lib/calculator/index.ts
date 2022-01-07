import { getAnnualSummary } from './outputs/annual-summary'
import { getEnvironmentalResults } from './outputs/environmental-results'
import { getFinancialResults } from './outputs/financial-results'
import { getSingleUseProductResults } from './outputs/single-use-product-results'
import { getProjectData } from './project-input'

export type ProjectionsResponse = Awaited<ReturnType<typeof getProjections>>

export async function getProjections(projectId: string) {
  const project = await getProjectData(projectId)

  const annualSummary = getAnnualSummary(project)
  const environmentalResults = getEnvironmentalResults(project)
  const financialResults = getFinancialResults(project)
  const singleUseProductResults = getSingleUseProductResults(project)

  return {
    annualSummary,
    environmentalResults,
    financialResults,
    singleUseProductResults,
  }
}
