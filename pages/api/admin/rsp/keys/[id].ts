import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

/** Per-API-key drill: returns the key, its activity log, periods grouped by account. */
export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'id required' });

  const apiKey = await prisma.rspApiKey.findUnique({
    where: { id },
    include: {
      org: { select: { id: true, name: true, country: true, city: true } }
    }
  });
  if (!apiKey) return res.status(404).json({ error: 'API key not found' });

  const [activity, periods] = await Promise.all([
    prisma.rspApiActivityLog.findMany({
      where: { apiKeyId: id },
      orderBy: { createdAt: 'desc' },
      take: 200
    }),
    prisma.usageTimePeriod.findMany({
      where: { submittedByKeyId: id },
      orderBy: { dateMin: 'asc' },
      include: {
        account: { select: { id: true, name: true, venueCategory: true, rspClientId: true } }
      }
    })
  ]);

  // Aggregate stats
  const successCount = activity.filter(a => a.outcome === 'success').length;
  const errorCount = activity.length - successCount;

  // Outcome breakdown
  const outcomeBreakdown: Record<string, number> = {};
  for (const a of activity) {
    outcomeBreakdown[a.outcome] = (outcomeBreakdown[a.outcome] ?? 0) + 1;
  }

  // Periods grouped by account → date range coverage
  const accountCoverage = new Map<
    string,
    {
      accountId: string;
      accountName: string;
      venueCategory: string | null;
      rspClientId: string | null;
      periods: Array<{ id: string; dateMin: string; dateMax: string; co2AvoidedKg: number; status: string }>;
      totalCo2: number;
      totalWater: number;
      totalWaste: number;
    }
  >();

  for (const p of periods) {
    const accId = p.accountId ?? 'unattached';
    const existing = accountCoverage.get(accId);
    const periodEntry = {
      id: p.id,
      dateMin: p.dateMin.toISOString(),
      dateMax: p.dateMax.toISOString(),
      co2AvoidedKg: p.co2AvoidedKg,
      status: p.status
    };
    if (existing) {
      existing.periods.push(periodEntry);
      existing.totalCo2 += p.co2AvoidedKg;
      existing.totalWater += p.waterSavedGallons;
      existing.totalWaste += p.wasteDivertedLbs;
    } else {
      accountCoverage.set(accId, {
        accountId: accId,
        accountName: p.account?.name ?? 'Unattached',
        venueCategory: p.account?.venueCategory ?? null,
        rspClientId: p.account?.rspClientId ?? null,
        periods: [periodEntry],
        totalCo2: p.co2AvoidedKg,
        totalWater: p.waterSavedGallons,
        totalWaste: p.wasteDivertedLbs
      });
    }
  }

  res.json({
    apiKey: {
      id: apiKey.id,
      label: apiKey.label,
      keyPrefix: apiKey.keyPrefix,
      isActive: apiKey.isActive,
      isSimulated: apiKey.isSimulated,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      org: apiKey.org
    },
    stats: {
      totalSubmissions: activity.length,
      successCount,
      errorCount,
      outcomeBreakdown,
      activeAccounts: accountCoverage.size,
      totalPeriods: periods.length
    },
    activity,
    accountCoverage: Array.from(accountCoverage.values()).sort((a, b) => b.totalCo2 - a.totalCo2)
  });
});
