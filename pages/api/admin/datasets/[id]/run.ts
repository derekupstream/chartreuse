import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';
import { runDatasetTest } from 'lib/admin/testRunner';

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query as { id: string };
  const dataset = await prisma.goldenDataset.findUnique({ where: { id } });
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

  // Create a one-off test run for this single dataset
  const testRun = await prisma.testRun.create({
    data: { ranByUserId: req.user.id, status: 'running', totalTests: 1 }
  });

  const result = runDatasetTest(dataset);

  await prisma.testRunResult.create({
    data: {
      testRunId: testRun.id,
      datasetId: dataset.id,
      passed: result.passed,
      actualOutputs: result.actualOutputs as any,
      diff: result.diff as any,
      errorMessage: result.errorMessage || null
    }
  });

  await prisma.testRun.update({
    where: { id: testRun.id },
    data: {
      status: 'completed',
      passed: result.passed ? 1 : 0,
      failed: result.passed ? 0 : 1
    }
  });

  res.json({ testRunId: testRun.id, result });
});
