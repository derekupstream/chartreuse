import type { NextApiResponse } from 'next';

import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { getProjections } from 'lib/calculator/getProjections';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = projectHandler();

handler.get(getProjectionsHandler).put(updateProjectionsHandler);

async function getProjectionsHandler(req: NextApiRequestWithUser, res: NextApiResponse<ProjectionsResponse>) {
  const projectId = req.query.id;

  if (typeof projectId !== 'string') throw new Error('No project id provided');

  const results = await getProjections(projectId);
  res.json(results);
}

async function updateProjectionsHandler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { projectionsTitle, projectionsDescription } = req.body;
  const projectId = req.query.id;

  if (typeof projectId !== 'string') throw new Error('No project id provided');

  await prisma.project.update({
    where: {
      id: projectId
    },
    data: {
      projectionsTitle,
      projectionsDescription
    }
  });

  return res.status(200).end();
}

export default handler;
