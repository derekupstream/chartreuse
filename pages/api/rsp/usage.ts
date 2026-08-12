import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from 'lib/prisma';
import { logRspActivity } from 'lib/rsp/activityLogger';
import { validateApiKey } from 'lib/rsp/apiKeyAuth';
import { calcImpact } from 'lib/rsp/impactFactors';
import { ingestUsagePeriod } from 'lib/rsp/ingestUsagePeriod';
import { collectPayloadWarnings } from 'lib/rsp/payloadWarnings';

type UsageBody = {
  client_id: string;
  /** Human-readable customer name, used when a first submission creates the client's account */
  client_name?: string;
  date_min: string;
  date_max: string;
  events: { reusable_type: string; in_warehouse_events: number; out_warehouse_events: number }[];
  /** When true, validate and price the payload but store nothing. For integration testing. */
  dry_run?: boolean;
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
  const { client_id, client_name, date_min, date_max, events, dry_run } = req.body as UsageBody;
  const dryRun = dry_run === true || req.query.dry_run === 'true';

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

  // Each event must be shaped correctly — otherwise pricing it throws a 500 rather than
  // telling the partner which entry is wrong.
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (!event || typeof event.reusable_type !== 'string' || event.reusable_type.trim() === '') {
      return fail(`events[${i}].reusable_type must be a non-empty string`, 'invalid_event_type');
    }
    if (!Number.isFinite(event.in_warehouse_events) || !Number.isFinite(event.out_warehouse_events)) {
      return fail(
        `events[${i}] must have numeric in_warehouse_events and out_warehouse_events`,
        'invalid_event_counts'
      );
    }
    if (event.in_warehouse_events < 0 || event.out_warehouse_events < 0) {
      return fail(`events[${i}] event counts cannot be negative`, 'negative_event_counts');
    }
  }

  // 3. Resolve account by RSP client_id linkage
  let account = await prisma.account.findFirst({
    where: { rspOrgId: apiKey.orgId, rspClientId: client_id },
    select: { id: true }
  });

  // Problems worth reporting back but not worth rejecting the payload over.
  const warnings = collectPayloadWarnings({ clientId: client_id, events, accountId: account?.id ?? null });

  // A dry run prices the payload exactly as ingestion would, but writes nothing — it lets a
  // partner prove their integration works before any real data lands.
  if (dryRun) {
    const priced = events.map(event => calcImpact(event.reusable_type, event.out_warehouse_events));
    const dryRunBody = {
      status: 'validated' as const,
      dry_run: true,
      period: { date_min, date_max, account_linked: !!account },
      metrics: {
        co2_avoided_kg: Math.round(priced.reduce((sum, p) => sum + p.co2AvoidedKg, 0) * 1000) / 1000,
        water_saved_gallons: Math.round(priced.reduce((sum, p) => sum + p.waterSavedGallons, 0) * 100) / 100,
        waste_diverted_lbs: Math.round(priced.reduce((sum, p) => sum + p.wasteDivertedLbs, 0) * 1000) / 1000,
        single_use_equivalents: events.reduce((sum, event) => sum + event.out_warehouse_events, 0)
      },
      warnings
    };

    await logRspActivity({
      apiKeyId: apiKey.id,
      orgId: apiKey.orgId,
      endpoint: ENDPOINT,
      httpStatus: 200,
      outcome: 'dry_run',
      latencyMs: Date.now() - startedAt,
      requestSummary: { client_id, date_min, date_max, eventCount: events.length, dryRun: true },
      responseSummary: { metrics: dryRunBody.metrics, warnings: warnings.map(w => w.code) },
      clientIp: ip
    });

    return res.status(200).json(dryRunBody);
  }

  // A first-time client_id creates the customer's account, so an RSP onboards clients through
  // the API itself instead of waiting on a manual linking step. The account lives under the
  // RSP's own org until the customer claims it; only this RSP's submissions route to it.
  let accountCreated = false;
  if (!account) {
    account = await prisma.account.create({
      data: {
        orgId: apiKey.orgId,
        name: client_name?.trim() || client_id,
        accountContactEmail: '',
        rspOrgId: apiKey.orgId,
        rspClientId: client_id
      },
      select: { id: true }
    });
    accountCreated = true;
    // The unlinked warning no longer applies — the data now has somewhere to land.
    const unlinkedIndex = warnings.findIndex(w => w.code === 'unlinked_client_id');
    if (unlinkedIndex !== -1) warnings.splice(unlinkedIndex, 1);
    warnings.push({
      code: 'client_account_created',
      message:
        `A new account "${client_name?.trim() || client_id}" was created for client_id "${client_id}". ` +
        `If this customer already exists in Chart-Reuse, ask Upstream to merge or re-link it.`,
      details: { clientId: client_id, accountId: account.id }
    });
  }

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
        superseded_count: result.overlappingCount,
        account_created: accountCreated
      },
      metrics: {
        co2_avoided_kg: Math.round(result.metrics.co2AvoidedKg * 1000) / 1000,
        water_saved_gallons: Math.round(result.metrics.waterSavedGallons * 100) / 100,
        waste_diverted_lbs: Math.round(result.metrics.wasteDivertedLbs * 1000) / 1000,
        single_use_equivalents: result.metrics.totalUnits
      },
      warnings
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
        metrics: responseBody.metrics,
        warnings: warnings.map(w => w.code)
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
