import prisma from 'lib/prisma';
import { logRspActivity } from 'lib/rsp/activityLogger';
import { generateApiKey } from 'lib/rsp/apiKeyAuth';
import { ingestUsagePeriod } from 'lib/rsp/ingestUsagePeriod';

import { VENUE_CATEGORIES } from 'lib/calculator/constants/venue-categories';

const ENDPOINT = 'POST /api/rsp/usage';

// ─── RSP creation ───────────────────────────────────────────────────────────

export type RspProfile = {
  washFacilityType?: 'commercial_dishwasher' | 'industrial' | 'manual';
  washEnergySource?: 'grid_electric' | 'natural_gas' | 'solar' | 'hydro' | 'wind';
  country?: string;
  city?: string;
};

export async function createSimulatedRspOrg(name: string, profile: RspProfile = {}): Promise<{ orgId: string }> {
  const org = await prisma.org.create({
    data: {
      name,
      orgType: 'reuse-service-provider',
      country: profile.country ?? 'United States',
      city: profile.city ?? null,
      metadata: {
        simulated: true,
        wash: {
          facility: profile.washFacilityType ?? 'commercial_dishwasher',
          energy: profile.washEnergySource ?? 'grid_electric'
        }
      }
    }
  });
  return { orgId: org.id };
}

// ─── API key ────────────────────────────────────────────────────────────────

export type CreateApiKeyOptions = {
  label?: string;
  misconfig?: 'none' | 'expired' | 'inactive';
};

export async function createSimulatedApiKey(
  orgId: string,
  options: CreateApiKeyOptions = {}
): Promise<{ apiKeyId: string; rawKey: string; keyPrefix: string }> {
  const { raw, hash, prefix } = generateApiKey();
  const expiresAt = options.misconfig === 'expired' ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null;
  const isActive = options.misconfig !== 'inactive';
  const apiKey = await prisma.rspApiKey.create({
    data: {
      orgId,
      label: options.label ?? `Simulated key ${new Date().toISOString().slice(0, 10)}`,
      keyHash: hash,
      keyPrefix: prefix,
      expiresAt,
      isActive,
      isSimulated: true
    }
  });
  return { apiKeyId: apiKey.id, rawKey: raw, keyPrefix: prefix };
}

// ─── Client accounts (the RSP's customers) ──────────────────────────────────

const SAMPLE_VENUE_NAMES: Record<string, string[]> = {
  'K-12 School': ['Lincoln Elementary', 'Madison High', 'Roosevelt Middle School'],
  'University / College': ['Pacific State University', 'Hilltop College', 'Riverside Tech'],
  'Corporate Office': ['Bay Area Tech HQ', 'Northstar Logistics', 'Vanguard Analytics'],
  Cafe: ['Sunrise Cafe', 'Bluebird Roasters', 'Daily Grind'],
  'Coffee Shop': ['Northwoods Coffee', 'Bay Espresso', 'Compass Coffee'],
  Stadium: ['Riverfront Arena', 'Skyline Stadium', 'Northpark Field'],
  'Festival / Event Venue': ['Harborside Festival Grounds', 'Riverwalk Plaza'],
  'Food Hall': ['Market Hall', 'The Commons', 'East Pavilion']
};

export async function createSimulatedClientAccount(opts: {
  rspOrgId: string;
  name?: string;
  venueCategory?: string;
  rspClientId?: string;
  state?: string;
}): Promise<{ accountId: string; rspClientId: string }> {
  const venueCategory = opts.venueCategory ?? VENUE_CATEGORIES[Math.floor(Math.random() * VENUE_CATEGORIES.length)];
  const sampleNames = SAMPLE_VENUE_NAMES[venueCategory] ?? [`${venueCategory} Site`];
  const name = opts.name ?? sampleNames[Math.floor(Math.random() * sampleNames.length)];
  const rspClientId = opts.rspClientId ?? `client-${Math.random().toString(36).slice(2, 8)}`;
  const account = await prisma.account.create({
    data: {
      orgId: opts.rspOrgId,
      name,
      accountContactEmail: `${rspClientId}@simulated.local`,
      USState: opts.state ?? 'California',
      rspOrgId: opts.rspOrgId,
      rspClientId,
      venueCategory
    }
  });
  return { accountId: account.id, rspClientId };
}

