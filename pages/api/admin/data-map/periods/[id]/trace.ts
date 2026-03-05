import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query;

  const period = await prisma.usageTimePeriod.findUnique({
    where: { id: id as string },
    include: {
      org: { select: { id: true, name: true } },
      submittedByKey: { select: { id: true, keyPrefix: true } },
      products: true
    }
  });

  if (!period) {
    return res.status(404).json({ error: 'Period not found' });
  }

  // Fetch the latest rsp_usage ComputeRun for this org
  const computeRunRaw = await prisma.computeRun.findFirst({
    where: { orgId: period.orgId, runType: 'rsp_usage' },
    include: {
      results: {
        select: {
          id: true,
          metricKey: true,
          valueNumeric: true,
          units: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch the superseded prior period if applicable
  let priorPeriod: {
    id: string;
    status: string;
    dateMin: string | null;
    dateMax: string | null;
    clientExternalId: string | null;
  } | null = null;

  if (period.supersededById) {
    const prior = await prisma.usageTimePeriod.findUnique({
      where: { id: period.supersededById },
      select: {
        id: true,
        status: true,
        dateMin: true,
        dateMax: true,
        clientExternalId: true
      }
    });

    if (prior) {
      priorPeriod = {
        id: prior.id,
        status: prior.status,
        dateMin: prior.dateMin ? prior.dateMin.toISOString() : null,
        dateMax: prior.dateMax ? prior.dateMax.toISOString() : null,
        clientExternalId: prior.clientExternalId ?? null
      };
    }
  }

  const computeRun = computeRunRaw
    ? {
        id: computeRunRaw.id,
        status: computeRunRaw.status,
        runType: computeRunRaw.runType,
        errorText: computeRunRaw.errorText ?? null,
        metadataJson: computeRunRaw.metadataJson,
        startedAt: computeRunRaw.startedAt ? computeRunRaw.startedAt.toISOString() : null,
        finishedAt: computeRunRaw.finishedAt ? computeRunRaw.finishedAt.toISOString() : null,
        metricResults: computeRunRaw.results.map(r => ({
          id: r.id,
          metricKey: r.metricKey,
          value: r.valueNumeric ?? null,
          units: r.units
        }))
      }
    : null;

  return res.json({
    period: {
      id: period.id,
      createdAt: period.createdAt.toISOString(),
      status: period.status,
      rawPayload: period.rawPayload,
      dateMin: period.dateMin ? period.dateMin.toISOString() : null,
      dateMax: period.dateMax ? period.dateMax.toISOString() : null,
      clientExternalId: period.clientExternalId ?? null,
      co2AvoidedKg: period.co2AvoidedKg,
      waterSavedGallons: period.waterSavedGallons,
      wasteDivertedLbs: period.wasteDivertedLbs,
      supersededById: period.supersededById ?? null,
      org: period.org,
      submittedByKey: period.submittedByKey ?? null,
      products: period.products,
      computeRun
    },
    priorPeriod
  });
});
