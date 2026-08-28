# Chart-Reuse — Product Roadmap & System Overview

**This is the source-of-truth document for the product: what it is today and where it's heading.** (Formerly `SYSTEM_OVERVIEW.md`.) The architecture sections below were regenerated 2026-07-15 by auditing every section against the live codebase. If this doc and another markdown file disagree, trust this one (and fix the other). For the history of what shipped when, see `CHANGELOG.md`; for AI-assistant working notes see `CLAUDE.md` at the repo root.

**Doc map — what remains authoritative elsewhere:**

| Doc | Role |
|---|---|
| `docs/CALCULATOR_BUILD_PROMPT.md` | Calculation methodology: material emission/water factor tables, formulas, dishwasher profiles. The "why" behind `lib/calculator/constants/`. |
| `docs/ACTUALS.md` | RSP/Sharewares Actuals API gap analysis and proposed schema improvements (live design doc). |
| `docs/PRISMA_WORKFLOW.md` | Database migration runbook (drift recovery, safe operations). |
| `docs/user-guide.md` | End-user walkthrough. |
| `CHANGELOG.md` | Milestone history. |
| `README.md` | Quick start only; points here. |
| `docs/AUTH_MIGRATION_GUIDE.md`, `docs/getting-started.mdx`, `docs/services.mdx` | **Superseded** — kept only with deprecation banners. |

---

## 1. What the App Does

Chart-Reuse (by Upstream Solutions) is a SaaS calculator that projects the **cost and environmental savings** of switching from single-use to reusable foodware. Customers (venues, schools, stadiums, restaurant groups) enter their current single-use purchasing and planned reusable program; the engine produces financial results (payback, ROI, annual savings) and environmental results (GHG, water, waste, environmental break-even).

Two data paths:
- **Projections** — forward-looking forecasts from inventory inputs (`lib/calculator/getProjections.ts`).
- **Actuals** — measured results, either entered per event or ingested automatically from Reuse Service Providers via the public RSP API (`lib/calculator/getActuals.ts`, `lib/rsp/`).

## 2. Domain Glossary

- **Org** — the tenant (a customer organization). Billing, currency, and sharing settings live here.
- **Account** — a sub-entity of an Org (e.g. one venue or client of an RSP). Projects belong to an Account.
- **Project** — one calculator scenario: a set of line items plus computed projections. Has a `category` (default/event/eugene) and a `dataType` (projection/actual).
- **Inventory** — the assembled calculator input for a project (line items + product catalog data).
- **Upstream** — Orgs with `isUpstream = true` are staff; this flag gates the entire `/admin` area and v2 UI.
- **RSP** — Reuse Service Provider (e.g. Sharewares): an Org (`orgType = 'reuse-service-provider'`) that pushes usage data for its client Accounts via API.

## 3. Tech Stack & External Services

Next.js 15 **pages router** (not app router), TypeScript, Prisma 6 + PostgreSQL, Ant Design 5 + styled-components (styles in sibling `styles.tsx` imported as `S`), `@ant-design/plots` for charts, ReactFlow + dagre for graph canvases, SWR for client data fetching, Jest for tests. Package manager is **Yarn**; dev server uses Turbopack.

| Service | Role |
|---|---|
| Vercel | Hosting + CI deploy of `main` → https://chartreuse-bay.vercel.app |
| Supabase | Production Postgres **and** auth (Google OAuth + email/password) |
| Stripe | Billing (retained; no longer part of signup) |
| Anthropic API | AI features: import classification, admin insights, data-product designer |
| Mixpanel + GA | Product analytics |
| Mailchimp | Transactional/marketing email (`lib/mailchimp/`); `lib/mailgun.ts` is legacy |
| Google Maps | Location lookup |

Legacy note: Firebase packages and `lib/auth/firebase*.ts` still exist but are **dead code** — real auth is Supabase throughout. The `AuthAdapter` abstraction in `lib/auth/adapter.ts`/`config.ts` is vestigial; its Firebase implementation is unimplemented stubs. Do not set `AUTH_PROVIDER=firebase`.

## 4. Data Model (Prisma)

`prisma/schema.prisma` (~40 models). Grouped:

