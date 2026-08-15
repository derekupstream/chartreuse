# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This App Is

Chart-Reuse (by Upstream Solutions) is a SaaS calculator that projects the cost and environmental savings of switching from single-use to reusable foodware. Full architecture reference: `docs/ROADMAP.md`.

## Commands

Package manager is **Yarn**.

```bash
yarn dev                    # dev server (Turbopack) at http://localhost:3000
yarn build                  # prisma generate + next build
yarn lint                   # next lint
yarn test                   # jest in watch mode
yarn test:ci                # jest single run
node --experimental-vm-modules node_modules/.bin/jest path/to/file.test.ts   # single test file

yarn prisma:validate        # validate schema
yarn prisma:status          # check migration status (safe-prisma-operations.sh)
# DO NOT run `yarn prisma:sync` after editing schema.prisma — its "connection check" runs
# `prisma db pull --force`, which OVERWRITES the hand-written schema with an introspected copy
# (git checkout to recover). Also, `prisma migrate dev`/`deploy` fail locally: the local DB's
# _prisma_migrations table has a stale failed record and missing rows (tables were synced by
# other means). For schema changes: edit schema.prisma, hand-write the migration SQL in
# prisma/migrations/<timestamp>_<name>/migration.sql, apply locally with psql -f, then
# `npx prisma generate`. Production deploys cleanly via `migrate deploy` (its table is intact).
npx tsx scripts/seed.ts     # seed local DB (run one-off scripts with npx tsx)
```

Jest requires the `--experimental-vm-modules` flag (the package is `"type": "module"`); use the package scripts or the full invocation above, not bare `jest`.

## Environment & Database

- Local dev uses Postgres.app, database `chartreuse_local`, configured via `.env`. `psql` lives at `/Applications/Postgres.app/Contents/Versions/latest/bin`.
- Production is Vercel (app) + Supabase (DB + auth) at https://chartreuse-bay.vercel.app.
- Production `DATABASE_URL` uses the Supabase **transaction pooler (port 6543)**; `lib/prisma.ts` auto-appends `?pgbouncer=true&sslmode=require` for Supabase URLs in production. Migrations against production must use the **direct connection (port 5432)** with `npx prisma migrate deploy`.
- `prisma/schema.prisma` has `binaryTargets = ["native", "rhel-openssl-3.0.x"]` for Vercel Linux — don't remove it.
- One-off scripts against production: `npx dotenv-cli -e .env.production -- npx tsx scripts/foo.ts`. A script that instantiates `PrismaClient` directly must append `?pgbouncer=true&sslmode=require` to `DATABASE_URL` itself (only `lib/prisma.ts` does this automatically) — otherwise the pooler fails with `prepared statement "s0" already exists`. Scripts must live inside the repo (not `/tmp`) so imports resolve, and top-level await doesn't work under `tsx` here — wrap in an async `main()`.
- Useful diagnostics: `scripts/inspect-user-org.ts <email>` prints a user's DB record, org/account tree, and Supabase auth status.
- **Schema-change deploys**: CI runs `migrate deploy` on push, but the Vercel deploy usually goes live first — new code reading a new column 500s until the migration lands. Apply the migration to production **before** pushing: `DATABASE_URL=<prod url with :5432> npx prisma migrate deploy`.

## Architecture

Next.js 15 **pages router** (not app router), TypeScript, Ant Design 5 + styled-components (styles typically in a sibling `styles.tsx` imported as `S`).

### Data model hierarchy (Prisma)

`Org → Account → User`. A `Project` belongs to both an Org and an Account. Projects hold line items: `SingleUseLineItem`, `ReusableLineItem`, `EventFoodwareLineItem`, `LaborCost`, `OtherExpense`, `WasteHaulingCost`, `Dishwasher`, `DishwasherSimple`. `Project.category` is `default` (advanced/ongoing), `event` (simple/one-time, treated as "Actuals"), or `eugene`.

### Calculator engine

