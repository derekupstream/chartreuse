import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getFoodwareOptions } from 'lib/inventory/assets/event-foodware/getFoodwareOptions';
import { getOrgCatalogSettings } from 'lib/inventory/catalogSettings';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(getFoodwareOptionsMiddleware);

async function getFoodwareOptionsMiddleware(req: NextApiRequestWithUser, res: NextApiResponse) {
  const [options, catalogSettings] = await Promise.all([getFoodwareOptions(), getOrgCatalogSettings(req.user.orgId)]);

  // A curated pairing survives only if both sides are allowed by the org's catalog.
  const reusableAllowed = new Set(catalogSettings.reusableProductIds ?? []);
  const singleUseAllowed = new Set(catalogSettings.singleUseProductIds ?? []);
  const filtered = options.filter(
    option =>
      (reusableAllowed.size === 0 || reusableAllowed.has(option.reusable.id)) &&
      (singleUseAllowed.size === 0 || singleUseAllowed.has(option.singleuse.id))
  );

  res.json(filtered);
}

export default handler;