**Tenancy & identity** — `Org` → `Account` → `User` hierarchy. `User.role` is `ORG_ADMIN | ACCOUNT_ADMIN | MEMBER` (role controls org-level settings only; admin UI is gated by `Org.isUpstream`, not role). `Org` carries Stripe fields, `currency`/`useMetricSystem`, `orgInviteCode` (join-by-code), `analyticsSlug` (public analytics page), and profile fields (`orgType`, `country`, `employeeCount`, `reuseJourneyStage`, …). `Invite`, `JoinRequest`, `ImpersonationSession`, `UserEvent`.

**Projects & line items** — `Project` (belongs to Org + Account; `category: default|event|eugene`, `dataType: projection|actual`, `publicSlug`, `shareSettings` Json, optional self-referencing `templateId`). Line items: `SingleUseLineItem` (+ dated `SingleUseLineItemRecord`), `ReusableLineItem`, `EventFoodwareLineItem`, `LaborCost`, `OtherExpense`, `WasteHaulingCost`, `TruckTransportationCost`, `Dishwasher`, `DishwasherSimple`. `ProjectMilestone` stores point-in-time KPI snapshots. `ProjectTag`/`ProjectTagRelation` for org-scoped tagging.

**Methodology governance (data-science)** — `FactorCategory`/`FactorSource`/`Factor`/`FactorVersion`/`FactorDependency` (versioned emission & calculation factors; `Factor.calculatorConstantKey` links each DB factor to its TypeScript constant path), `ChangeRequest` (factor change review workflow), `MethodologySnapshot`(+`Factor`) (pinned factor-version sets), `ComputeRun` + `MetricResult` (audited calculation runs), `GoldenDataset`/`TestRun`/`TestRunResult` (regression fixtures), `DataHealthIssue`, `DataProductDefinition` (AI-designed calculators/dashboards with execution code), `ImportSession`, `AdminInsight`, `MethodologyDocument`.

**RSP integration** — `RspApiKey` (SHA-256 `keyHash`, `keyPrefix`), `UsageTimePeriod` (ingested usage window with computed impacts and supersession chain), `UsagePeriodProduct`, `RspApiActivityLog`.

**Misc** — `EmailEvent` (editable email templates), `FeedbackSubmission`, `FeatureRequest`/`FeatureVote`.

## 5. Application Structure

### User-facing pages (`pages/`)

Two navigation modes, both rendered by `layouts/BaseLayout.tsx`:

- **Legacy nav:** Projects · Analytics (`/org/analytics`) · Accounts.
- **v2 nav ("Chart-Reuse 2.0"):** Calculators (`/calculators`) · Dashboards (`/dashboards`) · Scenarios (`/scenarios`) · Accounts. Home is `/dashboard` (KPI drill-down cards), reached via the logo. `/org/analytics` still exists, reachable from the dashboard's "Open full Reporting" link.
- **v2 gating:** `hooks/useChartReuse2.tsx` — a per-user localStorage toggle, ANDed with `user.org.isUpstream` in BaseLayout. It is *not* in `lib/featureFlags.ts`.

Other notable routes: `login`, `onboarding` (post-auth org creation/join), `setup/account`, `settings/` (account/org/RSP API keys), `projects/[id]/*` (calculator step tabs + settings), `members`, `invite-*`, `subscription(-live)`, `methodology/`, `tutorials/`.

**Public (unauthenticated) share pages:** `share/[slug]` + `/assumptions` (org projections), `share/p/[slug]` (single project via `Project.publicSlug` + `shareSettings`), `share/analytics/[slug]` (org analytics via `Org.analyticsSlug`). Logic in `lib/share/`.

### Admin area (`pages/admin/`) — gated by `Org.isUpstream`

- **Platform management:** orgs (+detail), users, all projects, duplicates (detection/merge), feedback, emails (template editor), analytics, methodology CMS.
- **Data-science suite (`admin/data-science/`):** constants (Factor Library), change-requests, golden-datasets, test-runs, runs (compute-run history), snapshots, calculations registry, inputs, data-map (ReactFlow system/trace graphs), lineage, impact simulator, import (AI classification), pipeline, data-products (AI flow designer).
- **RSP hub (`admin/rsp/`):** dashboard, api-keys (+key detail), activity feed, test-hub/simulator.

