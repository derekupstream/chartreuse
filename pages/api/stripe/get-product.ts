import type { NextApiRequest, NextApiResponse } from 'next';

import { defaultHandler } from 'lib/middleware/handler';
import { getSubscriptionProduct } from 'lib/stripe/getSubscriptionProduct';

const handler = defaultHandler();

handler.get(getProductHandler);

async function getProductHandler(req: NextApiRequest, res: NextApiResponse) {
  const product = await getSubscriptionProduct();

  return res.status(200).json(product);
}

export default handler;
