/**
 * Seed script: creates a Sharewares RSP org, 5 client accounts, and 20 API calls
 * simulating how Sharewares would submit reusable cup usage data.
 *
 * Each client uses different cup types (material varies by venue):
 *   - Portland State University: Polypropylene cups (budget-friendly campus)
 *   - Moda Center Arena: Aluminum cups (stadium/event venue)
 *   - OHSU Medical Center: Stainless Steel cups (healthcare, durable)
 *   - Nike World HQ: SAN Plastic cups (corporate campus)
 *   - Portland Saturday Market: Glass cups (farmers market / eco-forward)
 *
 * 20 calls = 2 date ranges per client × 2 calls per range (2nd supersedes 1st)
 *
 * Run with: npx tsx scripts/seed-sharewares-test.ts
 * Re-run safely: deletes existing seed data first.
 */

import { PrismaClient } from '@prisma/client';
import { ingestUsagePeriod } from 'lib/rsp/ingestUsagePeriod';
import { generateApiKey } from 'lib/rsp/apiKeyAuth';

const prisma = new PrismaClient();

const RSP_ORG_NAME = 'Sharewares (Seed)';

const CLIENTS = [
  {
    id: 'sw-portland-state',
    name: 'Portland State University',
    cupNote: 'Polypropylene cups (8/12/16 oz)',
    email: 'events@pdx.edu',
    state: 'Oregon'
  },
  {
    id: 'sw-moda-center',
    name: 'Moda Center Arena',
    cupNote: 'Aluminum cups (12/16 oz)',
    email: 'ops@modacenter.com',
    state: 'Oregon'
  },
  {
    id: 'sw-ohsu-medical',
    name: 'OHSU Medical Center',
    cupNote: 'Stainless Steel cups (8/12 oz)',
    email: 'facilities@ohsu.edu',
    state: 'Oregon'
  },
  {
    id: 'sw-nike-whq',
    name: 'Nike World Headquarters',
    cupNote: 'SAN Plastic cups (12/16 oz)',
    email: 'sustainability@nike.com',
    state: 'Oregon'
  },
  {
    id: 'sw-saturday-market',
    name: 'Portland Saturday Market',
    cupNote: 'Glass cups (8/12 oz)',
    email: 'vendor@portlandsaturdaymarket.com',
    state: 'Oregon'
  }
];

// Each client gets 2 date ranges (Jan 1-15 and Jan 10-31, 2026)
// with 2 calls per range (initial + correction that supersedes)
// This creates overlapping ranges to test the supersession logic
const DATE_RANGES = [
  { dateMin: '2026-01-01', dateMax: '2026-01-15', label: 'early Jan' },
  { dateMin: '2026-01-10', dateMax: '2026-01-31', label: 'mid-late Jan' }
];

// Volume profiles per client — initial call vs corrected call (slightly different numbers)
type CallProfile = {
  events: { reusable_type: string; out_warehouse_events: number; in_warehouse_events: number }[];
};