The old `pages/upstream/` area is vestigial (two pages); `/admin` is the real staff area.

## 6. Calculator Engine (`lib/calculator/`)

- **Entry points:** `getProjections(projectId)` / pure `getProjectionsFromInventory(inventory)` → `ProjectionsResponse` `{ annualSummary, environmentalResults, financialResults, singleUseResults, reusableResults, bottleStationResults, eventCostResults }`. `getAllProjections(projects)` batches an org-wide rollup. `getActuals(inventory, {dateRange, categoryId})` handles the measured-data path.
- **Input assembly:** `lib/inventory/getProjectInventory.ts` (DB → calculator input).
- **Calculations:** `calculations/` — `getAnnualSummary`, `getEnvironmentalResults`, `getFinancialResults`, `getEnvBreakEven` (embodied CO2 of reusables ÷ annual CO2 savings → months), plus subfolders `foodware/` (single-use, reusable, event-cost, bottle-station, return-rate), `dishwashing/`, `ghg/`, `waste/`, `water/`.
- **Constants:** `constants/` — emission factors, materials, state utility rates (`utilities.ts`), dishwashers, conversions, venue categories, waste hauling, etc. Methodology and factor sources are documented in `docs/CALCULATOR_BUILD_PROMPT.md`; the admin Factor Library mirrors these constants in the DB via `calculatorConstantKey`.
- **Core concepts:** baseline (current single-use spend) vs forecast (reduced single-use + reusables + operating costs); frequency multipliers annualize usage; repurchase % models reusable replacement.
- **Tests:** `__tests__/calculator.spreadsheet.spec.ts` validates against spreadsheet fixtures. Golden datasets + test runs in the admin area provide DB-driven regression testing on top.

## 7. Project Modes & Categories

`lib/projects/steps.ts` defines two wizard modes:
- **simple** (event projects): Dashboard → Foodware → Usage → Dishwashing → Transportation.
- **advanced** (default): Dashboard → Single-Use purchasing → Reusables purchasing → Dishwashing → Additional costs.

`Project.category`: `default` (ongoing program), `event` (one-time, treated as "Actuals"), `eugene` (bespoke). Category access is gated by `lib/projects/categories.ts` + `lib/featureFlags.ts`. `Project.dataType` (`projection|actual`) additionally distinguishes forecast vs measured data. Templates live in `lib/projects/templates/`.

## 8. Authentication & Authorization

- **Supabase Auth** — Google OAuth + email/password. Browser client `lib/auth/supabaseClient.ts`; server `lib/auth/supabaseServer.ts` (`createSupabaseApiClient` for API routes, `createSupabaseServerPropsClient` for getServerSideProps). OAuth callback: `pages/auth/callback.tsx`.
- **Backward-compat naming:** `lib/auth/auth.browser.tsx` exports `AuthContext` whose user field is still called `firebaseUser` (a `SessionUser` mapping Supabase User → `{ uid, email, displayName }`).
- **Middleware (`lib/middleware/`):** `defaultHandler()` (no auth) / `handlerWithUser()` (Supabase session → Prisma `User`, with email-based re-linking of Firebase-era records) / `projectHandler()` (adds project ownership validation). `requireUpstream` gates admin routes on `Org.isUpstream`. SSR guard `checkLogin`: no session → `/login`; session but no DB user → `/onboarding`.
- **Onboarding (`POST /api/user/register`):** three paths — invite code (`Org.orgInviteCode`, 8-char hex) joins that org; work-email domain match returns 409 with suggested orgs; otherwise creates a new Org + Account. First user gets `ORG_ADMIN`.
- **Impersonation:** admins can impersonate users via `ImpersonationSession` + `/api/admin/impersonate`.

## 9. API Surface (`pages/api/`)

Routes use `next-connect` with the middleware above. Domains: user/org/account/profile, invites & join-requests, projects (per-project: projections, usage, milestones, share, share-settings, banner-upload, line-item CRUD + bulk Excel import, inventory up/download), line-item resources (dishwashers, events, labor-costs, other-expenses, waste-hauling), inventory catalogs, feedback & feature-requests, Stripe, and a large `api/admin/*` tree (factors, change-requests, compute-runs, data-health, data-map, data-products incl. AI generate, import classify/apply, insights, methodology, RSP management + simulator, impersonation, user role/password management).

