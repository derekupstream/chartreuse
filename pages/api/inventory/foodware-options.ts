import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getFoodwareOptions } from 'lib/inventory/assets/event-foodware/getFoodwareOptions';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(getFoodwareOptionsMiddleware);

async function getFoodwareOptionsMiddleware(req: NextApiRequestWithUser, res: NextApiResponse) {
  const options = await getFoodwareOptions();
  res.json(options);
}

export default handler;