// ─── Submission generator ───────────────────────────────────────────────────

export type ErrorMode =
  | 'success'
  | 'auth_invalid_key'
  | 'validation_missing_fields'
  | 'validation_inverted_dates'
  | 'server_error_no_events';

export type SimulateSubmissionParams = {
  apiKeyId: string;
  rspOrgId: string;
  rspClientId: string;
  accountId: string;
  dateMin: Date;
  dateMax: Date;
  reusableMix?: Array<{ reusable_type: string; in: number; out: number }>;
  errorMode?: ErrorMode;
  /** Override createdAt on the activity log row — useful for backfilling history */
  occurredAt?: Date;
};

const DEFAULT_REUSABLE_MIX = [
  { reusable_type: 'cup', in: 980, out: 1000 },
  { reusable_type: 'container', in: 580, out: 600 }
];

export async function simulateSubmission(params: SimulateSubmissionParams): Promise<void> {
  const occurredAt = params.occurredAt ?? new Date();
  const mode = params.errorMode ?? 'success';
  const events = (params.reusableMix ?? DEFAULT_REUSABLE_MIX).map(e => ({
    reusable_type: e.reusable_type,
    in_warehouse_events: e.in,
    out_warehouse_events: e.out
  }));

  const baseRequest = {
    client_id: params.rspClientId,
    date_min: params.dateMin.toISOString().slice(0, 10),
    date_max: params.dateMax.toISOString().slice(0, 10),
    events
  };

  if (mode === 'auth_invalid_key') {
    await prisma.rspApiActivityLog.create({
      data: {
        createdAt: occurredAt,
        apiKeyId: null,
        orgId: params.rspOrgId,
        endpoint: ENDPOINT,
        httpStatus: 401,
        outcome: 'auth_failed',
        errorMessage: 'Invalid or inactive API key',
        latencyMs: 8,
        requestSummary: { headerAuthPresent: true } as any
      }
    });
    return;
  }

  if (mode === 'validation_missing_fields') {
    await prisma.rspApiActivityLog.create({
      data: {
        createdAt: occurredAt,
        apiKeyId: params.apiKeyId,
        orgId: params.rspOrgId,
        endpoint: ENDPOINT,
        httpStatus: 400,
        outcome: 'validation_failed',
        errorMessage: 'client_id, date_min, date_max, and events[] are required',
        errorCode: 'missing_fields',
        latencyMs: 12,
        requestSummary: { ...baseRequest, client_id: undefined, eventCount: events.length } as any
      }
    });
    return;
  }

  if (mode === 'validation_inverted_dates') {
    await prisma.rspApiActivityLog.create({
      data: {
        createdAt: occurredAt,
        apiKeyId: params.apiKeyId,
        orgId: params.rspOrgId,
        endpoint: ENDPOINT,
        httpStatus: 400,
        outcome: 'validation_failed',
        errorMessage: 'date_min must be before date_max',
        errorCode: 'inverted_date_range',
        latencyMs: 11,
        requestSummary: { ...baseRequest, date_min: baseRequest.date_max, date_max: baseRequest.date_min } as any
      }
    });
    return;
  }

  if (mode === 'server_error_no_events') {
    await prisma.rspApiActivityLog.create({
      data: {
        createdAt: occurredAt,
        apiKeyId: params.apiKeyId,
        orgId: params.rspOrgId,
        endpoint: ENDPOINT,
        httpStatus: 500,
        outcome: 'server_error',
        errorMessage: 'Failed to ingest period: at least one event row required',
        latencyMs: 47,
        requestSummary: { ...baseRequest, eventCount: 0 } as any
      }
    });
    return;
  }

  // mode === 'success' — actually run ingestion
  const start = Date.now();
  try {
    const result = await ingestUsagePeriod({
      orgId: params.rspOrgId,
      clientId: params.rspClientId,
      dateMin: params.dateMin,
      dateMax: params.dateMax,
      events,
      submittedByKeyId: params.apiKeyId,
      accountId: params.accountId,
      rawPayload: baseRequest
    });
    await prisma.rspApiActivityLog.create({
      data: {
        createdAt: occurredAt,
        apiKeyId: params.apiKeyId,
        orgId: params.rspOrgId,
        endpoint: ENDPOINT,
        httpStatus: 200,
        outcome: 'success',
        latencyMs: Date.now() - start,
        requestSummary: { ...baseRequest, eventCount: events.length, accountId: params.accountId } as any,
        responseSummary: {
          newPeriodId: result.newPeriodId,
          supersededCount: result.overlappingCount,
          metrics: {
            co2AvoidedKg: result.metrics.co2AvoidedKg,
            waterSavedGallons: result.metrics.waterSavedGallons,
            wasteDivertedLbs: result.metrics.wasteDivertedLbs,
            totalUnits: result.metrics.totalUnits
          }
        } as any
      }
    });
  } catch (err: any) {
    await logRspActivity({
      apiKeyId: params.apiKeyId,
      orgId: params.rspOrgId,
      endpoint: ENDPOINT,
      httpStatus: 500,
      outcome: 'server_error',
      errorMessage: err?.message ?? 'Ingest failed',
      latencyMs: Date.now() - start,
      requestSummary: baseRequest
    });
  }
}

