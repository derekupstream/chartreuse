import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { AllProjectsSummary } from 'lib/calculator/getProjections';
import { getAllProjections } from 'lib/calculator/getProjections';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(getProjectionsHandler);

async function getProjectionsHandler(req: NextApiRequestWithUser, res: NextApiResponse<AllProjectsSummary>) {
  const projects = await prisma.project.findMany({
    where: {
      accountId: req.user.accountId || undefined,
      orgId: req.user.orgId
    },
    include: {
      account: true
    }
  });

  const result = await getAllProjections(projects);

  res.json(result);
}

export default handler;
