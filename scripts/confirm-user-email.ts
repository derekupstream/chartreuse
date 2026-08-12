import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const TARGET_EMAIL = process.argv[2];
if (!TARGET_EMAIL) {
  console.error('Usage: npx tsx scripts/confirm-user-email.ts <email>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  let target: any = null;
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    target = data.users.find((u) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());
    if (target) break;
    if (data.users.length < 200) break;
    page += 1;
  }

  if (!target) {
    console.log(`No auth user found with email ${TARGET_EMAIL}`);
    return;
  }

  console.log('Found user:');
  console.log(`  id:            ${target.id}`);
  console.log(`  email:         ${target.email}`);
  console.log(`  created_at:    ${target.created_at}`);
  console.log(`  confirmed_at:  ${target.email_confirmed_at ?? '(not confirmed)'}`);
  console.log(`  last_sign_in:  ${target.last_sign_in_at ?? '(never)'}`);
  console.log(`  provider:      ${target.app_metadata?.provider}`);

  if (target.email_confirmed_at) {
    console.log('Already confirmed — nothing to do.');
    return;
  }

  const { data: updated, error: updateErr } = await admin.auth.admin.updateUserById(target.id, {
    email_confirm: true,
  });
  if (updateErr) throw updateErr;
  console.log(`Confirmed email at ${updated.user?.email_confirmed_at}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
