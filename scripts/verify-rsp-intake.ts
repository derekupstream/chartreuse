/**
 * End-to-end check of the RSP usage intake against a running dev server.
 *
 * Creates a throwaway RSP org, one linked client account and one unlinked client id, then walks
 * the cases a real partner hits during onboarding: bad auth, bad payload, a dry run that resolves,
 * a dry run that doesn't, unrecognised types, and a real submission followed by a re-send.
 *
 *   yarn dev                       # in another terminal
 *   npx tsx scripts/verify-rsp-intake.ts
 *
 * Pass --keep to leave the created org behind for poking at in the UI.
 */
import { createSimulatedApiKey, createSimulatedClientAccount, createSimulatedRspOrg } from 'lib/rsp/simulator';
import prisma from 'lib/prisma';

const BASE = process.env.RSP_TEST_BASE_URL ?? 'http://localhost:3000';
const ENDPOINT = `${BASE}/api/rsp/usage`;

type Case = {
  name: string;
  expectStatus: number;
  /** Warning codes the response must contain, exactly */
  expectWarnings?: string[];
  body: unknown;
  key: string;
};

let passed = 0;
let failed = 0;

async function run(testCase: Case) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testCase.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(testCase.body)
  });
  const json: any = await res.json().catch(() => ({}));

  const problems: string[] = [];
  if (res.status !== testCase.expectStatus) {
    problems.push(`expected HTTP ${testCase.expectStatus}, got ${res.status} (${json.error ?? 'no error field'})`);
  }
  if (testCase.expectWarnings) {
    const actual = ((json.warnings ?? []) as { code: string }[]).map(w => w.code).sort();
    const expected = [...testCase.expectWarnings].sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      problems.push(`expected warnings [${expected.join(', ')}], got [${actual.join(', ')}]`);
    }
  }

  if (problems.length === 0) {
    passed += 1;
    const extra = json.metrics
      ? ` — co2 ${json.metrics.co2_avoided_kg}kg, ${json.metrics.single_use_equivalents} items`
      : '';
    console.log(`  PASS  ${testCase.name}${extra}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${testCase.name}`);
    problems.forEach(p => console.log(`          ${p}`));
  }
  return json;
}

