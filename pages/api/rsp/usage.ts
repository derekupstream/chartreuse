import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from 'lib/prisma';
import { logRspActivity } from 'lib/rsp/activityLogger';
import { validateApiKey } from 'lib/rsp/apiKeyAuth';
import { ingestUsagePeriod } from 'lib/rsp/ingestUsagePeriod';

type UsageBody = {
  client_id: string;
  date_min: string;
  date_max: string;
  events: { reusable_type: string; in_warehouse_events: number; out_warehouse_events: number }[];
};

const ENDPOINT = 'POST /api/rsp/usage';

function clientIp(req: NextApiRequest): string | null {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string') return xf.split(',')[0].trim();
  if (Array.isArray(xf) && xf.length) return xf[0];
  return req.socket?.remoteAddress ?? null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startedAt = Date.now();
  const ip = clientIp(req);

  if (req.method !== 'POST') {
    await logRspActivity({
      endpoint: ENDPOINT,
      httpStatus: 405,
      outcome: 'method_not_allowed',
      errorMessage: `Method ${req.method} not allowed`,
      latencyMs: Date.now() - startedAt,
      clientIp: ip
    });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Validate API key
  const apiKey = await validateApiKey(req.headers.authorization);
  if (!apiKey) {
    await logRspActivity({
      endpoint: ENDPOINT,
      httpStatus: 401,
      outcome: 'auth_failed',
      errorMessage: 'Invalid or inactive API key',
      latencyMs: Date.now() - startedAt,
      requestSummary: { headerAuthPresent: !!req.headers.authorization },
      clientIp: ip
    });
    return res.status(401).json({ error: 'Invalid or inactive API key' });
  }

  // 2. Validate body
  const { client_id, date_min, date_max, events } = req.body as UsageBody;

  const fail = async (msg: string, code: string) => {
    await logRspActivity({
      apiKeyId: apiKey.id,
      orgId: apiKey.orgId,
      endpoint: ENDPOINT,
      httpStatus: 400,
      outcome: 'validation_failed',
      errorMessage: msg,
      errorCode: code,
      latencyMs: Date.now() - startedAt,
      requestSummary: { client_id, date_min, date_max, eventCount: Array.isArray(events) ? events.length : 0 },
      clientIp: ip
    });
    return res.status(400).json({ error: msg });
  };

  if (!client_id || !date_min || !date_max || !Array.isArray(events) || events.length === 0) {
    return fail('client_id, date_min, date_max, and events[] are required', 'missing_fields');
  }

  const dateMinParsed = new Date(date_min);
  const dateMaxParsed = new Date(date_max);

  if (isNaN(dateMinParsed.getTime()) || isNaN(dateMaxParsed.getTime())) {
    return fail('date_min and date_max must be valid ISO dates (YYYY-MM-DD)', 'invalid_dates');
  }
  if (dateMinParsed > dateMaxParsed) {
    return fail('date_min must be before date_max', 'inverted_date_range');
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

    const responseBody = {
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
    };

    await logRspActivity({
      apiKeyId: apiKey.id,
      orgId: apiKey.orgId,
      endpoint: ENDPOINT,
      httpStatus: 200,
      outcome: 'success',
      latencyMs: Date.now() - startedAt,
      requestSummary: { client_id, date_min, date_max, eventCount: events.length, accountId: account?.id ?? null },
      responseSummary: {
        newPeriodId: result.newPeriodId,
        supersededCount: result.overlappingCount,
        metrics: responseBody.metrics
      },
      clientIp: ip
    });

    return res.status(200).json(responseBody);
  } catch (err: any) {
    await logRspActivity({
      apiKeyId: apiKey.id,
      orgId: apiKey.orgId,
      endpoint: ENDPOINT,
      httpStatus: 500,
      outcome: 'server_error',
      errorMessage: err?.message ?? 'Internal server error',
      latencyMs: Date.now() - startedAt,
      requestSummary: { client_id, date_min, date_max, eventCount: events.length },
      clientIp: ip
    });
    return res.status(500).json({ error: err?.message ?? 'Internal server error' });
  }
}
