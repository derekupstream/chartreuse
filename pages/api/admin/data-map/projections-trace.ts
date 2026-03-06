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

  const [singleUseItems, reusableItems, rawComputeRun] = await Promise.all([
    prisma.singleUseLineItem.findMany({
      where: { projectId },
      select: { id: true, productId: true, caseCost: true, casesPurchased: true, frequency: true }
    }),
    prisma.reusableLineItem.findMany({
      where: { projectId },
      select: { id: true, productName: true, caseCost: true, casesPurchased: true }
    }),
    prisma.computeRun.findFirst({
      where: { projectId, runType: 'projection' },
      orderBy: { startedAt: 'desc' },
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

  const computeRun = rawComputeRun ? { ...rawComputeRun, metricResults: rawComputeRun.results } : null;

  return res.json({
    project,
    lineItemSummary: {
      singleUseCount: singleUseItems.length,
      reusableCount: reusableItems.length,
      singleUseItems,
      reusableItems
    },
    computeRun
  });
});
