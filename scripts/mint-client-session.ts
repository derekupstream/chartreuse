/**
 * Mints a throwaway NON-Upstream login for testing what a regular client sees — the
 * counterpart of scripts/verify-cr2-admin-runtime.ts (which makes a staff login).
 * Prints the session cookie; --cleanup removes the user.
 *
 * Run:  npx dotenv-cli -e .env -- npx tsx scripts/mint-client-session.ts [--cleanup]
 */
import { createClient } from '@supabase/supabase-js';

import prisma from '../lib/prisma';

const EMAIL = 'cr2-client-check@example.com';
const CLEANUP = process.argv.includes('--cleanup');

function sessionCookies(session: { [k: string]: unknown }): string {
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
  const name = `sb-${ref}-auth-token`;
  const value = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64');
  const CHUNK = 3180;
  if (value.length <= CHUNK) return `${name}=${value}`;
  const chunks: string[] = [];
  for (let i = 0; i * CHUNK < value.length; i++) {
    chunks.push(`${name}.${i}=${value.slice(i * CHUNK, (i + 1) * CHUNK)}`);
  }
  return chunks.join('; ');
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  if (CLEANUP) {
    const leftover = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (leftover) await admin.auth.admin.deleteUser(leftover.id).catch(() => undefined);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    console.log(leftover ? 'throwaway client removed' : 'nothing to clean up');
    return;
  }

  const clientOrg = await prisma.org.findFirst({ where: { isUpstream: false } });
  if (!clientOrg) throw new Error('No non-Upstream org in the local database');

  const password = 'client-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const created = await admin.auth.admin.createUser({ email: EMAIL, password, email_confirm: true });
  let authUserId: string;
  if (created.error) {
    const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (existing) await admin.auth.admin.deleteUser(existing.id).catch(() => undefined);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    const retry = await admin.auth.admin.createUser({ email: EMAIL, password, email_confirm: true });
    if (retry.error) throw new Error(`createUser failed: ${retry.error.message}`);
    authUserId = retry.data.user!.id;
  } else {
    authUserId = created.data.user!.id;
  }

  await prisma.user.upsert({
    where: { email: EMAIL },
    create: { id: authUserId, email: EMAIL, name: 'CR2 Client Check', orgId: clientOrg.id },
    update: { id: authUserId, orgId: clientOrg.id }
  });

  const signIn = await anon.auth.signInWithPassword({ email: EMAIL, password });
  if (signIn.error || !signIn.data.session) throw new Error(`signIn failed: ${signIn.error?.message}`);
  console.log(`org: ${clientOrg.name} (isUpstream=false)`);
  console.log(`COOKIE ${sessionCookies(signIn.data.session as unknown as { [k: string]: unknown })}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