// ─── Burst generator ────────────────────────────────────────────────────────

export type GenerateBurstParams = {
  apiKeyId: string;
  rspOrgId: string;
  accounts: Array<{ accountId: string; rspClientId: string }>;
  /** Number of submissions per account */
  submissionsPerAccount: number;
  /** Period covered: weekly | monthly. Each submission covers 1 unit. */
  granularity?: 'weekly' | 'monthly';
  /** Start date (most recent period covers up to today) */
  startDate?: Date;
  /** Fraction of submissions that should fail (0-1). Distribution: 30% auth, 30% validation, 40% server */
  errorRate?: number;
};

export async function generateBurst(params: GenerateBurstParams): Promise<{
  totalSubmissions: number;
  successCount: number;
  errorCount: number;
}> {
  const granularity = params.granularity ?? 'monthly';
  const startDate = params.startDate ?? new Date();
  const errorRate = params.errorRate ?? 0;
  const submissionsPerAccount = params.submissionsPerAccount;

  const errorModes: ErrorMode[] = [
    'auth_invalid_key',
    'validation_missing_fields',
    'validation_inverted_dates',
    'server_error_no_events'
  ];

  let success = 0;
  let errors = 0;

  for (const account of params.accounts) {
    for (let i = 0; i < submissionsPerAccount; i++) {
      const offsetUnits = submissionsPerAccount - 1 - i; // i=0 -> oldest; latest is now
      const dateMax = new Date(startDate);
      const dateMin = new Date(startDate);
      if (granularity === 'monthly') {
        dateMax.setMonth(dateMax.getMonth() - offsetUnits);
        dateMin.setMonth(dateMin.getMonth() - offsetUnits - 1);
      } else {
        dateMax.setDate(dateMax.getDate() - offsetUnits * 7);
        dateMin.setDate(dateMin.getDate() - (offsetUnits + 1) * 7);
      }

      const isError = Math.random() < errorRate;
      const errorMode: ErrorMode = isError ? errorModes[Math.floor(Math.random() * errorModes.length)] : 'success';

      // Vary the volume so different periods don't look identical
      const scale = 0.7 + Math.random() * 0.6;
      const reusableMix = [
        { reusable_type: 'cup', in: Math.round(980 * scale), out: Math.round(1000 * scale) },
        { reusable_type: 'container', in: Math.round(580 * scale), out: Math.round(600 * scale) },
        { reusable_type: 'bowl', in: Math.round(290 * scale), out: Math.round(300 * scale) }
      ];

      // Stagger the activity log timestamps across the period range so the feed shows movement
      const occurredAt = new Date(dateMax);
      occurredAt.setHours(occurredAt.getHours() + Math.floor(Math.random() * 24));

      await simulateSubmission({
        apiKeyId: params.apiKeyId,
        rspOrgId: params.rspOrgId,
        rspClientId: account.rspClientId,
        accountId: account.accountId,
        dateMin,
        dateMax,
        reusableMix,
        errorMode,
        occurredAt
      });

      if (isError) errors++;
      else success++;
    }
  }

  return { totalSubmissions: success + errors, successCount: success, errorCount: errors };
}
