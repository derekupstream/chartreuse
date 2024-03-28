import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getReusableProducts } from 'lib/inventory/getReusableProducts';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(getSingleUseItemsMiddlware);

async function getSingleUseItemsMiddlware(req: NextApiRequestWithUser, res: NextApiResponse) {
  const products = await getReusableProducts();
  res.json(products);
}

export default handler;
