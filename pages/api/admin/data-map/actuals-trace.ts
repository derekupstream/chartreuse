import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const projectId = req.query.projectId as string | undefined;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId query param is required' });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, category: true, orgId: true }
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const [milestones, rawComputeRuns] = await Promise.all([
    prisma.projectMilestone.findMany({
      where: { projectId },
      orderBy: { snapshotDate: 'asc' },
      select: {
        id: true,
        snapshotDate: true,
        label: true,
        source: true,
        co2AvoidedMtco2e: true,
        waterSavedGallons: true,
        wasteDivertedLbs: true,
        annualCostSavings: true,
        paybackMonths: true,
        computeRunId: true
      }
    }),
    prisma.computeRun.findMany({
      where: { projectId, runType: { in: ['actuals_ingest', 'backfill'] } },
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        runType: true,
        startedAt: true,
        finishedAt: true,
        errorText: true,
        results: {
          select: { id: true, metricKey: true, valueNumeric: true, units: true }
        }
      }
    })
  ]);

  const computeRuns = rawComputeRuns.map(run => ({
    id: run.id,
    status: run.status,
    runType: run.runType,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    errorText: run.errorText,
    metricResults: run.results
  }));

  return res.json({ project, milestones, computeRuns });
});
