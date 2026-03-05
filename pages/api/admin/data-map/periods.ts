import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

const UUID_REGEX = /^[0-9a-f-]{36}$/i;

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  // Parse pagination params
  const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt((req.query.pageSize as string) ?? '20', 10) || 20));

  // Parse filter params
  const search = (req.query.search as string) ?? '';
  const rspOrgId = (req.query.rspOrgId as string) ?? '';
  const status = (req.query.status as string) ?? '';
  const dateFrom = (req.query.dateFrom as string) ?? '';
  const dateTo = (req.query.dateTo as string) ?? '';
  const computeStatus = (req.query.computeStatus as string) ?? '';

  // Build where clause
  const where: Record<string, unknown> = {};

  if (rspOrgId) {
    where.orgId = rspOrgId;
  }

  if (status) {
    where.status = status;
  }

  if (dateFrom) {
    where.dateMin = { gte: new Date(dateFrom) };
  }

  if (dateTo) {
    where.dateMax = { lte: new Date(dateTo) };
  }

  // Build search OR clause
  if (search) {
    const orClauses: Record<string, unknown>[] = [
      { org: { name: { contains: search, mode: 'insensitive' } } },
      { clientExternalId: { contains: search, mode: 'insensitive' } }
    ];

    if (UUID_REGEX.test(search)) {
      orClauses.push({ id: search });
      orClauses.push({ submittedByKeyId: search });
    }

    where.OR = orClauses;
  }

  // computeStatus filter requires a subquery via orgIds since there is no direct
  // ComputeRun relation on UsageTimePeriod — filter by orgs that have matching runs
  if (computeStatus) {
    const matchingOrgIds = await prisma.computeRun.findMany({
      where: { status: computeStatus, runType: 'rsp_usage' },
      select: { orgId: true },
      distinct: ['orgId']
    });
    const orgIds = matchingOrgIds.map(r => r.orgId).filter(Boolean) as string[];
    where.orgId = orgIds.length > 0 ? { in: orgIds } : { in: [] };
  }

  const [rawPeriods, total] = await Promise.all([
    prisma.usageTimePeriod.findMany({
      where,
      include: {
        org: { select: { id: true, name: true } },
        submittedByKey: { select: { id: true, keyPrefix: true } },
        products: { select: { id: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.usageTimePeriod.count({ where })
  ]);

  // Fetch latest compute run per org for the returned periods
  const periodOrgIds = Array.from(new Set(rawPeriods.map(p => p.orgId)));
  const latestRunsByOrg: Record<string, { id: string; status: string; runType: string } | null> = {};

  if (periodOrgIds.length > 0) {
    const runs = await prisma.computeRun.findMany({
      where: { orgId: { in: periodOrgIds }, runType: 'rsp_usage' },
      select: { id: true, status: true, runType: true, orgId: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    for (const orgId of periodOrgIds) {
      const orgRun = runs.find(r => r.orgId === orgId);
      latestRunsByOrg[orgId] = orgRun ? { id: orgRun.id, status: orgRun.status, runType: orgRun.runType } : null;
    }
  }

  const periods = rawPeriods.map(p => ({
    id: p.id,
    createdAt: p.createdAt.toISOString(),
    status: p.status,
    dateMin: p.dateMin ? p.dateMin.toISOString() : null,
    dateMax: p.dateMax ? p.dateMax.toISOString() : null,
    clientExternalId: p.clientExternalId ?? null,
    co2AvoidedKg: p.co2AvoidedKg,
    waterSavedGallons: p.waterSavedGallons,
    wasteDivertedLbs: p.wasteDivertedLbs,
    supersededById: p.supersededById ?? null,
    productCount: p.products.length,
    org: p.org,
    submittedByKey: p.submittedByKey ?? null,
    latestComputeRun: latestRunsByOrg[p.orgId] ?? null
  }));

  return res.json({ periods, total, page, pageSize });
});
