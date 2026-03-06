import type { NextApiResponse } from 'next';

import { LINEAGE_MAP } from 'lib/admin/lineageMap';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
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
    computeRunsByType,
    healthIssues,
    // Relationship counts for impact paths
    projectsWithRuns,
    projectsWithMilestones,
    runsWithMetrics,
    pendingChangeRequests,
    metricKeyGroups
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
    prisma.computeRun.groupBy({ by: ['runType'], _count: true }),
    prisma.dataHealthIssue.groupBy({
      by: ['entity', 'severity'],
      where: { status: 'open' },
      _count: true
    }),
    // Impact path: projects that have at least one compute run
    prisma.project.count({ where: { isTemplate: false, computeRuns: { some: {} } } }),
    // Impact path: projects that have at least one milestone
    prisma.project.count({ where: { isTemplate: false, milestones: { some: {} } } }),
    // Impact path: compute runs that produced at least one metric
    prisma.computeRun.count({ where: { results: { some: {} } } }),
    // Governance: pending change requests
    prisma.changeRequest.count({ where: { status: 'pending' } }),
    // Output: unique metric keys
    prisma.metricResult.groupBy({ by: ['metricKey'], _count: true })
  ]);

  const runsByStatus: Record<string, number> = {};
  for (const g of computeRunsByStatus) {
    runsByStatus[g.status] = g._count;
  }

  const runsByType: Record<string, number> = {};
  for (const g of computeRunsByType) {
    runsByType[g.runType] = g._count;
  }

  const health: Record<string, Record<string, number>> = {};
  for (const g of healthIssues) {
    if (!health[g.entity]) health[g.entity] = {};
    health[g.entity][g.severity] = (health[g.entity][g.severity] ?? 0) + g._count;
  }

  const uniqueFunctions = Array.from(new Set(LINEAGE_MAP.map(e => e.calculatorFunction)));
  const uniqueFiles = Array.from(new Set(LINEAGE_MAP.map(e => e.calculatorFile)));
  const uniqueOutputMetrics = Array.from(new Set(LINEAGE_MAP.flatMap(e => e.outputMetrics)));

  // Calculator function details for the drawer
  const calcFunctionDetails = uniqueFunctions.map(fn => {
    const entries = LINEAGE_MAP.filter(e => e.calculatorFunction === fn);
    return {
      name: fn,
      file: entries[0].calculatorFile,
      category: entries[0].metricCategory,
      outputMetrics: Array.from(new Set(entries.flatMap(e => e.outputMetrics)))
    };
  });

  const metricKeys: Record<string, number> = {};
  for (const g of metricKeyGroups) {
    metricKeys[g.metricKey] = g._count;
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
    runsByType,
    health,
    calculatorFunctions: uniqueFunctions.length,
    calculatorFiles: uniqueFiles.length,
    calcFunctionDetails,
    uniqueOutputMetrics: uniqueOutputMetrics.length,
    // Impact path counts
    impactPaths: {
      projectsWithRuns,
      projectsWithMilestones,
      runsWithMetrics,
      pendingChangeRequests,
      uniqueMetricKeys: Object.keys(metricKeys).length,
      metricKeys
    }
  });
});
