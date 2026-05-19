import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

/**
 * Wipes simulated RSP data. Two modes:
 *   { orgId: "..." }      → wipe just that simulated RSP
 *   { allSimulated: true } → wipe all orgs marked simulated
 *
 * Deletes (in order to avoid FK violations):
 *   1. Activity logs scoped to the simulated org(s)
 *   2. UsageTimePeriod rows scoped to the simulated org(s) (UsagePeriodProduct cascades)
 *   3. The org itself (RspApiKey, Account, Project cascade)
 */
export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { orgId, allSimulated } = req.body as { orgId?: string; allSimulated?: boolean };
  if (!orgId && !allSimulated) {
    return res.status(400).json({ error: 'Pass either orgId or allSimulated: true' });
  }

  let targetOrgIds: string[];
  if (orgId) {
    const org = await prisma.org.findUnique({ where: { id: orgId }, select: { id: true, metadata: true } });
    if (!org) return res.status(404).json({ error: 'Org not found' });
    const meta = (org.metadata ?? {}) as Record<string, unknown>;
    if (meta.simulated !== true) {
      return res.status(400).json({ error: 'Refusing to wipe — org is not flagged as simulated' });
    }
    targetOrgIds = [org.id];
  } else {
    const simulated = await prisma.org.findMany({
      where: { metadata: { path: ['simulated'], equals: true } },
      select: { id: true }
    });
    targetOrgIds = simulated.map(o => o.id);
  }

  if (targetOrgIds.length === 0) {
    return res.json({ deleted: { orgs: 0, periods: 0, activityLogs: 0 } });
  }

  const result = await prisma.$transaction(async tx => {
    const activityDeleted = await tx.rspApiActivityLog.deleteMany({
      where: { orgId: { in: targetOrgIds } }
    });
    const periodDeleted = await tx.usageTimePeriod.deleteMany({
      where: { orgId: { in: targetOrgIds } }
    });
    const orgDeleted = await tx.org.deleteMany({
      where: { id: { in: targetOrgIds } }
    });
    return {
      orgs: orgDeleted.count,
      periods: periodDeleted.count,
      activityLogs: activityDeleted.count
    };
  });

  res.json({ deleted: result, targetOrgIds });
});
