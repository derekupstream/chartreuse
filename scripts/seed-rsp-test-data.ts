/**
 * Seed script: creates a test RSP org, API key, and 12 months of usage ingestion data.
 *
 * Creates:
 *   - 1 RSP org ("Sharewares Demo")
 *   - 1 API key (printed to console so you can test via curl/playground)
 *   - 3 client accounts linked to the RSP org
 *   - 12 monthly usage periods (one per month for the past 12 months) per client
 *   - ComputeRun records and MetricResults for each period
 *
 * Run with: npx tsx scripts/seed-rsp-test-data.ts
 * Re-run safely: deletes existing seed data first.
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { ingestUsagePeriod } from 'lib/rsp/ingestUsagePeriod';
import { generateApiKey } from 'lib/rsp/apiKeyAuth';

const prisma = new PrismaClient();

const RSP_ORG_NAME = 'Sharewares Demo (Seed)';

const CLIENTS = [
  { id: 'client-university-01', name: 'State University - Main Campus' },
  { id: 'client-stadium-02', name: 'Metro Sports Arena' },
  { id: 'client-hospital-03', name: 'Regional Medical Center' }
];

// Monthly event volumes per client (grows over time)
const CLIENT_PROFILES: Record<string, { plate: number; cup: number; bowl: number; container: number; utensils: number }[]> = {
  'client-university-01': Array.from({ length: 12 }, (_, i) => ({
    plate: Math.round(1200 + i * 80),
    cup: Math.round(2400 + i * 120),
    bowl: Math.round(800 + i * 40),
    container: Math.round(600 + i * 30),
    utensils: Math.round(3000 + i * 150)
  })),
  'client-stadium-02': Array.from({ length: 12 }, (_, i) => ({
    plate: Math.round(3000 + i * 200),
    cup: Math.round(6000 + i * 300),
    bowl: Math.round(500 + i * 20),
    container: Math.round(800 + i * 50),
    utensils: Math.round(5000 + i * 200)
  })),
  'client-hospital-03': Array.from({ length: 12 }, (_, i) => ({
    plate: Math.round(800 + i * 30),
    cup: Math.round(1200 + i * 50),
    bowl: Math.round(1500 + i * 60),
    container: Math.round(2000 + i * 80),
    utensils: Math.round(2500 + i * 100)
  }))
};

async function main() {
  console.log('🌱 Seeding RSP test data...\n');

  // ── 1. Clean up previous seed ──────────────────────────────────────────────
  const existingOrg = await prisma.org.findFirst({ where: { name: RSP_ORG_NAME } });
  if (existingOrg) {
    console.log(`Found existing seed org "${RSP_ORG_NAME}", cleaning up...`);
    // Delete compute runs linked to this org's usage periods
    await prisma.computeRun.deleteMany({ where: { orgId: existingOrg.id } });
    // Delete usage periods (cascade deletes products + metric results)
    await prisma.usageTimePeriod.deleteMany({ where: { orgId: existingOrg.id } });
    // Delete API keys
    await prisma.rspApiKey.deleteMany({ where: { orgId: existingOrg.id } });
    // Delete accounts
    await prisma.account.deleteMany({ where: { org: { name: RSP_ORG_NAME } } });
    // Delete org
    await prisma.org.delete({ where: { id: existingOrg.id } });
    console.log('  Cleaned up.\n');
  }

  // ── 2. Create RSP org ──────────────────────────────────────────────────────
  const rspOrg = await prisma.org.create({
    data: {
      name: RSP_ORG_NAME,
      orgType: 'reuse-service-provider',
      city: 'Portland',
      country: 'US',
      employeeCount: '45',
      locationCount: '12',
      reuseJourneyStage: 'scaling',
      primaryChallenge: 'logistics'
    }
  });
  console.log(`✅ Created RSP org: "${rspOrg.name}" (${rspOrg.id})`);

  // ── 3. Create API key ──────────────────────────────────────────────────────
  const { raw, hash, prefix } = generateApiKey();
  const apiKeyRecord = await prisma.rspApiKey.create({
    data: {
      orgId: rspOrg.id,
      keyHash: hash,
      keyPrefix: prefix,
      isActive: true,
      label: 'Seed test key'
    }
  });
  console.log(`✅ Created API key: ${raw}`);
  console.log(`   (prefix: ${prefix}, id: ${apiKeyRecord.id})\n`);

  // ── 4. Create client accounts linked to RSP org ────────────────────────────
  const clientAccounts: Record<string, string> = {}; // clientId → accountId
  for (const client of CLIENTS) {
    // Check if we have an existing org to link as the client's org (use any non-RSP org)
    // or just create a simple account without an org link — use a dummy org for the account
    // We need an Account that belongs to an Org. Let's pick a random real org from the seed data.
    const hostOrg = await prisma.org.findFirst({ where: { orgType: null, isUpstream: false } });
    if (!hostOrg) {
      console.warn(`  No host org found for client ${client.id}, skipping account creation`);
      continue;
    }

    const account = await prisma.account.create({
      data: {
        orgId: hostOrg.id,
        name: client.name,
        accountContactEmail: `seed-${client.id}@example.com`,
        rspOrgId: rspOrg.id,
        rspClientId: client.id
      }
    });
    clientAccounts[client.id] = account.id;
    console.log(`✅ Linked client "${client.name}" → account ${account.id}`);
  }
  console.log('');

  // ── 5. Ingest 12 months of usage periods per client ───────────────────────
  const now = new Date();
  let totalPeriods = 0;

  for (const client of CLIENTS) {
    const accountId = clientAccounts[client.id] ?? null;
    const volumes = CLIENT_PROFILES[client.id];

    console.log(`📦 Ingesting 12 months for "${client.name}"...`);

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      // dateMin = first of the month, dateMax = last day of that month
      const targetDate = new Date(now);
      targetDate.setMonth(targetDate.getMonth() - (11 - monthIndex));
      targetDate.setDate(1);

      const dateMin = new Date(targetDate);
      const dateMax = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0); // last day

      const vol = volumes[monthIndex];
      const events = [
        { reusable_type: 'plate', in_warehouse_events: Math.round(vol.plate * 1.05), out_warehouse_events: vol.plate },
        { reusable_type: 'cup', in_warehouse_events: Math.round(vol.cup * 1.03), out_warehouse_events: vol.cup },
        { reusable_type: 'bowl', in_warehouse_events: Math.round(vol.bowl * 1.04), out_warehouse_events: vol.bowl },
        { reusable_type: 'container', in_warehouse_events: Math.round(vol.container * 1.02), out_warehouse_events: vol.container },
        { reusable_type: 'utensils', in_warehouse_events: Math.round(vol.utensils * 1.06), out_warehouse_events: vol.utensils }
      ];

      const result = await ingestUsagePeriod({
        orgId: rspOrg.id,
        clientId: client.id,
        dateMin,
        dateMax,
        events,
        submittedByKeyId: apiKeyRecord.id,
        accountId,
        rawPayload: { client_id: client.id, date_min: dateMin.toISOString().slice(0, 10), date_max: dateMax.toISOString().slice(0, 10), events }
      });

      totalPeriods++;
      const monthStr = dateMin.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      console.log(`  ${monthStr}: ${result.metrics.totalUnits.toLocaleString()} units → ${result.metrics.co2AvoidedKg.toFixed(1)} kg CO₂ avoided`);
    }
    console.log('');
  }

  console.log(`\n✅ Done! Created ${totalPeriods} usage periods across ${CLIENTS.length} clients.`);
  console.log('\nAPI key for testing:');
  console.log(`  ${raw}`);
  console.log('\nNavigate to /admin/data-science/data-map to see the RSP feed.');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
