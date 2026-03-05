import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const search = (req.query.search as string) ?? '';

  const projects = await prisma.project.findMany({
    where: {
      isTemplate: false,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {})
    },
    select: { id: true, name: true, category: true },
    orderBy: { name: 'asc' },
    take: 200
  });

  return res.json({ projects });
});
