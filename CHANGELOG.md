# Changelog

All notable changes to Chart-Reuse by Upstream are tracked here.
Milestones represent batches of changes that meaningfully improve the product.

> Entries from Milestone 3 through 2026-07 were backfilled on 2026-07-17 from git history. Current-state architecture lives in `docs/ROADMAP.md`.

---

## Docs Consolidation & Nav Cleanup (2026-07-08 → 2026-07-17)

**Goal:** Move development to Claude Code; make the markdown docs trustworthy again.

### Changes

- **v2 nav**: Removed Analytics from the Chart-Reuse 2.0 top menu (still reachable via the dashboard's "Open full Reporting" link).
- **CLAUDE.md**: Added AI-assistant working notes at repo root — commands, architecture summary, production-script gotchas (pgbouncer, tsx), onboarding flow.
- **Docs consolidation**: Rewrote the architecture reference from scratch after auditing every doc against code (it still described Firebase/Heroku); renamed it `docs/SYSTEM_OVERVIEW.md` → `docs/ROADMAP.md` as the product source of truth. README rewritten for the Supabase/Vercel stack. Deprecation banners added to superseded docs (`AUTH_MIGRATION_GUIDE.md`, `getting-started.mdx`, `services.mdx`, `overview.mdx`).
- **Fixes**: Corrected stray "Trutlyse" product name in the user guide; backfilled this changelog.

---

## Variable-Based Data Product Designer (2026-05-24 → 2026-05-25)

**Goal:** Adalo-style variable system for the Data Product Designer.

### Changes

- **Phase 1**: Variable-based designer — input/constant/calculation variables as canvas nodes; constant sources expanded to Factor categories + product catalogs.
- **Phase 2**: Calculation variables with a pill-style formula editor; inline formula viewer on Calculation nodes.
- **Canvas UX**: Live test inputs on canvas, auto-derived dependency edges, node hover edit/remove, modal state re-seeding fixes.
- **Calculator UX**: Step 3 now asks for Return Rate instead of repurchase cases.

---

## Onboarding Revamp & Transactional Email System (2026-05-21 → 2026-05-23)

**Goal:** Smooth new-user first run and bring email templates under admin control.

### Changes

- **Onboarding**: Renamed `/setup/trial` → `/onboarding` with a two-card create-org / join-org picker; sign-out escape hatch; signup dupe detection with suggested same-domain orgs.
- **Join requests**: New `JoinRequest` model + `MEMBER` role; members page shows pending requests with approve/decline.
- **Email system**: New `EmailEvent` model seeding 4 transactional events; central `sendEvent()` with bulletproof HTML shell; WYSIWYG email editor at `/admin/emails` (Upstream-only).

---

## Chart-Reuse 2.0 (2026-05-20 → 2026-05-21)

**Goal:** Redesigned information architecture separating forecasts from measured results.

### Changes

- **Schema**: Added `Project.dataType` (`projection | actual`).
- **New pages**: `/dashboards` (actuals) split from `/calculators` (projections); `/dashboard` home with KPI drill-down stat cards; Get Started cards pointing at new tutorial pages; DB-backed feature voting widgets.
- **Analytics**: Simplified — removed baseline/forecast charts in favor of stat-card drill-downs.
- **Scenarios**: Rebuilt as policy modeling with two-scenario A/B comparison and ImpactCard visuals.
- **Rollout**: v2 toggle (localStorage + `isUpstream`) gated to Upstream orgs for launch; nav reshuffle.
- **CI**: Workflow Node 18 → 20; prisma migrations auto-apply to production on every `main` push.

---

## RSP Simulator, Duplicates & Event Foodware Editor (2026-05-19)

**Goal:** Admin tooling batch.

### Changes

- **RSP simulator**: Generate simulated RSP orgs, keys, and usage bursts from the admin test hub.
- **Duplicates detection**: Admin page for detecting/merging duplicate orgs.
- **Event foodware editor** and venue categories on accounts.

---

## Data Product Designer (2026-03-29 → 2026-04-10)

**Goal:** Let the data scientist design calculators inside the product instead of spreadsheets.

### Changes

- **Designer**: Node-based flow canvas (`DataProductDefinition` model) with **AI-powered flow generation** — describe a calculator, get a generated flow plus gap analysis.
- **InspectMode**, data-product gap detection, live calculator preview, and calculation editor (2026-04-10 iteration).

---

## Data Map Graph Explorer & Registries (2026-03-21 → 2026-03-27)

**Goal:** Deepen the data map and make calculation code discoverable.

### Changes

- **Graph explorer** iteration of the data map; methodology page; schema registry; calculator docs.
- **Calculations registry fixes**: static registry + `LINEAGE_MAP` fallback so all 28 functions render on Vercel (where source files aren't available).

---

## v1.9 — Data Map + RSP Observability (2026-03-05 → 2026-03-06)

**Goal:** Visual observability for the whole data pipeline.

### Changes

- **Data Map page** (`admin/data-science/data-map`) with mode control: System | RSP API | Actuals | Projections; ReactFlow + dagre layouts.
- **System view**: full-architecture graph (input → raw data → assumptions → engine → outputs) with layer labels, health signals, path highlighting, rich per-node drawers.
- **RSP observability**: paginated ingestion feed, single-period trace graph, API playground; `ingestUsagePeriod()` extracted to `lib/rsp/` with built-in health checks writing `DataHealthIssue` rows; issue badges on graph nodes.
- **Actuals/Projections trace modes**: per-project input→output chains with colored animated edges.
- **Key fix**: added missing SWR fetchers across trace graphs (no global `SWRConfig` — raw `useSWR` silently no-ops) and switched API middleware to `getSession()` for reliability.

---

## v1.8 — Data Governance Admin Overhaul (2026-03-02 → 2026-03-05)

**Goal:** Auditable calculation governance: every computed number traceable to pinned factor versions.

### Changes

- **Methodology Snapshots**: pinned sets of factor versions (draft/published/deprecated).
- **ComputeRun + MetricResult**: wired into all compute paths so every calculation run is recorded with provenance; run history + detail pages.
- **Lineage & simulation**: analytics lineage visualization, impact simulator, FactorVersion bootstrap.
- **Data health**: `DataHealthIssue` model, scan engine (`lib/admin/dataHealthScan.ts`), Data Inputs page with auto-scan.
- **Nav restructure**: Data Science group reframed as Data Governance; overview page redesigned with architecture diagram and how-it-works sections.
- **Admin**: user role change + password reset tools.

---

## Milestone 6 — RSP Test Hub, AI Insights & Admin Projects (2026-03-01)

**Goal:** Close the loop on RSP testing and give admins AI-assisted analysis.

### Changes

- **RSP Test Hub** (`admin/rsp/test-hub`) for exercising the usage API end-to-end.
- **AI Insights**: Claude-generated admin insights (`AdminInsight` model) with hardened JSON parsing.
- **Admin All-Projects** page across every org.

---

## Milestone 5 — Project Milestones & Impact Timeline (2026-03-01)

**Goal:** Track real progress over time, not just point-in-time projections.

### Changes

- **`ProjectMilestone` model**: point-in-time KPI snapshots (manual, seed, or RSP-sourced) via "Save Snapshot" on projections.
- **Environmental break-even**: `getEnvBreakEven()` — embodied CO2 of reusables ÷ annual CO2 savings → months; new KPI card.
- **Impact Timeline** chart on analytics (per-project lines, CO2/cost/waste/water metric toggle).
- **Projects page**: All/Projections/Actuals filter.

---

## Milestone 4 — RSP API Integration (2026-03-01)

**Goal:** Let Reuse Service Providers (e.g. Sharewares) push usage data automatically.

### Changes

- **Schema**: `RspApiKey` (SHA-256 hashed keys, `cr_rsp_{64hex}`), `UsageTimePeriod`, `UsagePeriodProduct`, org profile fields, account↔RSP linkage.
- **Public endpoint**: `POST /api/rsp/usage` with Bearer-token auth and temporal dedup.
- **Settings restructure**: `/settings` page with Account/Org/API Integration tabs (replaces the settings modal); admin RSP dashboard + key management.

---

## Milestone 3 — Admin Console & Data Science Foundation (2026-02-26 → 2026-03-01)

**Goal:** A real admin area and the beginnings of methodology governance.

### Changes

- **Admin console**: renamed Upstream → Admin with org/user management pages, impersonation, and an in-app feedback widget.
- **Factor Library**: versioned factors (153 seeded) with categories, sources, and `calculatorConstantKey` lineage to TS constants; change-request workflow.
- **Data Science dashboard**: golden datasets, test runs, constants pages.
- **Methodology system**: TipTap-based methodology documents with subsections and data lineage page.
- **AI-powered importer**: classify uploaded data with Claude, map to schema, apply (`ImportSession`).
- **Analytics**: advanced filtering (tag, project type, date range); multi-page Info Pages replace Recommendations.
- **Prisma safe workflow**: `safe-prisma-operations.sh` + `prisma:validate/status/sync/reset-safe` scripts to prevent migration drift (`docs/PRISMA_WORKFLOW.md`).

---

## Milestone 2 — Responsive UI (2026-02-25)

**Goal:** Production-grade responsive layout across the entire app — no overflow, no horizontal scrolling, stack on mobile.

### Changes

- **Form wrappers**: Changed `width: 317px` → `max-width: 317px; width: 100%` across 12 form style files (login, signup, reset-password, org/account setup, member invite/edit, etc.) — forms now shrink gracefully on narrow screens instead of overflowing.
- **Project setup wrapper**: Changed `width: 460px` → `max-width: 460px; width: 100%` in `ProjectSetup.tsx` and `components/projects/[id]/styles.tsx`.
- **Common Container**: Added `padding: 0 1rem` for edge-to-edge breathing room on small screens.
- **FormPageLayout logo**: Fixed hardcoded `width: '600px'` → `maxWidth: '600px', width: '100%'` on the logo container; header stacks on mobile with `flex-wrap`.
- **Dashboard content padding**: Reduced `ContentContainer` padding from `2rem` flat to `1rem` on mobile / `2rem` on `≥768px`.
- **Mobile hamburger nav**: Added `MenuOutlined` button (visible `<768px`) + Ant Design `Drawer` with full navigation links on mobile — replaces the `disabledOverflow` horizontal Menu that was clipping on small screens.
- **StepsNavigation**: Made the project step breadcrumb bar horizontally scrollable on mobile (`overflow-x: auto`, scrollbar hidden) with a `min-width: 100px; flex-shrink: 0` per step so labels stay readable.

---

## Milestone 1 — Firebase → Supabase Migration & Production Deploy (2026-02-24)

**Goal:** Replace Firebase auth with Supabase, remove mandatory Stripe from signup, deploy to Vercel.

### Changes

- **Auth provider**: Replaced Firebase Auth entirely with Supabase (`lib/auth/supabaseClient.ts`, `lib/auth/supabaseServer.ts`). Removed `firebaseAdmin.ts` / `firebaseClient.ts` (now dead code).
- **Google OAuth + email/password**: `auth.browser.tsx` now provides `signInWithGoogle`, `signInWithPassword`, and `resetPassword` via Supabase.
- **Login form**: Rebuilt `components/login/LoginForm.tsx` with email/password fields, forgot-password flow, and Google sign-in — replaces Firebase-only Google button.
- **Auth callback**: `pages/auth/callback.tsx` exchanges Supabase code for session, then auto-links by email for seeded Firebase-era users (updates `User.id` to new Supabase UUID via raw SQL).
- **Account linking**: `lib/middleware/getUserFromContext.ts` includes email-based fallback so seeded users are re-linked to their Supabase UUID on first login.
- **Stripe-free signup**: Added `pages/api/user/register.ts` endpoint; removed Stripe checkout from the trial signup flow.
- **Prisma + Supabase production**: Added `binaryTargets` for Vercel Linux, PgBouncer-safe `getDatabaseUrl()` in `lib/prisma.ts`.
- **Seed script**: Added `seedUsers()` + converted all line-item inserts to `createMany` for bulk performance. Seeded 109 orgs, 115 accounts, 291 projects, 2718+ line items.
- **Template text overflow fix**: `ProjectTemplates.tsx` — added `wordBreak: 'break-word'` + `whiteSpace: 'pre-wrap'` to prevent long project names from breaking card layout.
- **Production**: Deployed to https://chartreuse-bay.vercel.app with Supabase (DB + auth) + Vercel.
