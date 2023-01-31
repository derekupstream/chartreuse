import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getSingleUseProducts } from 'lib/inventory/getSingleUseProducts';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(getSingleUseItemsMiddlware);

async function getSingleUseItemsMiddlware(req: NextApiRequestWithUser, res: NextApiResponse) {
  const orgId = req.user.orgId;
  const products = await getSingleUseProducts({ orgId });
  res.json(products);
}

export default handler;
