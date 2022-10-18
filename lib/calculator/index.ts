import { Account, Project } from '@prisma/client'
import { getAnnualSummary } from './outputs/annual-summary'
import { getEnvironmentalResults } from './outputs/environmental-results'
import { getFinancialResults } from './outputs/financial-results'
import { getSingleUseProductResults } from './outputs/single-use-product-results'
import { getProjectInput } from './get-project-input'

export type ProjectionsResponse = Awaited<ReturnType<typeof getProjections>>

export async function getProjections(projectId: string) {
  const project = await getProjectInput(projectId)

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

export interface ProjectData {
  id: string
  orgId: string
  name: string
  account: {
    name: string
  }
}

export interface ProjectSummary extends ProjectData {
  projections: ProjectionsResponse
}

export interface AllProjectsSummary {
  summary: {
    savings: SummaryValues
    singleUse: SummaryValues
    waste: SummaryValues
    gas: SummaryValues
  }
  projects: ProjectSummary[]
}

const defaultSummary = () => ({ baseline: 0, forecast: 0, forecasts: [] })

export async function getAllProjections(_projects: ProjectData[]): Promise<AllProjectsSummary> {
  const projects: ProjectSummary[] = await Promise.all(_projects.map(p => getProjections(p.id).then(r => ({ ...p, projections: r }))))

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
      acc.gas.baseline = acc.gas.baseline + curr.projections.annualSummary.greenhouseGasEmissions.total.baseline
      acc.gas.forecast = acc.gas.forecast + curr.projections.annualSummary.greenhouseGasEmissions.total.followup
      acc.gas.forecasts.push(curr.projections.annualSummary.greenhouseGasEmissions.total.followup)
      return acc
    },
    {
      savings: defaultSummary(),
      singleUse: defaultSummary(),
      waste: defaultSummary(),
      gas: defaultSummary(),
    }
  )

  return { summary, projects }
}
