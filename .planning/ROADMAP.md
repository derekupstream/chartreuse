# Roadmap: ChartReuse (derekupstream fork)

## Overview

Four phases that take a forked brownfield Next.js calculator from "running on someone else's infrastructure" to a production-quality tool with modernized auth, a configurable Share & Export system, multi-year projections, and AI-driven recommendations. Each phase delivers a coherent, independently verifiable capability before the next begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Fork & Own Deployment** - Get the forked app running on own infrastructure with all services wired up — no code changes yet
- [ ] **Phase 2: Auth Modernization** - Replace Firebase auth with Supabase Auth (email/password, sessions, password reset, route protection)
- [ ] **Phase 3: Product & UX Improvements** - Calculator enhancements, Share & Export panel, mobile responsiveness, analytics, multi-year projections, and reporting tools
- [ ] **Phase 4: AI Recommendations** - Rule-based recommendation engine + LLM narrative rendering on the projections dashboard

## Phase Details

### Phase 1: Fork & Own Deployment
**Goal**: The forked app runs end-to-end on own infrastructure (Vercel + Heroku Postgres + Firebase + Stripe + Mailgun) with no dependency on Upstream's accounts
**Depends on**: Nothing (first phase)
**Requirements**: FORK-01, FORK-02, FORK-03, FORK-04, FORK-05, FORK-06, FORK-07, FORK-08
**Success Criteria** (what must be TRUE):
  1. The app is accessible at a Vercel deployment URL controlled by the derekupstream account
  2. A new user can sign up, create a project, enter product data, and view projections without error
  3. All third-party services (Postgres, Firebase, Stripe, Mailgun) are provisioned under own accounts — no Upstream credentials in any config
  4. Local development runs against own Postgres database with all Prisma migrations applied
**Plans**: TBD

Plans:
- [ ] 01-01: Infrastructure provisioning (Heroku Postgres, Vercel, Firebase, Stripe, Mailgun accounts + environment variables)
- [ ] 01-02: Local dev setup and smoke test (repo clone, Prisma migrations, end-to-end sign-up flow verification)

### Phase 2: Auth Modernization
**Goal**: Firebase is fully removed and Supabase Auth handles all authentication — every protected route remains protected, sessions persist, and password reset works
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07
**Success Criteria** (what must be TRUE):
  1. User can sign in with email and password via Supabase Auth (Firebase login no longer exists)
  2. User session persists across browser refresh without requiring re-login
  3. User can request a password reset and receive an email link that sets a new password
  4. All protected pages and API routes continue to reject unauthenticated requests after the Firebase cutover
  5. The `firebase`, `firebase-admin`, and `nookies` packages are absent from the codebase and all Firebase environment variables are removed from Vercel and Heroku
**Plans**: TBD

Plans:
- [ ] 02-01: Supabase project provisioning and Prisma migration (AUTH-07 — Supabase Postgres, schema additions for auth models)
- [ ] 02-02: Auth implementation and atomic route cutover (AUTH-01 through AUTH-04 — Supabase Auth config, session middleware, all protected routes switched in one commit)
- [ ] 02-03: Firebase removal and cleanup (AUTH-05, AUTH-06 — remove packages, purge env vars, verify no Firebase references remain)

### Phase 3: Product & UX Improvements
**Goal**: The calculator is more accurate and shows multi-year projections; users can configure and share a branded export; the app works well on mobile; analytics are filterable; and community-scale modeling is available
**Depends on**: Phase 2
**Requirements**: CALC-01, CALC-02, CALC-03, CALC-04, SHARE-01, SHARE-02, SHARE-03, SHARE-04, SHARE-05, SHARE-06, SHARE-07, SHARE-08, SHARE-09, UX-01, UX-02, UX-03, UX-04, PERF-01, ANLT-01, ANLT-02, PROJ-01, PROJ-02, PROJ-03
**Success Criteria** (what must be TRUE):
  1. The projections dashboard displays GHG, waste, and financial charts over a 1-10 year time range with a visible payback period crossover point, using EPA WARM 2025 emission factors
  2. User can open a "Share & Export" panel, toggle which sections and charts appear, switch between raw data and equivalency modes, add a title, narrative, and org logo, then generate both a shareable public link and a PDF export from the same configuration
  3. All core pages (projects list, project tabs, projections dashboard, and the public share page) render correctly on a mobile screen
  4. The analytics page can be filtered by date range and the user's filter/column configuration is saved and reloaded across sessions
  5. Community-scale projection tools allow modeling reuse impact at venue archetypes and scale using multipliers; active reuse system tracking compares actual usage to projections
**Plans**: TBD

Plans:
- [ ] 03-01: Calculator accuracy and multi-year projections (CALC-01, CALC-02, CALC-03, CALC-04 — EPA WARM 2025 constants, annual-slice projection engine, multi-year charts, payback crossover)
- [ ] 03-02: Equivalency library and projections/reporting tools (PROJ-01, PROJ-02, PROJ-03 — EPA equivalency factors, active reuse tracking, community/venue modeling)
- [ ] 03-03: Share & Export panel (SHARE-01 through SHARE-09 — panel UI, section toggles, equivalency/raw toggle, branding, shareable link, PDF export)
- [ ] 03-04: UX, mobile, performance, and analytics (UX-01, UX-02, UX-03, UX-04, PERF-01, ANLT-01, ANLT-02 — mobile responsiveness, nav restructure, settings API section, page load performance, analytics date filter, saved analytics views)

### Phase 4: AI Recommendations
**Goal**: The projections dashboard surfaces actionable, LLM-rendered recommendations derived from rule-based triggers — without blocking page load and without the LLM performing any arithmetic
**Depends on**: Phase 3
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05
**Success Criteria** (what must be TRUE):
  1. The projections dashboard identifies and displays recommendations based on rule-based conditions (payback period threshold, dominant material, dishwasher water outlier, repurchase rate anomaly, etc.)
  2. Recommendations are rendered as natural-language prose by an LLM — the page renders immediately and recommendations appear asynchronously when ready
  3. All numerical context passed to the LLM is pre-calculated by the rule engine — the LLM system prompt explicitly prohibits arithmetic, and no raw calculator inputs are passed
  4. Recommendations are stored per-project in the existing `recommendations (Json)` field so returning users see prior recommendations without waiting for another LLM call
**Plans**: TBD

Plans:
- [ ] 04-01: Rule-based recommendation engine (AI-01, AI-05 — threshold conditions, pre-calculated grounding context, no LLM arithmetic)
- [ ] 04-02: LLM narrative rendering and async delivery (AI-02, AI-03, AI-04 — LLM integration, async loading, per-project storage)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Fork & Own Deployment | 0/2 | Not started | - |
| 2. Auth Modernization | 0/3 | Not started | - |
| 3. Product & UX Improvements | 0/4 | Not started | - |
| 4. AI Recommendations | 0/2 | Not started | - |
