import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from 'lib/prisma';
import { validateApiKey } from 'lib/rsp/apiKeyAuth';
import { ingestUsagePeriod } from 'lib/rsp/ingestUsagePeriod';

type UsageBody = {
  client_id: string;
  date_min: string;
  date_max: string;
  events: { reusable_type: string; in_warehouse_events: number; out_warehouse_events: number }[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Validate API key
  const apiKey = await validateApiKey(req.headers.authorization);
  if (!apiKey) {
    return res.status(401).json({ error: 'Invalid or inactive API key' });
  }

  // 2. Validate body
  const { client_id, date_min, date_max, events } = req.body as UsageBody;

  if (!client_id || !date_min || !date_max || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'client_id, date_min, date_max, and events[] are required' });
  }

  const dateMinParsed = new Date(date_min);
  const dateMaxParsed = new Date(date_max);

  if (isNaN(dateMinParsed.getTime()) || isNaN(dateMaxParsed.getTime())) {
    return res.status(400).json({ error: 'date_min and date_max must be valid ISO dates (YYYY-MM-DD)' });
  }
  if (dateMinParsed > dateMaxParsed) {
    return res.status(400).json({ error: 'date_min must be before date_max' });
  }

  // 3. Resolve account by RSP client_id linkage
  const account = await prisma.account.findFirst({
    where: { rspOrgId: apiKey.orgId, rspClientId: client_id },
    select: { id: true }
  });

  // 4–7. Delegate pipeline to lib function
  try {
    const result = await ingestUsagePeriod({
      orgId: apiKey.orgId,
      clientId: client_id,
      dateMin: dateMinParsed,
      dateMax: dateMaxParsed,
      events,
      submittedByKeyId: apiKey.id,
      accountId: account?.id ?? null,
      rawPayload: req.body
    });

    return res.status(200).json({
      api_signature: `cr-period-${result.newPeriodId}`,
      status: 'accepted',
      period: {
        id: result.newPeriodId,
        date_min,
        date_max,
        superseded_count: result.overlappingCount
      },
      metrics: {
        co2_avoided_kg: Math.round(result.metrics.co2AvoidedKg * 1000) / 1000,
        water_saved_gallons: Math.round(result.metrics.waterSavedGallons * 100) / 100,
        waste_diverted_lbs: Math.round(result.metrics.wasteDivertedLbs * 1000) / 1000,
        single_use_equivalents: result.metrics.totalUnits
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Internal server error' });
  }
}
