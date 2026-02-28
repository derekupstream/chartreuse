import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query as { id: string };
  const run = await prisma.testRun.findUnique({
    where: { id },
    include: {
      results: {
        include: {
          dataset: { select: { id: true, name: true, category: true, tolerance: true } }
        }
      }
    }
  });
  if (!run) return res.status(404).json({ error: 'Not found' });

  const user = await prisma.user.findUnique({
    where: { id: run.ranByUserId },
    select: { name: true }
  });

  res.json({ ...run, ranByName: user?.name || run.ranByUserId });
});
