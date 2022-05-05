import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'
import { validateProject } from 'lib/middleware/validateProject'
import { getProjections, ProjectionsResponse } from 'lib/calculator'

export interface ProjectSummary {
  id: string
  name: string
  account: {
    name: string
  }
  projections: ProjectionsResponse
}

export interface SummaryValues {
  baseline: number
  forecast: number
  forecasts: number[]
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

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).get(getProjectionsHandler)

async function getProjectionsHandler(req: NextApiRequestWithUser, res: NextApiResponse<AllProjectsSummary>) {
  const projects = await prisma.project.findMany({
    where: {
      accountId: req.user.accountId || undefined,
      orgId: req.user.orgId,
    },
    include: {
      account: true,
    },
  })
  const results = await Promise.all(projects.map(p => getProjections(p.id).then(r => ({ ...p, projections: r }))))

  const defaultSummary = () => ({ baseline: 0, forecast: 0, forecasts: [] })

  const summary = results.reduce<AllProjectsSummary['summary']>(
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

  res.json({ summary, projects: results })
}

export default handler
