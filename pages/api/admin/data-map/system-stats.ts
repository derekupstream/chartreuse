import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (_req: NextApiRequestWithUser, res: NextApiResponse) => {
  const [
    projects,
    singleUseItems,
    reusableItems,
    milestones,
    computeRuns,
    metricResults,
    factors,
    factorVersions,
    usageTimePeriods,
    usagePeriodProducts,
    importSessions,
    rspApiKeys,
    computeRunsByStatus,
    computeRunsByType
  ] = await Promise.all([
    prisma.project.count({ where: { isTemplate: false } }),
    prisma.singleUseLineItem.count(),
    prisma.reusableLineItem.count(),
    prisma.projectMilestone.count(),
    prisma.computeRun.count(),
    prisma.metricResult.count(),
    prisma.factor.count({ where: { isActive: true } }),
    prisma.factorVersion.count(),
    prisma.usageTimePeriod.count(),
    prisma.usagePeriodProduct.count(),
    prisma.importSession.count(),
    prisma.rspApiKey.count(),
    prisma.computeRun.groupBy({ by: ['status'], _count: true }),
    prisma.computeRun.groupBy({ by: ['runType'], _count: true })
  ]);

  const runsByStatus: Record<string, number> = {};
  for (const g of computeRunsByStatus) {
    runsByStatus[g.status] = g._count;
  }

  const runsByType: Record<string, number> = {};
  for (const g of computeRunsByType) {
    runsByType[g.runType] = g._count;
  }

  return res.json({
    projects,
    singleUseItems,
    reusableItems,
    milestones,
    computeRuns,
    metricResults,
    factors,
    factorVersions,
    usageTimePeriods,
    usagePeriodProducts,
    importSessions,
    rspApiKeys,
    runsByStatus,
    runsByType
  });
});
