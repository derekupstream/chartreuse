import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';
import prisma from 'lib/prisma';
import { duplicateProject } from 'lib/projects/duplicateProject';

const handler = projectHandler();

handler.post(duplicateProjectHandler);

async function duplicateProjectHandler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const projectId = req.body.id as string;
  const accounts = await prisma.account.findMany({
    where: {
      orgId: req.user.orgId
    }
  });

  const newProject = await duplicateProject({
    id: projectId,
    // most likely the user is onboarding, just use the first account for now, unless user is assigned to a specific one
    targetAccountId: req.user.accountId || accounts[0].id,
    targetOrgId: req.user.orgId
  });
  res.json(newProject);
}

export default handler;
