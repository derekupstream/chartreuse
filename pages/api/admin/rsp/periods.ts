import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { orgId, clientId } = req.query;

  const periods = await prisma.usageTimePeriod.findMany({
    where: {
      ...(orgId ? { orgId: orgId as string } : {}),
      ...(clientId ? { clientExternalId: clientId as string } : {})
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      clientExternalId: true,
      dateMin: true,
      dateMax: true,
      status: true,
      co2AvoidedKg: true,
      waterSavedGallons: true,
      wasteDivertedLbs: true,
      createdAt: true,
      account: { select: { id: true, name: true } },
      submittedByKey: { select: { label: true, keyPrefix: true } },
      products: {
        select: { reusableType: true, inWarehouseEvents: true, outWarehouseEvents: true, co2AvoidedKg: true }
      }
    }
  });

  res.json(periods);
});
