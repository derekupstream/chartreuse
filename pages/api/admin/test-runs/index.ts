import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';
import { runDatasetTest } from 'lib/admin/testRunner';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const runs = await prisma.testRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        ranByUserId: true,
        status: true,
        totalTests: true,
        passed: true,
        failed: true
      }
    });

    // Attach user names
    const userIds = Array.from(new Set(runs.map(r => r.ranByUserId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

    res.json(runs.map(r => ({ ...r, ranByName: userMap[r.ranByUserId] || r.ranByUserId })));
  })
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const datasets = await prisma.goldenDataset.findMany({ where: { isActive: true } });
    if (datasets.length === 0) return res.status(400).json({ error: 'No active datasets to test' });

    const testRun = await prisma.testRun.create({
      data: {
        ranByUserId: req.user.id,
        status: 'running',
        totalTests: datasets.length
      }
    });

    const results = datasets.map(d => runDatasetTest(d));

    await prisma.testRunResult.createMany({
      data: results.map(r => ({
        testRunId: testRun.id,
        datasetId: r.datasetId,
        passed: r.passed,
        actualOutputs: r.actualOutputs as any,
        diff: r.diff as any,
        errorMessage: r.errorMessage || null
      }))
    });

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    const updated = await prisma.testRun.update({
      where: { id: testRun.id },
      data: { status: 'completed', passed, failed }
    });

    res.status(201).json(updated);
  });