**Public endpoints:** `POST /api/rsp/usage` (Bearer token), `GET /api/share/analytics/[slug]`, plus signup-time helpers (`/api/user/register`, `/api/orgs/suggest`, `/api/invite-signup`, `/api/join-requests`).

## 10. RSP Integration

RSPs push usage data machine-to-machine: `POST /api/rsp/usage` with `Authorization: Bearer cr_rsp_{64hex}`. Keys are stored as SHA-256 hashes (`RspApiKey.keyHash`; utilities in `lib/rsp/apiKeyAuth.ts`), validated per request, and every call is logged to `RspApiActivityLog`. Ingestion (`lib/rsp/ingestUsagePeriod.ts`) resolves the client `Account` (`rspClientId`/`rspOrgId`), writes `UsageTimePeriod`/`UsagePeriodProduct` with computed impacts (`lib/rsp/impactFactors.ts` — currently flat per-unit factors; see `docs/ACTUALS.md` for the critique and improvement plan), and supports temporal supersession. Admin tooling: `admin/rsp/*` (keys, feed, simulator); customer-facing key management under `/settings`.

## 11. Feature Flags

`lib/featureFlags.ts` — hardcoded org-ID allowlists (plus `isUpstream` and dev mode), not a flag service. Gates event projects and Eugene features. The v2 UI toggle is separate (see §5).

## 12. Product Catalog

Static, code-committed catalogs: single-use products in `lib/inventory/single-use-products-data.csv` (+ `assets/upstream/`, `assets/taco-bell/`), reusables in `lib/inventory/assets/reusables/`, event foodware in `assets/event-foodware/`. Loaded via `getSingleUseProducts` / `getReusableProducts` / `getFoodwareOptions`. Bottle station is product ID `171` (`lib/calculator/constants/reusable-product-types.ts`). The admin Data Products area (`DataProductDefinition`) is the beginning of DB-driven product/calculator definitions, but the CSV catalogs remain the runtime source.

## 13. Billing

Stripe is retained (`lib/stripe/`, `/api/stripe/*`, `Org.stripeCustomerId/stripeSubscriptionId`, `subscription(-live).tsx`) but **is not part of signup** — signup is Supabase OAuth → onboarding. Subscription management is a standalone flow.

## 14. Multi-currency & Units

`Org.currency` (default USD) with formatting via `lib/currencies/` and the `<CurrencySymbol />` component + `CurrencyProvider` (use these, not the legacy `formatToDollar`). `Org.useMetricSystem` drives unit conversion in `lib/number.ts`.

## 15. Local Development & Operations

### Environment

`.env` (local) / `.env.production` (production values, used by one-off scripts). Required vars: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; optional: `ANTHROPIC_API_KEY`, Stripe keys, Mixpanel, Google Maps. (Any `NEXT_PUBLIC_FIREBASE_*` template you find elsewhere is obsolete.)

### Setup & daily commands

```bash
yarn                        # install
yarn dev                    # dev server (Turbopack) at :3000, local Postgres via .env
yarn build                  # prisma generate + next build
yarn test                   # jest watch mode; yarn test:ci for single run
yarn prisma:validate|status|sync   # safe Prisma workflow (docs/PRISMA_WORKFLOW.md)
npx tsx scripts/seed.ts     # seed local DB
```

Local DB: Postgres.app, database `chartreuse_local` (`psql` at `/Applications/Postgres.app/Contents/Versions/latest/bin`).

### Production database rules

- App connects through the Supabase **transaction pooler (port 6543)**; `lib/prisma.ts` auto-appends `?pgbouncer=true&sslmode=require` in production.
- **Migrations must use the direct connection (port 5432)** with `npx prisma migrate deploy`.
- One-off scripts against production: `npx dotenv-cli -e .env.production -- npx tsx scripts/foo.ts`. A script constructing its own `PrismaClient` must append `?pgbouncer=true&sslmode=require` itself or the pooler fails with `prepared statement "s0" already exists`. Scripts must live inside the repo (import resolution) and wrap logic in an async `main()` (no top-level await under tsx).
- Diagnostics: `scripts/inspect-user-org.ts <email>` prints a user's DB record, org/account tree, and Supabase auth status.
- Run the app locally against production data: `NEXT_PUBLIC_REMOTE_USER_ID=<user_id> yarn start:remote` (uses `.env.production`).

