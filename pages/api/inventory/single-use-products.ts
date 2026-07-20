import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { filterByAllowedIds, getOrgCatalogSettings } from 'lib/inventory/catalogSettings';
import { getSingleUseProducts } from 'lib/inventory/getSingleUseProducts';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(getSingleUseItemsMiddlware);

async function getSingleUseItemsMiddlware(req: NextApiRequestWithUser, res: NextApiResponse) {
  const orgId = req.user.orgId;
  const [products, catalogSettings] = await Promise.all([
    getSingleUseProducts({ orgId }),
    getOrgCatalogSettings(orgId)
  ]);
  res.json(filterByAllowedIds(products, catalogSettings.singleUseProductIds));
}

export default handler;
