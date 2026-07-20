import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getReusableProducts } from 'lib/inventory/assets/reusables/getReusableProducts';
import { filterByAllowedIds, getOrgCatalogSettings } from 'lib/inventory/catalogSettings';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(getSingleUseItemsMiddlware);

async function getSingleUseItemsMiddlware(req: NextApiRequestWithUser, res: NextApiResponse) {
  const [products, catalogSettings] = await Promise.all([getReusableProducts(), getOrgCatalogSettings(req.user.orgId)]);
  res.json(filterByAllowedIds(products, catalogSettings.reusableProductIds));
}

export default handler;
