import { Prisma } from '@prisma/client';
import type { NextApiResponse } from 'next';

import { getReusableProducts } from 'lib/inventory/assets/reusables/getReusableProducts';
import type { CatalogSettings } from 'lib/inventory/catalogSettings';
import { getOrgCatalogSettings, sanitizeCatalogSettings } from 'lib/inventory/catalogSettings';
import { getSingleUseProducts } from 'lib/inventory/getSingleUseProducts';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();

export type CatalogManagementResponse = {
  settings: CatalogSettings;
  reusableProducts: { id: string; description: string }[];
  singleUseProducts: { id: string; description: string }[];
};

// Management endpoint for the curation UI: always returns the FULL catalogs
// (the /api/inventory/* endpoints are the filtered ones users' pickers hit).
async function getCatalog(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.user.role !== 'ORG_ADMIN') {
    return res.status(403).json({ message: 'Only organization admins can manage the product catalog' });
  }

  const [settings, reusableProducts, singleUseProducts] = await Promise.all([
    getOrgCatalogSettings(req.user.orgId),
    getReusableProducts(),
    getSingleUseProducts({ orgId: req.user.orgId })
  ]);

  const response: CatalogManagementResponse = {
    settings,
    reusableProducts: reusableProducts.map(p => ({ id: p.id, description: p.description })),
    singleUseProducts: singleUseProducts.map(p => ({ id: p.id, description: p.description }))
  };
  res.json(response);
}

async function updateCatalog(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.user.role !== 'ORG_ADMIN') {
    return res.status(403).json({ message: 'Only organization admins can manage the product catalog' });
  }

  const settings = sanitizeCatalogSettings(req.body);
  await prisma.org.update({
    where: { id: req.user.orgId },
    data: { catalogSettings: settings ?? Prisma.JsonNull }
  });
  res.json({ settings: settings ?? {} });
}

handler.get(getCatalog).put(updateCatalog);

export default handler;