function getCallProfiles(clientId: string, rangeIdx: number): [CallProfile, CallProfile] {
  const base = rangeIdx === 0 ? 1.0 : 1.3; // second range is busier

  switch (clientId) {
    case 'sw-portland-state':
      // Polypropylene cups — campus dining, high volume
      return [
        {
          events: [
            { reusable_type: 'cup', out_warehouse_events: Math.round(800 * base), in_warehouse_events: Math.round(760 * base) },
            { reusable_type: 'cup', out_warehouse_events: Math.round(600 * base), in_warehouse_events: Math.round(570 * base) },
            { reusable_type: 'cup', out_warehouse_events: Math.round(400 * base), in_warehouse_events: Math.round(380 * base) }
          ]
        },
        {
          // Correction: slightly higher numbers after reconciliation
          events: [
            { reusable_type: 'cup', out_warehouse_events: Math.round(830 * base), in_warehouse_events: Math.round(790 * base) },
            { reusable_type: 'cup', out_warehouse_events: Math.round(620 * base), in_warehouse_events: Math.round(590 * base) },
            { reusable_type: 'cup', out_warehouse_events: Math.round(415 * base), in_warehouse_events: Math.round(395 * base) }
          ]
        }
      ];

    case 'sw-moda-center':
      // Aluminum cups — event venue, very high spikes
      return [
        {
          events: [
            { reusable_type: 'cup', out_warehouse_events: Math.round(3000 * base), in_warehouse_events: Math.round(2850 * base) },
            { reusable_type: 'cup', out_warehouse_events: Math.round(2500 * base), in_warehouse_events: Math.round(2375 * base) }
          ]
        },
        {
          events: [
            { reusable_type: 'cup', out_warehouse_events: Math.round(3100 * base), in_warehouse_events: Math.round(2945 * base) },
            { reusable_type: 'cup', out_warehouse_events: Math.round(2600 * base), in_warehouse_events: Math.round(2470 * base) }
          ]
        }
      ];

    case 'sw-ohsu-medical':
      // Stainless Steel cups — steady hospital cafeteria usage
      return [
        {
          events: [
            { reusable_type: 'cup', out_warehouse_events: Math.round(500 * base), in_warehouse_events: Math.round(490 * base) },
            { reusable_type: 'cup', out_warehouse_events: Math.round(350 * base), in_warehouse_events: Math.round(340 * base) }
          ]
        },
        {
          events: [
            { reusable_type: 'cup', out_warehouse_events: Math.round(510 * base), in_warehouse_events: Math.round(500 * base) },
            { reusable_type: 'cup', out_warehouse_events: Math.round(360 * base), in_warehouse_events: Math.round(350 * base) }
          ]
        }
      ];

    case 'sw-nike-whq':
      // SAN Plastic cups — corporate campus, moderate
      return [
        {
          events: [
            { reusable_type: 'cup', out_warehouse_events: Math.round(1200 * base), in_warehouse_events: Math.round(1150 * base) },
            { reusable_type: 'cup', out_warehouse_events: Math.round(900 * base), in_warehouse_events: Math.round(860 * base) }
          ]
        },
        {
          events: [
            { reusable_type: 'cup', out_warehouse_events: Math.round(1250 * base), in_warehouse_events: Math.round(1190 * base) },
            { reusable_type: 'cup', out_warehouse_events: Math.round(950 * base), in_warehouse_events: Math.round(900 * base) }
          ]
        }
      ];

    case 'sw-saturday-market':
      // Glass cups — weekend market, seasonal
      return [
        {
          events: [
            { reusable_type: 'cup', out_warehouse_events: Math.round(300 * base), in_warehouse_events: Math.round(270 * base) },
            { reusable_type: 'glass', out_warehouse_events: Math.round(200 * base), in_warehouse_events: Math.round(180 * base) }
          ]
        },
        {
          events: [
            { reusable_type: 'cup', out_warehouse_events: Math.round(320 * base), in_warehouse_events: Math.round(290 * base) },
            { reusable_type: 'glass', out_warehouse_events: Math.round(210 * base), in_warehouse_events: Math.round(190 * base) }
          ]
        }
      ];

    default:
      return [{ events: [] }, { events: [] }];
  }
}

