import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { runType, status, limit = '50', offset = '0' } = req.query as Record<string, string>;

  const runs = await prisma.computeRun.findMany({
    where: {
      ...(runType ? { runType } : {}),
      ...(status ? { status } : {})
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(limit), 200),
    skip: Number(offset),
    include: {
      org: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      snapshot: { select: { id: true, name: true, status: true } },
      _count: { select: { results: true, milestones: true } }
    }
  });

  const total = await prisma.computeRun.count({
    where: {
      ...(runType ? { runType } : {}),
      ...(status ? { status } : {})
    }
  });

  return res.status(200).json({ runs, total });
});
