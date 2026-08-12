/**
 * Creates "ReUze", a fake RSP, for demoing the full API round trip:
 * the ReUze website (public/reuze-demo.html) sends usage through POST /api/rsp/usage and
 * renders the resulting impact from GET /api/rsp/impact.
 *
 *   npx tsx scripts/setup-reuze-demo.ts            # create (or reuse) ReUze + print a fresh key
 *   npx tsx scripts/setup-reuze-demo.ts --wipe     # delete ReUze and everything it created
 *
 * The org and key carry the simulator's flags, so the admin Test Hub wipe tools can also
 * clean it up.
 */
import prisma from 'lib/prisma';
import { createSimulatedApiKey, createSimulatedRspOrg } from 'lib/rsp/simulator';

const ORG_NAME = 'ReUze (Demo RSP)';

async function wipe(orgId: string) {
  const periodIds = (await prisma.usageTimePeriod.findMany({ where: { orgId }, select: { id: true } })).map(p => p.id);
  await prisma.dataHealthIssue.deleteMany({ where: { entity: 'UsageTimePeriod', entityId: { in: periodIds } } });
  await prisma.usagePeriodProduct.deleteMany({ where: { period: { orgId } } });
  await prisma.usageTimePeriod.deleteMany({ where: { orgId } });
  await prisma.rspApiActivityLog.deleteMany({ where: { orgId } });
  await prisma.rspApiKey.deleteMany({ where: { orgId } });
  await prisma.account.deleteMany({ where: { OR: [{ rspOrgId: orgId }, { orgId }] } });
  await prisma.org.delete({ where: { id: orgId } });
}

async function main() {
  const existing = await prisma.org.findFirst({ where: { name: ORG_NAME }, select: { id: true } });

  if (process.argv.includes('--wipe')) {
    if (!existing) {
      console.log('Nothing to wipe — ReUze does not exist.');
      return;
    }
    await wipe(existing.id);
    console.log('ReUze and everything it created has been removed.');
    return;
  }

  const orgId = existing?.id ?? (await createSimulatedRspOrg(ORG_NAME)).orgId;
  console.log(existing ? `ReUze already exists (${orgId}) — issuing a fresh key.` : `Created ReUze (${orgId}).`);

  const { rawKey } = await createSimulatedApiKey(orgId, { label: `ReUze demo page ${new Date().toISOString().slice(0, 10)}` });

  const clientCount = await prisma.account.count({ where: { rspOrgId: orgId } });
  console.log(`Client accounts so far: ${clientCount} (the demo page creates them on first submission).\n`);
  console.log('API key (shown once, like the real flow):\n');
  console.log(`  ${rawKey}\n`);
  console.log('Next steps:');
  console.log('  1. yarn dev (if not already running)');
  console.log('  2. open http://localhost:3000/reuze-demo.html');
  console.log('  3. paste the key into the page and press "Send this month’s data"');
  console.log('\nTo see the Chart-Reuse side: Super Admin → RSP Hub → ReUze (Demo RSP).');
  console.log('To remove everything: npx tsx scripts/setup-reuze-demo.ts --wipe');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
