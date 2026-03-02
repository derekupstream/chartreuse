import type { NextApiRequest, NextApiResponse } from 'next';

import { validateApiKey } from 'lib/rsp/apiKeyAuth';
import { calcImpact } from 'lib/rsp/impactFactors';
import prisma from 'lib/prisma';
import {
  finishComputeRun,
  getLatestPublishedSnapshotId,
  saveMetricResults,
  startComputeRun
} from 'lib/governance/computeRun';

type EventRow = {
  reusable_type: string;
  in_warehouse_events: number;
  out_warehouse_events: number;
};

type UsageBody = {
  client_id: string;
  date_min: string;
  date_max: string;
  events: EventRow[];
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

  // 4. Calculate impact per event
  const productData = events.map(e => {
    const impact = calcImpact(e.reusable_type, e.out_warehouse_events);
    return {
      reusableType: e.reusable_type,
      inWarehouseEvents: e.in_warehouse_events,
      outWarehouseEvents: e.out_warehouse_events,
      co2AvoidedKg: impact.co2AvoidedKg,
      waterSavedGallons: impact.waterSavedGallons,
      wasteDivertedLbs: impact.wasteDivertedLbs
    };
  });

  const totalCo2 = productData.reduce((s, p) => s + p.co2AvoidedKg, 0);
  const totalWater = productData.reduce((s, p) => s + p.waterSavedGallons, 0);
  const totalWaste = productData.reduce((s, p) => s + p.wasteDivertedLbs, 0);
  const totalUnits = productData.reduce((s, p) => s + p.outWarehouseEvents, 0);

  // 5. Find overlapping active periods for this client and supersede them
  const overlapping = await prisma.usageTimePeriod.findMany({
    where: {
      orgId: apiKey.orgId,
      clientExternalId: client_id,
      status: 'active',
      dateMin: { lte: dateMaxParsed },
      dateMax: { gte: dateMinParsed }
    },
    select: { id: true }
  });

  // 6. Start a ComputeRun for provenance tracking
  const snapshotId = await getLatestPublishedSnapshotId();
  const computeRunId = await startComputeRun({
    runType: 'actuals_ingest',
    orgId: apiKey.orgId,
    methodologySnapshotId: snapshotId
  });

  // 7. Create new period + products in a transaction
  const newPeriodId = crypto.randomUUID();

  try {
    await prisma.$transaction([
      // Mark overlapping periods as superseded
      ...overlapping.map(p =>
        prisma.usageTimePeriod.update({
          where: { id: p.id },
          data: { status: 'superseded', supersededById: newPeriodId }
        })
      ),
      // Create the new period
      prisma.usageTimePeriod.create({
        data: {
          id: newPeriodId,
          orgId: apiKey.orgId,
          accountId: account?.id ?? null,
          clientExternalId: client_id,
          dateMin: dateMinParsed,
          dateMax: dateMaxParsed,
          submittedByKeyId: apiKey.id,
          status: 'active',
          rawPayload: req.body,
          co2AvoidedKg: totalCo2,
          waterSavedGallons: totalWater,
          wasteDivertedLbs: totalWaste,
          products: {
            create: productData
          }
        }
      })
    ]);

    await Promise.all([
      saveMetricResults([
        {
          runId: computeRunId,
          orgId: apiKey.orgId,
          metricKey: 'co2_avoided_kg',
          valueNumeric: totalCo2,
          units: 'kg',
          methodologySnapshotId: snapshotId
        },
        {
          runId: computeRunId,
          orgId: apiKey.orgId,
          metricKey: 'water_saved_gallons',
          valueNumeric: totalWater,
          units: 'gallons',
          methodologySnapshotId: snapshotId
        },
        {
          runId: computeRunId,
          orgId: apiKey.orgId,
          metricKey: 'waste_diverted_lbs',
          valueNumeric: totalWaste,
          units: 'lbs',
          methodologySnapshotId: snapshotId
        }
      ]),
      finishComputeRun(computeRunId, 'success')
    ]);
  } catch (err: any) {
    await finishComputeRun(computeRunId, 'failed', err?.message);
    throw err;
  }

  return res.status(200).json({
    api_signature: `cr-period-${newPeriodId}`,
    status: 'accepted',
    period: {
      id: newPeriodId,
      date_min,
      date_max,
      superseded_count: overlapping.length
    },
    metrics: {
      co2_avoided_kg: Math.round(totalCo2 * 1000) / 1000,
      water_saved_gallons: Math.round(totalWater * 100) / 100,
      waste_diverted_lbs: Math.round(totalWaste * 1000) / 1000,
      single_use_equivalents: totalUnits
    }
  });
}