async function main() {
  const keep = process.argv.includes('--keep');

  console.log(`Intake verification against ${ENDPOINT}\n`);

  const { orgId } = await createSimulatedRspOrg(`Intake Verification ${Date.now()}`);
  const { rawKey } = await createSimulatedApiKey(orgId, { label: 'intake-verification' });
  const linked = await createSimulatedClientAccount({
    rspOrgId: orgId,
    name: 'Verified Client',
    rspClientId: 'verified-client'
  });

  console.log(`RSP org ${orgId}`);
  console.log(`linked client_id "${linked.rspClientId}" -> account ${linked.accountId}\n`);

  const period = { date_min: '2026-07-01', date_max: '2026-07-31' };
  const cleanEvents = [
    { reusable_type: 'cup', out_warehouse_events: 12400, in_warehouse_events: 11780 },
    { reusable_type: 'bowl', out_warehouse_events: 3100, in_warehouse_events: 2890 }
  ];

  console.log('Auth and validation');
  await run({
    name: 'a bad key is rejected',
    key: 'cr_rsp_deadbeef',
    expectStatus: 401,
    body: { client_id: linked.rspClientId, ...period, events: cleanEvents }
  });
  await run({
    name: 'missing required fields are rejected',
    key: rawKey,
    expectStatus: 400,
    body: { client_id: linked.rspClientId }
  });
  await run({
    name: 'an inverted date range is rejected',
    key: rawKey,
    expectStatus: 400,
    body: { client_id: linked.rspClientId, date_min: '2026-07-31', date_max: '2026-07-01', events: cleanEvents }
  });
  await run({
    name: 'a malformed event is rejected rather than crashing',
    key: rawKey,
    expectStatus: 400,
    body: { client_id: linked.rspClientId, ...period, events: [{ out_warehouse_events: 5, in_warehouse_events: 5 }] }
  });
  await run({
    name: 'negative counts are rejected',
    key: rawKey,
    expectStatus: 400,
    body: {
      client_id: linked.rspClientId,
      ...period,
      events: [{ reusable_type: 'cup', out_warehouse_events: -5, in_warehouse_events: 0 }]
    }
  });

  console.log('\nDry runs');
  const cleanDryRun = await run({
    name: 'a clean payload dry-runs with no warnings',
    key: rawKey,
    expectStatus: 200,
    expectWarnings: [],
    body: { dry_run: true, client_id: linked.rspClientId, ...period, events: cleanEvents }
  });
  if (cleanDryRun.period?.account_linked !== true) {
    failed += 1;
    console.log('  FAIL  dry run should report account_linked: true');
  } else if (cleanDryRun.status !== 'validated') {
    failed += 1;
    console.log(`  FAIL  dry run should report status "validated", got "${cleanDryRun.status}"`);
  } else {
    passed += 1;
    console.log('  PASS  dry run reports account_linked and status "validated"');
  }

  await run({
    name: 'an unmapped client_id is warned about',
    key: rawKey,
    expectStatus: 200,
    expectWarnings: ['unlinked_client_id'],
    body: { dry_run: true, client_id: 'never-mapped', ...period, events: cleanEvents }
  });
  await run({
    name: 'an unrecognised reusable_type is warned about',
    key: rawKey,
    expectStatus: 200,
    expectWarnings: ['unknown_reusable_type'],
    body: {
      dry_run: true,
      client_id: linked.rspClientId,
      ...period,
      events: [{ reusable_type: 'cups', out_warehouse_events: 100, in_warehouse_events: 90 }]
    }
  });
  await run({
    name: 'a repeated reusable_type is warned about',
    key: rawKey,
    expectStatus: 200,
    expectWarnings: ['duplicate_reusable_type'],
    body: {
      dry_run: true,
      client_id: linked.rspClientId,
      ...period,
      events: [
        { reusable_type: 'cup', out_warehouse_events: 100, in_warehouse_events: 90 },
        { reusable_type: 'Cup', out_warehouse_events: 50, in_warehouse_events: 40 }
      ]
    }
  });
  await run({
    name: 'swapped inbound/outbound is warned about',
    key: rawKey,
    expectStatus: 200,
    expectWarnings: ['no_outbound_events'],
    body: {
      dry_run: true,
      client_id: linked.rspClientId,
      ...period,
      events: [{ reusable_type: 'cup', out_warehouse_events: 0, in_warehouse_events: 12400 }]
    }
  });

  const beforeCount = await prisma.usageTimePeriod.count({ where: { orgId } });
  if (beforeCount === 0) {
    passed += 1;
    console.log('  PASS  no dry run stored a period');
  } else {
    failed += 1;
    console.log(`  FAIL  dry runs stored ${beforeCount} period(s) — they must store nothing`);
  }

  console.log('\nReal submissions');
  const real = await run({
    name: 'a real submission is accepted and priced',
    key: rawKey,
    expectStatus: 200,
    expectWarnings: [],
    body: { client_id: linked.rspClientId, ...period, events: cleanEvents }
  });
  if (real.period?.id && real.period.superseded_count === 0) {
    passed += 1;
    console.log('  PASS  first submission created a period and superseded nothing');
  } else {
    failed += 1;
    console.log(`  FAIL  expected a new period id and superseded_count 0, got ${JSON.stringify(real.period)}`);
  }

  const resend = await run({
    name: 're-sending the same period supersedes the first',
    key: rawKey,
    expectStatus: 200,
    expectWarnings: [],
    body: { client_id: linked.rspClientId, ...period, events: cleanEvents }
  });
  if (resend.period?.superseded_count === 1) {
    passed += 1;
    console.log('  PASS  the re-send superseded exactly one earlier period');
  } else {
    failed += 1;
    console.log(`  FAIL  expected superseded_count 1, got ${resend.period?.superseded_count}`);
  }

  const attached = await prisma.usageTimePeriod.count({ where: { orgId, accountId: linked.accountId } });
  if (attached === 2) {
    passed += 1;
    console.log('  PASS  both stored periods are attached to the linked account');
  } else {
    failed += 1;
    console.log(`  FAIL  expected 2 periods attached to the account, found ${attached}`);
  }

  console.log('\nAuto-created client accounts');
  const created = await run({
    name: 'a first-time client_id creates its account',
    key: rawKey,
    expectStatus: 200,
    expectWarnings: ['client_account_created'],
    body: {
      client_id: 'brand-new-client',
      client_name: 'Brand New Cafe',
      ...period,
      events: cleanEvents
    }
  });
  if (created.period?.account_created === true) {
    passed += 1;
    console.log('  PASS  response reports account_created: true');
  } else {
    failed += 1;
    console.log(`  FAIL  expected period.account_created true, got ${JSON.stringify(created.period)}`);
  }

  const newAccount = await prisma.account.findFirst({
    where: { rspOrgId: orgId, rspClientId: 'brand-new-client' },
    select: { id: true, name: true }
  });
  if (newAccount?.name === 'Brand New Cafe') {
    passed += 1;
    console.log(`  PASS  account exists with the client_name as its display name`);
  } else {
    failed += 1;
    console.log(`  FAIL  expected an account named "Brand New Cafe", found ${JSON.stringify(newAccount)}`);
  }

  const followUp = await run({
    name: 'the next submission routes to the created account instead of making another',
    key: rawKey,
    expectStatus: 200,
    expectWarnings: [],
    body: {
      client_id: 'brand-new-client',
      date_min: '2026-08-01',
      date_max: '2026-08-31',
      events: cleanEvents
    }
  });
  if (followUp.period?.account_created === false) {
    passed += 1;
    console.log('  PASS  follow-up reports account_created: false');
  } else {
    failed += 1;
    console.log(`  FAIL  expected account_created false on the follow-up, got ${JSON.stringify(followUp.period)}`);
  }
  const accountCount = await prisma.account.count({ where: { rspOrgId: orgId, rspClientId: 'brand-new-client' } });
  if (accountCount === 1) {
    passed += 1;
    console.log('  PASS  still exactly one account for that client_id');
  } else {
    failed += 1;
    console.log(`  FAIL  expected 1 account for brand-new-client, found ${accountCount}`);
  }

  console.log(`\n${passed} passed, ${failed} failed`);

  if (keep) {
    console.log(`\nLeft org ${orgId} in place (--keep). Key: ${rawKey}`);
  } else {
    // DataHealthIssue rows point at entities rather than orgs, so collect the ids first.
    const periodIds = (await prisma.usageTimePeriod.findMany({ where: { orgId }, select: { id: true } })).map(
      p => p.id
    );
    await prisma.dataHealthIssue.deleteMany({
      where: { entity: 'UsageTimePeriod', entityId: { in: periodIds } }
    });
    await prisma.usagePeriodProduct.deleteMany({ where: { period: { orgId } } });
    await prisma.usageTimePeriod.deleteMany({ where: { orgId } });
    await prisma.rspApiActivityLog.deleteMany({ where: { orgId } });
    await prisma.rspApiKey.deleteMany({ where: { orgId } });
    await prisma.account.deleteMany({ where: { OR: [{ rspOrgId: orgId }, { orgId }] } });
    await prisma.org.delete({ where: { id: orgId } });
    console.log('Cleaned up the throwaway org.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
