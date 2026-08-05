/**
 * Links a Chart-Reuse account to the identifier an RSP uses for that same customer.
 *
 * Without this link, a usage submission whose `client_id` matches no account is still
 * accepted — it just lands attached to nothing and never reaches the customer's dashboard.
 * This is what makes the intake endpoint's `client_id` resolvable, so it has to be
 * settable before a partner sends real data.
 */
import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

export type ClientLink = {
  accountId: string;
  accountName: string;
  orgName: string;
  rspClientId: string | null;
  venueCategory: string | null;
  /** Usage periods already ingested against this account */
  periodCount: number;
};

export default handlerWithUser()
  /** ?rspOrgId=… → accounts already linked to that RSP. Omit to list linkable accounts. */
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    if (!(await checkIsUpstream(req.user.orgId))) return res.status(403).json({ error: 'Forbidden' });

    const rspOrgId = typeof req.query.rspOrgId === 'string' ? req.query.rspOrgId : null;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    if (!rspOrgId) {
      // Candidates for linking: any account not already claimed by an RSP.
      const candidates = await prisma.account.findMany({
        where: {
          rspOrgId: null,
          ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {})
        },
        orderBy: { name: 'asc' },
        take: 50,
        select: { id: true, name: true, venueCategory: true, org: { select: { name: true } } }
      });
      return res.json(
        candidates.map(account => ({
          accountId: account.id,
          accountName: account.name,
          orgName: account.org?.name ?? '—',
          rspClientId: null,
          venueCategory: account.venueCategory,
          periodCount: 0
        }))
      );
    }

    const linked = await prisma.account.findMany({
      where: { rspOrgId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        rspClientId: true,
        venueCategory: true,
        org: { select: { name: true } }
      }
    });

    // How much data has already arrived for each link, so a broken one is obvious.
    const counts = await prisma.usageTimePeriod.groupBy({
      by: ['accountId'],
      where: { accountId: { in: linked.map(a => a.id) } },
      _count: { _all: true }
    });
    const countByAccount = Object.fromEntries(
      counts.filter(c => !!c.accountId).map(c => [c.accountId as string, c._count._all])
    );

    const data: ClientLink[] = linked.map(account => ({
      accountId: account.id,
      accountName: account.name,
      orgName: account.org?.name ?? '—',
      rspClientId: account.rspClientId,
      venueCategory: account.venueCategory,
      periodCount: countByAccount[account.id] ?? 0
    }));

    res.json(data);
  })
  /** Create or update a link. */
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    if (!(await checkIsUpstream(req.user.orgId))) return res.status(403).json({ error: 'Forbidden' });

    const { accountId, rspOrgId, rspClientId } = req.body as {
      accountId?: string;
      rspOrgId?: string;
      rspClientId?: string;
    };

    if (!accountId || !rspOrgId || !rspClientId?.trim()) {
      return res.status(400).json({ error: 'accountId, rspOrgId and rspClientId are all required' });
    }

    const clientId = rspClientId.trim();

    // client_id is resolved with a findFirst on (rspOrgId, rspClientId) — a duplicate would
    // silently route one customer's data to whichever row came back first.
    const collision = await prisma.account.findFirst({
      where: { rspOrgId, rspClientId: clientId, id: { not: accountId } },
      select: { id: true, name: true }
    });
    if (collision) {
      return res.status(409).json({
        error: `client_id "${clientId}" is already used by the account "${collision.name}" for this RSP. Each client_id must be unique per RSP.`
      });
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: { rspOrgId, rspClientId: clientId },
      select: { id: true, name: true, rspClientId: true }
    });

    res.json(updated);
  })
  /** Remove a link, leaving the account itself untouched. */
  .delete(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    if (!(await checkIsUpstream(req.user.orgId))) return res.status(403).json({ error: 'Forbidden' });

    const accountId = typeof req.query.accountId === 'string' ? req.query.accountId : null;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: { rspOrgId: null, rspClientId: null },
      select: { id: true, name: true }
    });

    res.json(updated);
  });
