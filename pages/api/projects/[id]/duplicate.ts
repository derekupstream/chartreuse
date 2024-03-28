import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';
import { duplicateProject } from 'lib/projects/duplicateProject';

const handler = projectHandler();

handler.post(duplicateProjectionsHandler);

async function duplicateProjectionsHandler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const projectId = req.query.id;

  if (typeof projectId !== 'string') throw new Error('No project id provided');

  const newProject = await duplicateProject({ id: projectId });
  res.json(newProject);
}

export default handler;
