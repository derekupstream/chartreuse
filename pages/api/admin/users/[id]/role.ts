import { Role } from '@prisma/client';
import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

export default handlerWithUser().patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const userId = req.query.id as string;
  const { role } = req.body as { role: string };

  if (!role || !Object.values(Role).includes(role as Role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, orgId: true } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userOrg = await prisma.org.findUnique({ where: { id: user.orgId }, select: { isUpstream: true } });
  if (userOrg?.isUpstream) return res.status(403).json({ error: 'Cannot change role of upstream users' });

  const updated = await prisma.user.update({ where: { id: userId }, data: { role: role as Role } });

  return res.status(200).json({ role: updated.role });
});
