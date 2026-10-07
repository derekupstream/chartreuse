/**
 * Pushes the branded Supabase Auth email templates (lib/email/supabase-templates/)
 * to the Supabase project via the Management API.
 *
 * Needs a personal access token (NOT the service-role key — that can't edit project
 * config): create one at https://supabase.com/dashboard/account/tokens and run
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_... npx dotenv-cli -e .env -- npx tsx scripts/push-supabase-email-templates.ts
 *
 * Without a token it prints the manual copy-paste route and exits non-zero.
 */
import fs from 'fs';
import path from 'path';

const TEMPLATES_DIR = path.join(__dirname, '..', 'lib', 'email', 'supabase-templates');

/** file in supabase-templates/ → Management API config keys */
const TEMPLATE_MAP: Record<string, { subjectKey: string; contentKey: string; subject: string }> = {
  'confirm-signup.html': {
    subjectKey: 'mailer_subjects_confirmation',
    contentKey: 'mailer_templates_confirmation_content',
    subject: 'Confirm your email — Chart-Reuse'
  },
  'reset-password.html': {
    subjectKey: 'mailer_subjects_recovery',
    contentKey: 'mailer_templates_recovery_content',
    subject: 'Reset your password — Chart-Reuse'
  },
  'magic-link.html': {
    subjectKey: 'mailer_subjects_magic_link',
    contentKey: 'mailer_templates_magic_link_content',
    subject: 'Your sign-in link — Chart-Reuse'
  },
  'change-email.html': {
    subjectKey: 'mailer_subjects_email_change',
    contentKey: 'mailer_templates_email_change_content',
    subject: 'Confirm your new email — Chart-Reuse'
  }
};

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const ref = url.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!ref) throw new Error('Could not read the project ref from NEXT_PUBLIC_SUPABASE_URL');

  const payload: Record<string, string> = {};
  const files: string[] = [];
  for (const [file, keys] of Object.entries(TEMPLATE_MAP)) {
    const full = path.join(TEMPLATES_DIR, file);
    if (!fs.existsSync(full)) continue;
    payload[keys.subjectKey] = keys.subject;
    payload[keys.contentKey] = fs.readFileSync(full, 'utf8');
    files.push(file);
  }
  if (!files.length) throw new Error(`No template files found in ${TEMPLATES_DIR}`);

  if (!token) {
    console.error('No SUPABASE_ACCESS_TOKEN set — cannot push automatically.');
    console.error('');
    console.error('Either create a token at https://supabase.com/dashboard/account/tokens');
    console.error('and re-run with SUPABASE_ACCESS_TOKEN=sbp_..., or paste by hand:');
    console.error(`  1. Open https://supabase.com/dashboard/project/${ref}/auth/templates`);
    for (const [file, keys] of Object.entries(TEMPLATE_MAP)) {
      console.error(`  2. "${keys.subject.split(' — ')[0]}" template: set the subject to`);
      console.error(`     "${keys.subject}" and paste the contents of`);
      console.error(`     lib/email/supabase-templates/${file} into the message body.`);
    }
    process.exit(1);
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Management API responded ${res.status}: ${await res.text()}`);
  console.log(`Pushed ${files.length} template(s) to project ${ref}: ${files.join(', ')}`);
}

main().catch(err => {
  console.error(err.message ?? err);
  process.exit(1);
});
