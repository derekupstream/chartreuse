import type { NextApiResponse } from 'next';

import { getProjections } from 'lib/calculator/getProjections';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware/handler';
import prisma from 'lib/prisma';
import {
  finishComputeRun,
  getLatestPublishedSnapshotId,
  saveMetricResults,
  startComputeRun
} from 'lib/governance/computeRun';

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

  // Look up project org for provenance
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { orgId: true } });
  const orgId = project?.orgId;

  const [snapshotId, proj] = await Promise.all([getLatestPublishedSnapshotId(), getProjections(projectId)]);

  const { annualSummary, environmentalResults, financialResults, reusableResults } = proj;
  const annualCostChange = financialResults.summary.annualCost;

  const computeRunId = await startComputeRun({
    runType: 'projection',
    orgId,
    projectId,
    methodologySnapshotId: snapshotId
  });

  try {
    const co2 = Math.abs(annualSummary.greenhouseGasEmissions.total.change);
    const water = Math.abs(environmentalResults.annualWaterUsageChanges.total.change);
    const waste = Math.abs(annualSummary.wasteWeight.change);
    const costSavings = annualCostChange < 0 ? Math.abs(annualCostChange) : 0;

    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId,
        snapshotDate: snapshotDate ? new Date(snapshotDate) : new Date(),
        label: label || null,
        source: 'manual',
        co2AvoidedMtco2e: co2,
        waterSavedGallons: water,
        wasteDivertedLbs: waste,
        annualCostSavings: costSavings,
        paybackMonths: financialResults.summary.paybackPeriodsMonths,
        annualROIPct: financialResults.summary.annualROIPercent,
        envBreakEvenMonths: environmentalResults.envBreakEven.co2BreakEvenMonths,
        returnRatePct: (reusableResults.summary.returnRate?.returnRate ?? 0) * 100,
        rawMetrics: proj as any,
        computeRunId
      }
    });

    await Promise.all([
      saveMetricResults([
        {
          runId: computeRunId,
          orgId,
          projectId,
          metricKey: 'co2_avoided_mtco2e',
          valueNumeric: co2,
          units: 'MTCO2e',
          methodologySnapshotId: snapshotId
        },
        {
          runId: computeRunId,
          orgId,
          projectId,
          metricKey: 'water_saved_gallons',
          valueNumeric: water,
          units: 'gallons',
          methodologySnapshotId: snapshotId
        },
        {
          runId: computeRunId,
          orgId,
          projectId,
          metricKey: 'waste_diverted_lbs',
          valueNumeric: waste,
          units: 'lbs',
          methodologySnapshotId: snapshotId
        },
        {
          runId: computeRunId,
          orgId,
          projectId,
          metricKey: 'annual_cost_savings_usd',
          valueNumeric: costSavings,
          units: 'USD',
          methodologySnapshotId: snapshotId
        }
      ]),
      finishComputeRun(computeRunId, 'success')
    ]);

    return res.status(201).json({ milestone });
  } catch (err: any) {
    await finishComputeRun(computeRunId, 'failed', err?.message);
    throw err;
  }
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
