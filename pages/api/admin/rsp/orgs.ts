import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const rsps = await prisma.org.findMany({
      where: { orgType: 'reuse-service-provider' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        orgType: true,
        country: true,
        city: true,
        createdAt: true,
        _count: {
          select: {
            rspApiKeys: { where: { isActive: true } },
            rspClientAccounts: true,
            usagePeriods: { where: { status: 'active' } }
          }
        }
      }
    });

    // Get last submission per org
    const orgIds = rsps.map(o => o.id);
    const lastPeriods = await prisma.usageTimePeriod.groupBy({
      by: ['orgId'],
      where: { orgId: { in: orgIds } },
      _max: { createdAt: true }
    });
    const lastSubmissionMap = Object.fromEntries(lastPeriods.map(p => [p.orgId, p._max.createdAt]));

    const data = rsps.map(org => ({
      id: org.id,
      name: org.name,
      country: org.country,
      city: org.city,
      createdAt: org.createdAt,
      activeKeys: org._count.rspApiKeys,
      linkedAccounts: org._count.rspClientAccounts,
      activePeriods: org._count.usagePeriods,
      lastSubmission: lastSubmissionMap[org.id] ?? null
    }));

    res.json(data);
  })
  .patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { orgId, orgType } = req.body as { orgId?: string; orgType?: string };
    if (!orgId) return res.status(400).json({ error: 'orgId required' });

    const updated = await prisma.org.update({
      where: { id: orgId },
      data: { orgType: orgType ?? 'reuse-service-provider' },
      select: { id: true, name: true, orgType: true }
    });

    res.json(updated);
  });
