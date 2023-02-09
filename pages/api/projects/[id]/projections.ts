import type { NextApiResponse } from 'next';

import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { getProjections } from 'lib/calculator/getProjections';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';

const handler = projectHandler();

handler.get(getProjectionsHandler);

async function getProjectionsHandler(req: NextApiRequestWithUser, res: NextApiResponse<ProjectionsResponse>) {
  const projectId = req.query.id;

  if (typeof projectId !== 'string') throw new Error('No project id provided');

  const results = await getProjections(projectId);
  res.json(results);
}

export default handler;
