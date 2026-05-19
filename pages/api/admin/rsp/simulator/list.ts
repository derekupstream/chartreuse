import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

/** Lists existing simulated RSP orgs (with their API keys + account counts) so
 *  the wizard can pick one to extend instead of always creating new. */
export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const orgs = await prisma.org.findMany({
    where: {
      orgType: 'reuse-service-provider',
      metadata: { path: ['simulated'], equals: true }
    },
    select: {
      id: true,
      name: true,
      country: true,
      city: true,
      createdAt: true,
      _count: { select: { accounts: true, rspApiKeys: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(orgs);
});
