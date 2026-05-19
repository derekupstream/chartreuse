import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

/**
 * Returns RSP API activity log rows, newest first, with optional filters:
 *   ?orgId=...&apiKeyId=...&outcome=...&since=ISO&limit=N
 */
export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { orgId, apiKeyId, outcome, since } = req.query;
  const limit = Math.min(Number(req.query.limit ?? 100), 500);

  const rows = await prisma.rspApiActivityLog.findMany({
    where: {
      ...(typeof orgId === 'string' && orgId ? { orgId } : {}),
      ...(typeof apiKeyId === 'string' && apiKeyId ? { apiKeyId } : {}),
      ...(typeof outcome === 'string' && outcome ? { outcome } : {}),
      ...(typeof since === 'string' && since ? { createdAt: { gte: new Date(since) } } : {})
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      apiKey: { select: { id: true, label: true, keyPrefix: true, org: { select: { id: true, name: true } } } }
    }
  });

  res.json({ rows });
});
