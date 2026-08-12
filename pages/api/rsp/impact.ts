/**
 * The read half of the RSP API: what has all our shared data added up to?
 *
 * `POST /api/rsp/usage` returns metrics for one submission, but a partner embedding impact
 * numbers on their own website needs current totals on demand. This endpoint returns them,
 * org-wide and per client, computed from active periods only (superseded re-sends excluded).
 *
 * Same Bearer authentication as the intake. Note for partners: calls belong on their server,
 * not in browser JavaScript — the key also grants write access to the intake endpoint.
 */
import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from 'lib/prisma';
import { logRspActivity } from 'lib/rsp/activityLogger';
import { validateApiKey } from 'lib/rsp/apiKeyAuth';

const ENDPOINT = 'GET /api/rsp/impact';

type ClientImpact = {
  client_id: string | null;
  client_name: string;
  period_count: number;
  coverage_start: string | null;
  coverage_end: string | null;
  co2_avoided_kg: number;
  water_saved_gallons: number;
  waste_diverted_lbs: number;
  single_use_equivalents: number;
};

const round3 = (n: number) => Math.round(n * 1000) / 1000;
const round2 = (n: number) => Math.round(n * 100) / 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startedAt = Date.now();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = await validateApiKey(req.headers.authorization);
  if (!apiKey) {
    await logRspActivity({
      endpoint: ENDPOINT,
      httpStatus: 401,
      outcome: 'auth_failed',
      errorMessage: 'Invalid or inactive API key',
      latencyMs: Date.now() - startedAt,
      clientIp: null
    });
    return res.status(401).json({ error: 'Invalid or inactive API key' });
  }

  const clientIdFilter = typeof req.query.client_id === 'string' ? req.query.client_id : null;

  const accounts = await prisma.account.findMany({
    where: {
      rspOrgId: apiKey.orgId,
      ...(clientIdFilter ? { rspClientId: clientIdFilter } : {})
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, rspClientId: true }
  });

  if (clientIdFilter && accounts.length === 0) {
    return res.status(404).json({ error: `No client with client_id "${clientIdFilter}"` });
  }

  const periods = await prisma.usageTimePeriod.findMany({
    where: { orgId: apiKey.orgId, status: 'active', accountId: { in: accounts.map(a => a.id) } },
    select: {
      accountId: true,
      dateMin: true,
      dateMax: true,
      co2AvoidedKg: true,
      waterSavedGallons: true,
      wasteDivertedLbs: true,
      products: { select: { outWarehouseEvents: true } }
    }
  });

  const clients: ClientImpact[] = accounts.map(account => {
    const own = periods.filter(p => p.accountId === account.id);
    const start = own.reduce<Date | null>((e, p) => (!e || p.dateMin < e ? p.dateMin : e), null);
    const end = own.reduce<Date | null>((l, p) => (!l || p.dateMax > l ? p.dateMax : l), null);
    return {
      client_id: account.rspClientId,
      client_name: account.name,
      period_count: own.length,
      coverage_start: start?.toISOString().slice(0, 10) ?? null,
      coverage_end: end?.toISOString().slice(0, 10) ?? null,
      co2_avoided_kg: round3(own.reduce((s, p) => s + p.co2AvoidedKg, 0)),
      water_saved_gallons: round2(own.reduce((s, p) => s + p.waterSavedGallons, 0)),
      waste_diverted_lbs: round3(own.reduce((s, p) => s + p.wasteDivertedLbs, 0)),
      single_use_equivalents: own.reduce((s, p) => s + p.products.reduce((ps, pr) => ps + pr.outWarehouseEvents, 0), 0)
    };
  });

  const body = {
    totals: {
      co2_avoided_kg: round3(clients.reduce((s, c) => s + c.co2_avoided_kg, 0)),
      water_saved_gallons: round2(clients.reduce((s, c) => s + c.water_saved_gallons, 0)),
      waste_diverted_lbs: round3(clients.reduce((s, c) => s + c.waste_diverted_lbs, 0)),
      single_use_equivalents: clients.reduce((s, c) => s + c.single_use_equivalents, 0),
      period_count: periods.length,
      client_count: clients.length
    },
    clients
  };

  await logRspActivity({
    apiKeyId: apiKey.id,
    orgId: apiKey.orgId,
    endpoint: ENDPOINT,
    httpStatus: 200,
    outcome: 'success',
    latencyMs: Date.now() - startedAt,
    requestSummary: { clientIdFilter },
    responseSummary: { totals: body.totals },
    clientIp: null
  });

  return res.status(200).json(body);
}
