import type { Project } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import getUser from 'lib/middleware/getUser';
import onError from 'lib/middleware/onError';
import onNoMatch from 'lib/middleware/onNoMatch';
import { getTemplates } from 'lib/projects/templates/getTemplates';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(getTemplatesEndpoint);

async function getTemplatesEndpoint(req: NextApiRequestWithUser, res: NextApiResponse<Project[]>) {
  const templates = await getTemplates(req.user);

  return res.status(200).json(templates);
}

export default handler;
