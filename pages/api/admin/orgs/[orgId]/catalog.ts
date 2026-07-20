import { Prisma } from '@prisma/client';
import type { NextApiResponse } from 'next';

import { getReusableProducts } from 'lib/inventory/assets/reusables/getReusableProducts';
import type { CatalogManagementResponse } from 'pages/api/org/catalog';
import { getOrgCatalogSettings, sanitizeCatalogSettings } from 'lib/inventory/catalogSettings';
import { getSingleUseProducts } from 'lib/inventory/getSingleUseProducts';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();
handler.use(requireUpstream);

// Super Admin: manage any org's curated product catalog.
async function getCatalog(req: NextApiRequestWithUser, res: NextApiResponse) {
  const orgId = req.query.orgId as string;

  const [settings, reusableProducts, singleUseProducts] = await Promise.all([
    getOrgCatalogSettings(orgId),
    getReusableProducts(),
    getSingleUseProducts({ orgId })
  ]);

  const response: CatalogManagementResponse = {
    settings,
    reusableProducts: reusableProducts.map(p => ({ id: p.id, description: p.description })),
    singleUseProducts: singleUseProducts.map(p => ({ id: p.id, description: p.description }))
  };
  res.json(response);
}

async function updateCatalog(req: NextApiRequestWithUser, res: NextApiResponse) {
  const orgId = req.query.orgId as string;
  const settings = sanitizeCatalogSettings(req.body);

  await prisma.org.update({
    where: { id: orgId },
    data: { catalogSettings: settings ?? Prisma.JsonNull }
  });
  res.json({ settings: settings ?? {} });
}

handler.get(getCatalog).put(updateCatalog);

export default handler;