### Branches & restore points

| Ref | What it is |
|---|---|
| `main` | The live line. Vercel auto-deploys it. Currently **Chart-Reuse Legacy** (Methodology 1.0). |
| **tag `chartreuse-legacy-v1.0`** | **Immutable restore point** at the last pre-2.0 state (`1f36d61`, 2026-08-15): RSP API + partner portal, accounts rework, ingestion-model docs, datasheet, databases, smart fields. `git checkout chartreuse-legacy-v1.0` to return; `git checkout -b <name> chartreuse-legacy-v1.0` to work from it. |
| `chartreuseV2` | **Chart-Reuse 2.0** — Madhavi's Combined Data & Calculation Model as versioned databases, the v2 engine, golden datasets, methodology versioning, the Command Center. Not merged; carries **7 migrations** that must be applied to production *before* any merge-and-deploy. |
| `feat/regional-grid-factors` | Regional grid carbon intensity, built and held pending data-science sign-off (backlog #15). |

Because 2.0 changes what the calculator produces, the legacy tag is the guarantee: whatever
happens on `chartreuseV2`, the last known-good legacy state is one checkout away.

### Deployment

Push to `main` on `derekupstream/chartreuse` → Vercel auto-deploys. `prisma/schema.prisma` needs `binaryTargets = ["native", "rhel-openssl-3.0.x"]` for Vercel Linux. The Vercel build target does not support spreading a Set (`[...new Set(x)]`) — use `Array.from(new Set(x))`.

### Client data-fetching gotcha

There is **no global `SWRConfig`** — `client/helpers.ts` wrappers (`useGET`, `usePOST`, …) supply fetchers, but any raw `useSWR` call must pass an explicit fetcher or it silently does nothing.

## 16. Strategic Partners & Forward Roadmap

### ECCC (Environment and Climate Change Canada) — primary partner

Funder, Canadian data supplier, and prospective fee-for-service client. ECCC is referencing
Chart-Reuse in its **five-year funding renewal documents** and has raised contracting Upstream
for additional work (Robert, 2026-08). What they want, in order of commitment:

1. **A Canada-accurate Chart-Reuse** — provincial electricity rates (shipped, Hydro-Québec
   2025), regional grid carbon intensity (built, held — `feat/regional-grid-factors`),
   Canadian gas/water rates, CAD handling, and Canadian reusable product pricing (A-P's ask,
   with ECCC supplying the data). Backlog #15–17 + P0 #4.
2. **A Canadian project template** ("C-R template") co-built at the planned **Q4 2026 working
   session**. Backlog #18.
3. **To supply data as a versioned source** — their rates/prices arrive through the workbook
   diff-and-choose flow as named, source-attributed data releases, citable in the policy
   documents they write. Backlog #19a.
4. **Policy scenario comparison** — "coffee shops only vs coffee shops + schools" by geography
   and time horizon: the Product Studio's *scenario* type with ECCC as the marquee user, and
   the most likely paid-contract deliverable. Backlog #19b, spec in
   `docs/CR2-PRODUCT-STUDIO-SPEC.md`.
5. **Institutional trust requirements** — methodology versioning and stamps (shipped),
   calculation transparency for account owners (#19c), and **French** (Official Languages
   Act — scope on the Q4 call, #19).

### Other active partnerships

- **StopWaste** — California school-district data powering the schools calculator
  (back end complete est. end 2026; public launch Q1 2027).
- **Sharewares & 99Bridges** — RSP API beta, October 2026 (`docs/RSP-API.md`).
- **City of Berkeley** — reuse incentive program tracking (unpaid).
- **City of Seattle** — paused on data-confidentiality concerns; route: receive their data via
  the RSPs serving the city; legal agreements in drafting.

The full prioritized work list lives in `docs/BACKLOG.md`; the 2.0 methodology transfer in
`docs/CR2-CALC-MODEL.md`; the admin/product-studio direction in `docs/CR2-PRODUCT-STUDIO-SPEC.md`;
versioning semantics in `docs/VERSIONING.md`.
