import crypto from 'crypto';

import {
  finishComputeRun,
  getLatestPublishedSnapshotId,
  saveMetricResults,
  startComputeRun
} from 'lib/governance/computeRun';
import prisma from 'lib/prisma';
import { calcImpact } from 'lib/rsp/impactFactors';

export type EventRow = {
  reusable_type: string;
  in_warehouse_events: number;
  out_warehouse_events: number;
};

export type IngestParams = {
  orgId: string;
  clientId: string;
  dateMin: Date;
  dateMax: Date;
  events: EventRow[];
  submittedByKeyId: string;
  accountId: string | null;
  rawPayload: unknown;
};

export type IngestResult = {
  newPeriodId: string;
  overlappingCount: number;
  metrics: {
    co2AvoidedKg: number;
    waterSavedGallons: number;
    wasteDivertedLbs: number;
    totalUnits: number;
  };
};

export async function ingestUsagePeriod(params: IngestParams): Promise<IngestResult> {
  const { orgId, clientId, dateMin, dateMax, events, submittedByKeyId, accountId, rawPayload } = params;

  // Step 4: Calculate impact per event → build productData array
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

  const co2AvoidedKg = productData.reduce((s, p) => s + p.co2AvoidedKg, 0);
  const waterSavedGallons = productData.reduce((s, p) => s + p.waterSavedGallons, 0);
  const wasteDivertedLbs = productData.reduce((s, p) => s + p.wasteDivertedLbs, 0);
  const totalUnits = productData.reduce((s, p) => s + p.outWarehouseEvents, 0);

  // Step 5: Find overlapping active periods for this client
  const overlapping = await prisma.usageTimePeriod.findMany({
    where: {
      orgId,
      clientExternalId: clientId,
      status: 'active',
      dateMin: { lte: dateMax },
      dateMax: { gte: dateMin }
    },
    select: { id: true }
  });

  // Step 6: Start a ComputeRun for provenance tracking
  const snapshotId = await getLatestPublishedSnapshotId();
  const computeRunId = await startComputeRun({
    runType: 'actuals_ingest',
    orgId,
    methodologySnapshotId: snapshotId
  });

  // Step 7: Create new period + products in a transaction; save metric results
  const newPeriodId = crypto.randomUUID();

  try {
    await prisma.$transaction([
      // Create the new period FIRST so the FK from supersededById is satisfied
      prisma.usageTimePeriod.create({
        data: {
          id: newPeriodId,
          orgId,
          accountId,
          clientExternalId: clientId,
          dateMin,
          dateMax,
          submittedByKeyId,
          status: 'active',
          rawPayload: rawPayload as any,
          co2AvoidedKg,
          waterSavedGallons,
          wasteDivertedLbs,
          products: {
            create: productData
          }
        }
      }),
      // THEN mark overlapping periods as superseded (FK now satisfied)
      ...overlapping.map(p =>
        prisma.usageTimePeriod.update({
          where: { id: p.id },
          data: { status: 'superseded', supersededById: newPeriodId }
        })
      )
    ]);

    await Promise.all([
      saveMetricResults([
        {
          runId: computeRunId,
          orgId,
          metricKey: 'co2_avoided_kg',
          valueNumeric: co2AvoidedKg,
          units: 'kg',
          methodologySnapshotId: snapshotId
        },
        {
          runId: computeRunId,
          orgId,
          metricKey: 'water_saved_gallons',
          valueNumeric: waterSavedGallons,
          units: 'gallons',
          methodologySnapshotId: snapshotId
        },
        {
          runId: computeRunId,
          orgId,
          metricKey: 'waste_diverted_lbs',
          valueNumeric: wasteDivertedLbs,
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

  return {
    newPeriodId,
    overlappingCount: overlapping.length,
    metrics: { co2AvoidedKg, waterSavedGallons, wasteDivertedLbs, totalUnits }
  };
}