- Entry point: `lib/calculator/getProjections.ts` → returns `{ annualSummary, environmentalResults, financialResults, singleUseResults, reusableResults, bottleStationResults }`.
- Individual calculations live in `lib/calculator/calculations/`; constants (state utility rates, emission factors) in `lib/calculator/constants/`.
- DB → calculator input assembly: `lib/inventory/getProjectInventory.ts`.
- Static product catalogs: `lib/inventory/assets/reusables/` and `lib/inventory/single-use-products-data.csv`.
- Project wizard steps/modes: `lib/projects/steps.ts` (simple = event, advanced = default).

### Auth

Supabase Auth (Google OAuth + email/password) — Firebase was removed, but naming survives for backward compat: `lib/auth/auth.browser.tsx` exports `AuthContext` whose user field is still called `firebaseUser` (a `SessionUser` mapping Supabase User → `{ uid, email, displayName }`). Browser client: `lib/auth/supabaseClient.ts`; server: `lib/auth/supabaseServer.ts` (`createSupabaseApiClient` for API routes, `createSupabaseServerPropsClient` for getServerSideProps). OAuth callback: `pages/auth/callback.tsx`. `firebaseAdmin.ts` / `firebaseClient.ts` are dead code.

### Signup & onboarding

A Supabase auth user with no matching `User` row is redirected to `/onboarding`, which offers create-org or join-by-invite-code. `POST /api/user/register` has three paths: invite code (`Org.orgInviteCode`, 8-char hex) → join that org; work-email domain match → 409 with suggested orgs to join; otherwise create a new org + account. Upstream-admin UI access is gated by `Org.isUpstream` (see `lib/middleware/requireUpstream.ts`), **not** by `User.role` — `ORG_ADMIN` is the default role for every org creator/joiner and only controls org-level settings.

### API & client data fetching

- API routes in `pages/api/` use `next-connect` with middleware from `lib/middleware/`.
- Client hooks live in `client/` (react-query) — e.g. `client/projects.ts`.
- **There is no global `SWRConfig`** — any `useSWR` call must pass an explicit fetcher or it silently does nothing.

### Admin area (`pages/admin/`)

Data-science tooling: Factor Library (`constants/`, versioned factors with `calculatorConstantKey` lineage to TS constants), change requests, AI import (`data-science/import/`), pipeline traceability (`LINEAGE_MAP` in `lib/admin/lineageMap.ts`), and the Data Map (`data-science/data-map.tsx`, ReactFlow graphs in `components/admin/data-map/`).

### RSP API

Reuse Service Providers (`org.orgType = 'reuse-service-provider'`) push usage data to the public endpoint `POST /api/rsp/usage` (Bearer token, format `cr_rsp_{64hex}` stored as SHA-256 in `RspApiKey.keyHash`). Key utilities: `lib/rsp/apiKeyAuth.ts`. Partner-facing contract: `docs/RSP-API.md`.

- The endpoint resolves `client_id` against `(Account.rspOrgId, Account.rspClientId)` and **accepts the payload either way** — an unlinked `client_id` ingests attached to no account and never reaches a dashboard. `lib/rsp/payloadWarnings.ts` reports that (and unknown `reusable_type`, duplicate types, all-zero outbound) in the response's `warnings[]` so a partner can't integrate successfully-but-wrong. Links are managed in Super Admin → RSP Hub → *(org)* → Client links (`/api/admin/rsp/client-links`).
- `dry_run: true` in the body (or `?dry_run=true`) validates and prices a payload without storing anything — how a partner tests before go-live. Logged with `outcome: 'dry_run'`.
- End-to-end check against a running dev server: `npx tsx scripts/verify-rsp-intake.ts` (creates and cleans up a throwaway RSP; `--keep` leaves it behind).
- `RSP_IMPACT_FACTORS` in `lib/rsp/impactFactors.ts` is hardcoded placeholder values, **not** sourced from the Factor Library — RSP metrics are provisional.

### Feature flags

`lib/featureFlags.ts` — hardcoded org IDs, not a flag service.

## Gotchas

- The Vercel build target does not support spreading a Set (`[...new Set(x)]`) — use `Array.from(new Set(x))`.
- Stripe is retained but not required for signup; the README's Firebase/Heroku/Stripe signup flow description is outdated.
- Prisma workflow guidance (migration drift recovery): `docs/PRISMA_WORKFLOW.md`.
