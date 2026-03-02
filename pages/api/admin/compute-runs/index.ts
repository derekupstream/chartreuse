import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { runType, status } = req.query as { runType?: string; status?: string };

  const where: Record<string, any> = {};
  if (runType) where.runType = runType;
  if (status) where.status = status;

  const [runs, total] = await Promise.all([
    prisma.computeRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        org: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        snapshot: { select: { id: true, name: true, status: true } },
        _count: { select: { results: true, milestones: true } }
      }
    }),
    prisma.computeRun.count({ where })
  ]);

  return res.status(200).json({ runs, total });
});
