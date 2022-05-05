import { Account, Project } from '@prisma/client'
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

export interface SummaryValues {
  baseline: number
  forecast: number
  forecasts: number[]
}

export interface ProjectSummary {
  id: string
  orgId: string
  name: string
  account: {
    name: string
  }
  projections: ProjectionsResponse
}

export interface AllProjectsSummary {
  summary: {
    savings: SummaryValues
    singleUse: SummaryValues
    waste: SummaryValues
    gas: { change: number }
  }
  projects: ProjectSummary[]
}

export async function getAllProjections(_projects: (Project & { account: Account })[]): Promise<AllProjectsSummary> {
  const projects: ProjectSummary[] = await Promise.all(_projects.map(p => getProjections(p.id).then(r => ({ ...p, projections: r }))))

  const defaultSummary = () => ({ baseline: 0, forecast: 0, forecasts: [] })

  const summary = projects.reduce<AllProjectsSummary['summary']>(
    (acc, curr) => {
      acc.savings.baseline = acc.savings.baseline + curr.projections.annualSummary.dollarCost.baseline
      acc.savings.forecast = acc.savings.forecast + curr.projections.annualSummary.dollarCost.followup
      acc.savings.forecasts.push(curr.projections.annualSummary.dollarCost.followup)
      acc.waste.baseline = acc.waste.baseline + curr.projections.annualSummary.wasteWeight.baseline
      acc.waste.forecast = acc.waste.forecast + curr.projections.annualSummary.wasteWeight.followup
      acc.waste.forecasts.push(curr.projections.annualSummary.wasteWeight.followup)
      acc.singleUse.baseline = acc.singleUse.baseline + curr.projections.annualSummary.singleUseProductCount.baseline
      acc.singleUse.forecast = acc.singleUse.forecast + curr.projections.annualSummary.singleUseProductCount.followup
      acc.singleUse.forecasts.push(curr.projections.annualSummary.singleUseProductCount.followup)
      acc.gas.change = acc.gas.change + curr.projections.annualSummary.greenhouseGasEmissions.total
      return acc
    },
    {
      savings: defaultSummary(),
      singleUse: defaultSummary(),
      waste: defaultSummary(),
      gas: { change: 0 },
    }
  )

  return { summary, projects }
}