async function main() {
  console.log('Seeding Sharewares test data...\n');

  // ── 1. Clean up previous seed ──────────────────────────────────────────────
  const existingOrg = await prisma.org.findFirst({ where: { name: RSP_ORG_NAME } });
  if (existingOrg) {
    console.log(`Found existing seed org "${RSP_ORG_NAME}", cleaning up...`);
    await prisma.computeRun.deleteMany({ where: { orgId: existingOrg.id } });
    await prisma.usageTimePeriod.deleteMany({ where: { orgId: existingOrg.id } });
    await prisma.rspApiKey.deleteMany({ where: { orgId: existingOrg.id } });
    // Delete accounts linked to this RSP org
    await prisma.account.deleteMany({ where: { rspOrgId: existingOrg.id } });
    await prisma.org.delete({ where: { id: existingOrg.id } });
    console.log('  Cleaned up.\n');
  }

  // ── 2. Create Sharewares RSP org ──────────────────────────────────────────
  const rspOrg = await prisma.org.create({
    data: {
      name: RSP_ORG_NAME,
      orgType: 'reuse-service-provider',
      city: 'Portland',
      country: 'US',
      employeeCount: '25',
      locationCount: '8',
      reuseJourneyStage: 'scaling',
      primaryChallenge: 'client-onboarding'
    }
  });
  console.log(`Created RSP org: "${rspOrg.name}" (${rspOrg.id})`);

  // ── 3. Create API key ──────────────────────────────────────────────────────
  const { raw, hash, prefix } = generateApiKey();
  const apiKeyRecord = await prisma.rspApiKey.create({
    data: {
      orgId: rspOrg.id,
      keyHash: hash,
      keyPrefix: prefix,
      isActive: true,
      label: 'Sharewares production key'
    }
  });
  console.log(`Created API key: ${raw}`);
  console.log(`  (prefix: ${prefix}, id: ${apiKeyRecord.id})\n`);

  // ── 4. Create 5 client accounts linked to RSP org ────────────────────────
  // Find a host org for the accounts (any non-RSP org)
  const hostOrg = await prisma.org.findFirst({ where: { orgType: null, isUpstream: false } });
  if (!hostOrg) {
    console.error('No host org found. Run the main seed script first.');
    process.exit(1);
  }

  const clientAccounts: Record<string, string> = {};
  for (const client of CLIENTS) {
    const account = await prisma.account.create({
      data: {
        orgId: hostOrg.id,
        name: client.name,
        accountContactEmail: client.email,
        USState: client.state,
        rspOrgId: rspOrg.id,
        rspClientId: client.id
      }
    });
    clientAccounts[client.id] = account.id;
    console.log(`  Linked client "${client.name}" (${client.cupNote})`);
  }
  console.log('');

  // ── 5. Make 20 API calls (4 per client: 2 ranges × 2 calls) ──────────────
  let callNumber = 0;
  const results: Array<{ call: number; client: string; range: string; superseded: number; units: number; co2: number }> = [];

  for (const client of CLIENTS) {
    const accountId = clientAccounts[client.id];

    for (let rangeIdx = 0; rangeIdx < DATE_RANGES.length; rangeIdx++) {
      const range = DATE_RANGES[rangeIdx];
      const [initial, correction] = getCallProfiles(client.id, rangeIdx);

      // Call 1: Initial submission
      callNumber++;
      const result1 = await ingestUsagePeriod({
        orgId: rspOrg.id,
        clientId: client.id,
        dateMin: new Date(range.dateMin),
        dateMax: new Date(range.dateMax),
        events: initial.events,
        submittedByKeyId: apiKeyRecord.id,
        accountId,
        rawPayload: { client_id: client.id, date_min: range.dateMin, date_max: range.dateMax, events: initial.events }
      });
      results.push({
        call: callNumber,
        client: client.name,
        range: range.label,
        superseded: result1.overlappingCount,
        units: result1.metrics.totalUnits,
        co2: result1.metrics.co2AvoidedKg
      });
      console.log(`  Call ${callNumber}: ${client.name} | ${range.label} (initial) → ${result1.metrics.totalUnits} units, ${result1.metrics.co2AvoidedKg.toFixed(2)} kg CO2`);

      // Call 2: Correction (same date range, supersedes call 1)
      callNumber++;
      const result2 = await ingestUsagePeriod({
        orgId: rspOrg.id,
        clientId: client.id,
        dateMin: new Date(range.dateMin),
        dateMax: new Date(range.dateMax),
        events: correction.events,
        submittedByKeyId: apiKeyRecord.id,
        accountId,
        rawPayload: { client_id: client.id, date_min: range.dateMin, date_max: range.dateMax, events: correction.events }
      });
      results.push({
        call: callNumber,
        client: client.name,
        range: range.label,
        superseded: result2.overlappingCount,
        units: result2.metrics.totalUnits,
        co2: result2.metrics.co2AvoidedKg
      });
      console.log(`  Call ${callNumber}: ${client.name} | ${range.label} (correction, superseded ${result2.overlappingCount}) → ${result2.metrics.totalUnits} units, ${result2.metrics.co2AvoidedKg.toFixed(2)} kg CO2`);
    }
    console.log('');
  }

  // ── 6. Summary ─────────────────────────────────────────────────────────────
  const totalUnits = results.reduce((s, r) => s + r.units, 0);
  const totalCO2 = results.reduce((s, r) => s + r.co2, 0);
  const supersessions = results.filter(r => r.superseded > 0).length;

  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Total API calls: ${callNumber}`);
  console.log(`  Total units processed: ${totalUnits.toLocaleString()}`);
  console.log(`  Total CO2 avoided: ${totalCO2.toFixed(2)} kg`);
  console.log(`  Supersession events: ${supersessions}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('\nAPI key for curl testing:');
  console.log(`  ${raw}`);
  console.log('\nExample curl command:');
  console.log(`  curl -X POST http://localhost:3000/api/rsp/usage \\`);
  console.log(`    -H "Authorization: Bearer ${raw}" \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"client_id":"sw-portland-state","date_min":"2026-02-01","date_max":"2026-02-15","events":[{"reusable_type":"cup","in_warehouse_events":750,"out_warehouse_events":800}]}'`);
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
