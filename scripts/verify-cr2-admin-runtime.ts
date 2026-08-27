/**
 * Runtime verification of the Data Science admin (docs/REVIEW-PROTOCOL.md, Layer D).
 *
 * Creates a throwaway Supabase auth user linked to the Upstream org, signs in, builds the
 * SSR auth cookies, and exercises every page of the tab-dictated nav over HTTP against a
 * running dev server — asserting real status codes and that the rendered content matches
 * what Postgres actually holds. Cleans up the throwaway user afterward (--keep to skip).
 *
 * Run:  npx dotenv-cli -e .env -- npx tsx scripts/verify-cr2-admin-runtime.ts
 */
import { createClient } from '@supabase/supabase-js';

import prisma from '../lib/prisma';

const BASE_URL = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000';
const EMAIL = 'cr2-runtime-check@upstream.example.com';
const KEEP = process.argv.includes('--keep');
/** With --keep: print the session cookie so a browser can adopt it (console hydration checks). */
const PRINT_COOKIE = process.argv.includes('--print-cookie');
/** Only remove a --keep leftover, then exit. */
const CLEANUP = process.argv.includes('--cleanup');

const results: { name: string; ok: boolean; detail: string }[] = [];
function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

/** The @supabase/ssr cookie format: base64url JSON, chunked at ~3180 chars. */
function sessionCookies(session: object): string {
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
  const name = `sb-${ref}-auth-token`;
  const value = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
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
    await prisma.$disconnect();
    console.log(leftover ? 'throwaway user removed' : 'nothing to clean up');
    return;
  }

  const password = 'verify-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  let authUserId: string | null = null;

  try {
    // ── Session setup: throwaway auth user on the Upstream org ──────────────────────────
    const upstreamOrg = await prisma.org.findFirst({ where: { isUpstream: true } });
    if (!upstreamOrg) throw new Error('No isUpstream org in the local database');

    const created = await admin.auth.admin.createUser({ email: EMAIL, password, email_confirm: true });
    if (created.error) {
      // Leftover from an interrupted run — remove and recreate so the password is known.
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
      create: { id: authUserId, email: EMAIL, name: 'CR2 Runtime Check', orgId: upstreamOrg.id },
      update: { id: authUserId, orgId: upstreamOrg.id }
    });

    const signIn = await anon.auth.signInWithPassword({ email: EMAIL, password });
    if (signIn.error || !signIn.data.session) throw new Error(`signIn failed: ${signIn.error?.message}`);
    const cookie = sessionCookies(signIn.data.session);
    check('session', true, `signed in as ${EMAIL}`);
    if (KEEP && PRINT_COOKIE) console.log(`COOKIE ${cookie}`);

    const get = (path: string, withCookie = true) =>
      fetch(BASE_URL + path, { redirect: 'manual', headers: withCookie ? { cookie } : {} });

    // ── Unauthorized state: no session must redirect, not render ────────────────────────
    const anonRes = await get('/admin/data-science', false);
    check('unauthorized redirect', anonRes.status >= 300 && anonRes.status < 400, `status ${anonRes.status}`);

    // ── Every page of the tab-dictated nav renders (SSR crash ⇒ 500) ───────────────────
    const pages: [string, string[]][] = [
      ['/admin/data-science', ['How this works', 'Databases', 'Annual Projections']],
      ['/admin/data-science/databases', []], // groups render client-side; data is verified via the API below
      ['/admin/data-science/databases?all=true', []],
      ['/admin/data-science/databases?openName=Funding%20Opportunities', []],
      ['/admin/data-science/data-dictionary', ['Data Dictionary', 'product_id']],
      ['/admin/data-science/data-products/annual-projections-2', ['Annual Projections']],
      ['/admin/data-science/methodology-hub', ['Combined Data', 'Change log', 'legacy']],
      ['/admin/data-science/quality', []],
      ['/admin/data-science/databases/workbook-upload', ['Workbook upload']],
      ['/admin/data-science/data-products-hub', []],
      ['/admin/data-science/smart-fields', []],
      ['/admin/data-science/calculations', []],
      ['/admin/data-science/data-map', []],
      ['/admin/data-science/import', []],
      ['/admin/data-science/snapshots', []],
      ['/admin/data-science/runs', []],
      ['/admin/data-science/pipeline', []] // regression: crashed with "Menu link key not found"
    ];
    for (const [path, mustContain] of pages) {
      const res = await get(path);
      let ok = res.status === 200;
      let detail = `status ${res.status}`;
      if (ok && mustContain.length) {
        const html = await res.text();
        const missing = mustContain.filter(s => !html.includes(s));
        if (html.includes('Menu link key not found')) {
          ok = false;
          detail = 'menu key crash in HTML';
        } else if (missing.length) {
          ok = false;
          detail = `missing: ${missing.join(', ')}`;
        }
      }
      check(`GET ${path}`, ok, detail);
    }

    // ── Data reality: the API the pages read must match Postgres ────────────────────────
    const listRes = await get('/api/admin/factor-databases');
    const list = listRes.status === 200 ? await listRes.json() : null;
    check('API factor-databases', Array.isArray(list), `status ${listRes.status}, ${list?.length ?? 0} databases`);
    if (Array.isArray(list)) {
      const dbCount = await prisma.factorDatabase.count();
      check('database count matches Postgres', list.length === dbCount, `${list.length} API vs ${dbCount} DB`);
      const offVersion = list.filter((d: { version: string }) => d.version !== '2.0');
      check('all databases at version 2.0', offVersion.length === 0, offVersion.map((d: any) => d.name).join(', '));

      const funding = list.find((d: { name: string }) => d.name === 'Funding Opportunities');
      check('Funding Opportunities exists', Boolean(funding));
      if (funding) {
        const detailRes = await get(`/api/admin/factor-databases/${funding.id}`);
        const detail = detailRes.status === 200 ? await detailRes.json() : null;
        const pgRows = await prisma.factorDatabaseRow.count({ where: { databaseId: funding.id } });
        check(
          'Funding rows: API = Postgres = 121',
          detail?.rows?.length === 121 && pgRows === 121,
          `API ${detail?.rows?.length}, DB ${pgRows}`
        );
        const first = detail?.rows?.[0]?.data ?? detail?.rows?.[0];
        check('Funding row content is real', Boolean(first && JSON.stringify(first).includes('MUN-')), '');

        // The source link serves the actual stored file
        if (funding.sourceFileId) {
          const srcRes = await get(`/api/admin/factor-databases/${funding.id}/source`);
          const size = Number(srcRes.headers.get('content-length') ?? 0);
          check('source file downloads', srcRes.status === 200 && size > 10000,
            `status ${srcRes.status}, ${(size / 1024).toFixed(0)} KB, type ${srcRes.headers.get('content-type')}`);
        } else {
          check('source file linked', false, 'sourceFileId missing on Funding Opportunities');
        }

        // Spreadsheet page renders for a real database id
        const sheetRes = await get(`/admin/data-science/databases/${funding.id}`);
        check('spreadsheet page renders', sheetRes.status === 200, `status ${sheetRes.status}`);

        // Cell-edit round trip: write a marker, confirm it landed + changelogged, write back
        const before = detail?.rows?.[0]?.internal_tracker_url ?? null;
        const marker = 'https://verify.local/cr2-runtime-check';
        const editRes = await fetch(`${BASE_URL}/api/admin/factor-databases/${funding.id}/cells`, {
          method: 'PATCH',
          headers: { cookie, 'Content-Type': 'application/json' },
          body: JSON.stringify({ edits: [{ rowIndex: 0, column: 'internal_tracker_url', value: marker }] })
        });
        const editBody = await editRes.json();
        const after = await get(`/api/admin/factor-databases/${funding.id}`).then(r => r.json());
        const landed = after?.rows?.[0]?.internal_tracker_url === marker;
        const logged = after?.changes?.[0]?.action === 'edit' && after?.changes?.[0]?.rowsUpdated === 1;
        check('cell edit lands and is changelogged', editRes.status === 200 && landed && logged,
          `status ${editRes.status}, value ${landed ? 'written' : 'MISSING'}, changelog ${logged ? 'recorded' : 'MISSING'}, version ${editBody.versionBefore} → ${editBody.versionAfter}`);
        await fetch(`${BASE_URL}/api/admin/factor-databases/${funding.id}/cells`, {
          method: 'PATCH',
          headers: { cookie, 'Content-Type': 'application/json' },
          body: JSON.stringify({ edits: [{ rowIndex: 0, column: 'internal_tracker_url', value: before }] })
        });
        const restored = await get(`/api/admin/factor-databases/${funding.id}`).then(r => r.json());
        check('cell edit reverted cleanly', (restored?.rows?.[0]?.internal_tracker_url ?? null) === before, '');
      }
    }
  } finally {
    if (!KEEP) {
      await prisma.user.deleteMany({ where: { email: EMAIL } }).catch(() => undefined);
      if (authUserId) await admin.auth.admin.deleteUser(authUserId).catch(() => undefined);
      console.log('  · throwaway user cleaned up');
    }
    await prisma.$disconnect();
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:\n' + failed.map(f => `  ${f.name} — ${f.detail}`).join('\n'));
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
