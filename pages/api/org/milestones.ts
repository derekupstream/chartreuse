import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser } from 'lib/middleware/handler';
import prisma from 'lib/prisma';

const handler = handlerWithUser();

handler.get(listOrgMilestones);

async function listOrgMilestones(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { orgId } = req.user;

  const milestones = await prisma.projectMilestone.findMany({
    where: {
      project: { orgId }
    },
    include: {
      project: { select: { id: true, name: true, category: true } }
    },
    orderBy: { snapshotDate: 'asc' }
  });

  return res.status(200).json({ milestones });
}

export default handler;
