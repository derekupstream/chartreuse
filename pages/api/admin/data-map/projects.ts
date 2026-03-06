import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt((req.query.pageSize as string) ?? '25', 10) || 25));
  const search = (req.query.search as string) ?? '';

  const where = {
    isTemplate: false,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { org: { name: { contains: search, mode: 'insensitive' as const } } }
          ]
        }
      : {})
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        updatedAt: true,
        org: { select: { id: true, name: true } },
        _count: {
          select: {
            singleUseItems: true,
            reusableItems: true,
            milestones: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.project.count({ where })
  ]);

  return res.json({ projects, total, page, pageSize });
});
