/**
 * What an RSP sees when they ask "what data are we sharing with Chart-Reuse, and for whom?"
 *
 * One row per client account: the identifier their systems send, the account it routes to,
 * how many periods have arrived, when the last one arrived, and the impact totals computed
 * from everything they've shared. This is the partner-facing answer to a question that until
 * now only Upstream staff could answer, from the admin area.
 */
import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import prisma from 'lib/prisma';

export type RspClientRow = {
  accountId: string;
  name: string;
  rspClientId: string | null;
  periodCount: number;
  lastSubmission: string | null;
  /** Earliest dateMin and latest dateMax across active periods — the span of data shared */
  coverageStart: string | null;
  coverageEnd: string | null;
  totals: {
    co2AvoidedKg: number;
    waterSavedGallons: number;
    wasteDivertedLbs: number;
    singleUseEquivalents: number;
  };
};

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const org = await prisma.org.findUnique({ where: { id: req.user.orgId }, select: { orgType: true } });
  if (org?.orgType !== 'reuse-service-provider') {
    return res.status(403).json({ error: 'Only available for Reuse Service Provider organizations' });
  }

  const accounts = await prisma.account.findMany({
    where: { rspOrgId: req.user.orgId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, rspClientId: true }
  });

  // Only active periods count — superseded ones were replaced by a re-send.
  const periods = await prisma.usageTimePeriod.findMany({
    where: { orgId: req.user.orgId, status: 'active', accountId: { in: accounts.map(a => a.id) } },
    select: {
      accountId: true,
      createdAt: true,
      dateMin: true,
      dateMax: true,
      co2AvoidedKg: true,
      waterSavedGallons: true,
      wasteDivertedLbs: true,
      products: { select: { outWarehouseEvents: true } }
    }
  });

  const byAccount = new Map<string, typeof periods>();
  periods.forEach(period => {
    if (!period.accountId) return;
    const list = byAccount.get(period.accountId) ?? [];
    list.push(period);
    byAccount.set(period.accountId, list);
  });

  const rows: RspClientRow[] = accounts.map(account => {
    const accountPeriods = byAccount.get(account.id) ?? [];
    const last = accountPeriods.reduce<Date | null>(
      (latest, p) => (!latest || p.createdAt > latest ? p.createdAt : latest),
      null
    );
    const start = accountPeriods.reduce<Date | null>(
      (earliest, p) => (!earliest || p.dateMin < earliest ? p.dateMin : earliest),
      null
    );
    const end = accountPeriods.reduce<Date | null>(
      (latest, p) => (!latest || p.dateMax > latest ? p.dateMax : latest),
      null
    );

    return {
      accountId: account.id,
      name: account.name,
      rspClientId: account.rspClientId,
      periodCount: accountPeriods.length,
      lastSubmission: last?.toISOString() ?? null,
      coverageStart: start?.toISOString().slice(0, 10) ?? null,
      coverageEnd: end?.toISOString().slice(0, 10) ?? null,
      totals: {
        co2AvoidedKg: round3(accountPeriods.reduce((s, p) => s + p.co2AvoidedKg, 0)),
        waterSavedGallons: round2(accountPeriods.reduce((s, p) => s + p.waterSavedGallons, 0)),
        wasteDivertedLbs: round3(accountPeriods.reduce((s, p) => s + p.wasteDivertedLbs, 0)),
        singleUseEquivalents: accountPeriods.reduce(
          (s, p) => s + p.products.reduce((ps, product) => ps + product.outWarehouseEvents, 0),
          0
        )
      }
    };
  });

  res.json(rows);
});

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
