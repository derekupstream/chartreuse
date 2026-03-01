import type { NextApiResponse } from 'next';

import { getProjections } from 'lib/calculator/getProjections';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware/handler';
import prisma from 'lib/prisma';

const handler = projectHandler();

handler.get(listMilestones).post(createMilestone).delete(deleteMilestone);

async function listMilestones(req: NextApiRequestWithUser, res: NextApiResponse) {
  const projectId = req.query.id as string;

  const milestones = await prisma.projectMilestone.findMany({
    where: { projectId },
    orderBy: { snapshotDate: 'asc' }
  });

  return res.status(200).json({ milestones });
}

async function createMilestone(req: NextApiRequestWithUser, res: NextApiResponse) {
  const projectId = req.query.id as string;
  const { label, snapshotDate } = req.body as { label?: string; snapshotDate?: string };

  const proj = await getProjections(projectId);
  const { annualSummary, environmentalResults, financialResults, reusableResults } = proj;

  const annualCostChange = financialResults.summary.annualCost;

  const milestone = await prisma.projectMilestone.create({
    data: {
      projectId,
      snapshotDate: snapshotDate ? new Date(snapshotDate) : new Date(),
      label: label || null,
      source: 'manual',
      co2AvoidedMtco2e: Math.abs(annualSummary.greenhouseGasEmissions.total.change),
      waterSavedGallons: Math.abs(environmentalResults.annualWaterUsageChanges.total.change),
      wasteDivertedLbs: Math.abs(annualSummary.wasteWeight.change),
      annualCostSavings: annualCostChange < 0 ? Math.abs(annualCostChange) : 0,
      paybackMonths: financialResults.summary.paybackPeriodsMonths,
      annualROIPct: financialResults.summary.annualROIPercent,
      envBreakEvenMonths: environmentalResults.envBreakEven.co2BreakEvenMonths,
      returnRatePct: (reusableResults.summary.returnRate?.returnRate ?? 0) * 100,
      rawMetrics: proj as any
    }
  });

  return res.status(201).json({ milestone });
}

async function deleteMilestone(req: NextApiRequestWithUser, res: NextApiResponse) {
  const milestoneId = req.query.milestoneId as string;
  if (!milestoneId) return res.status(400).json({ error: 'milestoneId required' });

  const projectId = req.query.id as string;

  // Verify milestone belongs to this project (and this project belongs to user's org via validateProject middleware)
  await prisma.projectMilestone.deleteMany({
    where: { id: milestoneId, projectId }
  });

  return res.status(200).end();
}

export default handler;
