import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { category, search, showTemplates } = req.query;

  const projects = await prisma.project.findMany({
    where: {
      ...(showTemplates !== 'true' ? { isTemplate: false } : {}),
      ...(category ? { category: category as any } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search as string, mode: 'insensitive' } },
              { org: { name: { contains: search as string, mode: 'insensitive' } } }
            ]
          }
        : {})
    },
    include: {
      org: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
      tags: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.status(200).json({ projects });
});
