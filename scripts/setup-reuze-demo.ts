/**
 * Creates "ReUze", a fake RSP, for demoing the full API round trip:
 * the ReUze website (public/reuze-demo.html) sends usage through POST /api/rsp/usage and
 * renders the resulting impact from GET /api/rsp/impact.
 *
 * Also creates a working login inside the ReUze org, so the Settings → API Integration
 * portal (keys, clients, activity log) can be seen the way a real partner sees it.
 *
 *   npx tsx scripts/setup-reuze-demo.ts            # create (or reuse) ReUze + login + fresh key
 *   npx tsx scripts/setup-reuze-demo.ts --wipe     # delete ReUze, its login, and all its data
 *
 * The org and key carry the simulator's flags, so the admin Test Hub wipe tools can also
 * clean it up. Auth goes through Supabase, so the login is created with the service role and
 * works wherever this database's Supabase project is used.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

import prisma from 'lib/prisma';
import { createSimulatedApiKey, createSimulatedRspOrg } from 'lib/rsp/simulator';

dotenv.config();

const ORG_NAME = 'ReUze (Demo RSP)';
const LOGIN_EMAIL = 'demo@reuze.example.com';
const LOGIN_PASSWORD = 'reuze-demo-2026';

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment');
  }
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function findAuthUser(admin: ReturnType<typeof supabaseAdmin>) {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find(u => u.email?.toLowerCase() === LOGIN_EMAIL);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
}

/** Creates (or resets) the Supabase auth user and the User row that puts it in the ReUze org. */
async function ensureLogin(orgId: string) {
  const admin = supabaseAdmin();

  let authUser = await findAuthUser(admin);
  if (authUser) {
    // Reset the password so the printed credentials always work.
    const { error } = await admin.auth.admin.updateUserById(authUser.id, {
      password: LOGIN_PASSWORD,
      email_confirm: true
    });
    if (error) throw error;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
      email_confirm: true
    });
    if (error) throw error;
    authUser = data.user;
  }

  await prisma.user.upsert({
    where: { email: LOGIN_EMAIL },
    update: { id: authUser!.id, orgId, role: 'ORG_ADMIN' },
    create: {
      id: authUser!.id,
      email: LOGIN_EMAIL,
      name: 'ReUze Demo',
      title: 'Operations',
      orgId,
      role: 'ORG_ADMIN'
    }
  });
}

async function removeLogin() {
  await prisma.user.deleteMany({ where: { email: LOGIN_EMAIL } });
  try {
    const admin = supabaseAdmin();
    const authUser = await findAuthUser(admin);
    if (authUser) await admin.auth.admin.deleteUser(authUser.id);
  } catch (err) {
    console.warn(`Could not remove the Supabase auth user (${(err as Error).message}) — delete it manually if needed.`);
  }
}

async function wipe(orgId: string) {
  await removeLogin();
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
    console.log('ReUze, its login, and everything it created has been removed.');
    return;
  }

  const orgId = existing?.id ?? (await createSimulatedRspOrg(ORG_NAME)).orgId;
  console.log(existing ? `ReUze already exists (${orgId}) — issuing a fresh key.` : `Created ReUze (${orgId}).`);

  await ensureLogin(orgId);
  console.log('Login ready (password reset on every run):');
  console.log(`  email:    ${LOGIN_EMAIL}`);
  console.log(`  password: ${LOGIN_PASSWORD}\n`);

  const { rawKey } = await createSimulatedApiKey(orgId, {
    label: `ReUze demo page ${new Date().toISOString().slice(0, 10)}`
  });

  const clientCount = await prisma.account.count({ where: { rspOrgId: orgId } });
  console.log(`Client accounts so far: ${clientCount} (the demo page creates them on first submission).\n`);
  console.log('API key (shown once, like the real flow):\n');
  console.log(`  ${rawKey}\n`);
  console.log('Next steps:');
  console.log('  1. yarn dev (if not already running)');
  console.log('  2. open http://localhost:3000/reuze-demo.html');
  console.log('  3. paste the key into the page and press "Send this month’s data"');
  console.log(`  4. log in at http://localhost:3000/login as ${LOGIN_EMAIL} → Settings → API Integration`);
  console.log('\nTo see the Chart-Reuse admin side: Super Admin → RSP Hub → ReUze (Demo RSP).');
  console.log('To remove everything: npx tsx scripts/setup-reuze-demo.ts --wipe');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
