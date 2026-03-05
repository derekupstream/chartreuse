import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { ingestUsagePeriod } from 'lib/rsp/ingestUsagePeriod';
import prisma from 'lib/prisma';

type EventRow = {
  reusable_type: string;
  in_warehouse_events: number;
  out_warehouse_events: number;
};

type PlaygroundRequestBody = {
  apiKeyId: string;
  mode: 'validate' | 'ingest';
  payload: {
    client_id: string;
    date_min: string;
    date_max: string;
    events: EventRow[];
  };
};

type ValidationCheck = { name: string; passed: boolean; message?: string };

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const body = req.body as PlaygroundRequestBody;

  // Top-level body check
  if (!body?.apiKeyId || !body?.mode || !body?.payload) {
    return res.status(400).json({ error: 'apiKeyId, mode, and payload are required' });
  }
  if (body.mode !== 'validate' && body.mode !== 'ingest') {
    return res.status(400).json({ error: 'mode must be validate or ingest' });
  }

  const { apiKeyId, mode, payload } = body;
  const { client_id, date_min, date_max, events } = payload ?? {};

  // Look up API key
  const key = await prisma.rspApiKey.findUnique({
    where: { id: apiKeyId },
    include: { org: true }
  });
  if (!key) return res.status(404).json({ error: 'API key not found' });
  if (!key.isActive) return res.status(400).json({ error: 'API key is not active' });
  if (key.org.orgType !== 'reuse-service-provider') {
    return res.status(400).json({ error: 'API key does not belong to a Reuse Service Provider org' });
  }

  // Build validation checks
  const dateMinParsed = new Date(date_min);
  const dateMaxParsed = new Date(date_max);

  const checks: ValidationCheck[] = [
    { name: 'client_id present', passed: typeof client_id === 'string' && client_id.trim().length > 0 },
    {
      name: 'date_min valid',
      passed: typeof date_min === 'string' && !isNaN(dateMinParsed.getTime())
    },
    {
      name: 'date_max valid',
      passed: typeof date_max === 'string' && !isNaN(dateMaxParsed.getTime())
    },
    {
      name: 'date order',
      passed: !isNaN(dateMinParsed.getTime()) && !isNaN(dateMaxParsed.getTime()) && dateMinParsed <= dateMaxParsed
    },
    {
      name: 'events non-empty',
      passed: Array.isArray(events) && events.length > 0
    }
  ];

  const valid = checks.every(c => c.passed);

  // Query overlapping periods (same query used by ingestUsagePeriod)
  let overlappingPeriodIds: string[] = [];
  let overlapCount = 0;

  if (!isNaN(dateMinParsed.getTime()) && !isNaN(dateMaxParsed.getTime()) && client_id) {
    const overlapping = await prisma.usageTimePeriod.findMany({
      where: {
        orgId: key.orgId,
        clientExternalId: client_id,
        status: 'active',
        dateMin: { lte: dateMaxParsed },
        dateMax: { gte: dateMinParsed }
      },
      select: { id: true }
    });
    overlappingPeriodIds = overlapping.map(p => p.id);
    overlapCount = overlapping.length;
  }

  if (mode === 'validate') {
    return res.json({
      mode: 'validate',
      valid,
      checks,
      overlapCount,
      overlappingPeriodIds
    });
  }

  // Ingest mode
  if (!valid) {
    return res.status(400).json({ error: 'Payload validation failed', checks });
  }

  try {
    const account = await prisma.account.findFirst({
      where: { rspOrgId: key.orgId, rspClientId: client_id },
      select: { id: true }
    });

    const result = await ingestUsagePeriod({
      orgId: key.orgId,
      clientId: client_id,
      dateMin: dateMinParsed,
      dateMax: dateMaxParsed,
      events,
      submittedByKeyId: key.id,
      accountId: account?.id ?? null,
      rawPayload: payload
    });

    return res.json({
      mode: 'ingest',
      newPeriodId: result.newPeriodId,
      overlappingCount: result.overlappingCount,
      metrics: result.metrics
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Ingest failed' });
  }
});
