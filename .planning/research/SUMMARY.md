# Research Summary

**Project:** ChartReuse (derekupstream fork)
**Synthesized:** 2026-02-23
**Research Files:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Executive Summary

ChartReuse is a Next.js 15 pages-router SaaS calculator that computes GHG, waste, and water impact for organizations switching from single-use to reusable foodware. This milestone adds four meaningful capabilities on top of the existing brownfield codebase: replace Firebase auth with email/password auth, build a public REST API exposing the environmental impact engine to third-party callers, add PDF export for the projections dashboard, and extend the calculator to multi-year time-series projections with AI-driven recommendations. The research confirms that all four goals are achievable without introducing new chart libraries, switching frameworks, or standing up separate services — every recommendation leverages or extends what is already in the codebase.

The recommended auth replacement is Better Auth 1.4.x (not NextAuth v5 beta). Better Auth reached v1.0 stable in November 2024, has an official Prisma adapter, handles database sessions with email/password natively (NextAuth v5 cannot do this with Credentials), and has a documented Firebase migration path via on-demand email-matching. The public API should be a versioned namespace (`/api/v1/`) co-located in `pages/api/v1/`, rate-limited via Upstash Redis from day one, keyed by SHA-256-hashed API keys stored in Postgres, and backed directly by the existing pure-function calculator engine without creating a project record. PDF export has a clear two-phase strategy: enhance the existing `react-to-print` flow immediately (Phase 1), and use Puppeteer on a non-Vercel runtime for server-generated PDFs later (Phase 2). Multi-year projections require no new chart library — `@ant-design/plots` 2.3 already ships `Line`, `DualAxes`, and `Area` components.

The highest-risk element of the entire milestone is the Firebase-to-Better-Auth migration. The existing codebase has zero test coverage on auth middleware (documented in CONCERNS.md), Firebase UIDs are the current `User` primary key, and the cutover must happen atomically across all 15+ protected pages and API routes. A missed `checkLogin` call site becomes an unprotected route with no visible error. The second highest risk is the public API: without rate limiting at launch, a single caller can exhaust the Postgres connection pool and take down the entire SaaS app. Both risks have clear mitigations — they just require discipline to execute in the right order.

---

## Key Findings

### From STACK.md

| Technology | Decision | Rationale |
|------------|----------|-----------|
| `better-auth` ^1.4.18 | Add | Stable v1, Prisma adapter official, database sessions with email/password, Firebase migration documented |
| `@better-auth/cli` | Add (dev) | Auto-generates Prisma schema models; saves setup time |
| `puppeteer-core` + `@sparticuz/chromium-min` | Add (Phase 2 only) | Renders existing Ant Design SVG charts faithfully; the only PDF approach that works without rebuilding the dashboard |
| `react-to-print` | Upgrade 2.14 → 3.x | v3 adds better TypeScript types and hook improvements; Phase 1 PDF improvement costs nothing |
| `firebase` + `firebase-admin` + `nookies` | Remove | Replaced entirely by Better Auth after migration |
| `@ant-design/plots` 2.3 | Keep, extend | Already supports Line, DualAxes, Area — no new chart library needed for multi-year projections |
| NextAuth.js v5 | Reject | Still in beta; Credentials + database sessions broken by design; "no new feature work" per auth team |
| `@react-pdf/renderer` | Reject for this use case | Requires rebuilding entire dashboard; Ant Design components cannot render inside react-pdf |
| `jsPDF + html2canvas` | Reject | html2canvas does not render SVG; all Ant Design charts are SVG; output would be blank |

**Critical version note:** Better Auth must be v1.x or later. Do not use the older `next-auth` v5 beta. The Auth.js team (formerly NextAuth) has been absorbed into the Better Auth team and has ceased new feature development on the Auth.js codebase.

**Environment variable delta:** Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`. Remove 6 `FIREBASE_*` and `NEXT_PUBLIC_FIREBASE_*` variables after migration completes.

---

### From FEATURES.md

**Table Stakes (must ship for the API to be taken seriously):**
- Self-serve API key issuance (email → key → hashed in Postgres)
- Per-key rate limiting with HTTP 429 + `Retry-After` header and `X-RateLimit-*` headers
- `POST /api/v1/impact` — single-call "usage in, GHG/waste/water out" endpoint
- Versioned path (`/api/v1/`) from first commit
- Structured error responses (RFC 7807 Problem Details format)
- OpenAPI spec in `/docs/api/openapi.yaml` — machine-readable contract
- `methodology` block in response with EPA WARM factor provenance (makes output citable in sustainability reports)

**Differentiators (competitive advantage):**
- Baseline/forecast/change framing — unique among public carbon APIs; all competitors return totals, not deltas
- Multi-material product inputs (`primaryMaterial` + `secondaryMaterial`) — more accurate than single-material APIs
- Free tier without paywall — Climatiq's free tier is 250 calls/month; this API is positioned as genuinely free
- EPA WARM factor attribution in response — enables citation in sustainability reports
- Dishwasher utility impact as optional request section — no other public environmental API covers this

**Defer to v2+:**
- Industry benchmark percentile responses (requires k >= 10 data points per cohort to avoid re-identification; build ingestion pipeline now, surface when threshold is met)
- Batch endpoint `/impact/batch` (add based on API consumer feedback)
- LLM narrative rendering (add after rule-based recommendations are validated)

**AI Recommendations — ordered approach:**
1. Rule-based triggers first (5-10 threshold conditions: payback period, GHG savings %, dominant material, dishwasher water delta, repurchase rate outlier) — deterministic, free, auditable
2. LLM narrative rendering second — renders rule output as prose; never calculates; use `lib/ai/getRecommendations.ts` abstraction layer to avoid vendor lock-in

**Anti-features to avoid:**
- Do not require login for the public API — frictionless access is the value proposition
- Do not use GraphQL for a simple, stable input/output schema
- Do not let the LLM calculate GHG or financial values
- Do not store IP, email, or PII in `ApiUsageSubmission` — link only to `apiKeyId` (opaque UUID)
- Do not build a paid tier — PROJECT.md is explicit that the API is free

---

### From ARCHITECTURE.md

**Two independent work streams** sharing one Postgres database and one Next.js host:

**Stream 1: Auth Migration**

Key components:
- `lib/auth/auth.ts` — Better Auth config with Prisma adapter, email/password enabled (replaces Firebase admin)
- `pages/api/auth/[...all].ts` — Better Auth catch-all handler via `toNodeHandler`
- Replaced middleware: `lib/middleware/getUser.ts`, `checkLogin.ts`, `getProjectContext.ts` — all switch from `verifyIdToken(cookies.token)` to `auth.api.getSession({ headers: context.req.headers })`
- Prisma schema additions: `user`, `session`, `account`, `verification` models (auto-generated by Better Auth CLI)

**Critical schema constraint:** Existing `User.id` is a Firebase UID (string). Better Auth generates new IDs. The migration must run Better Auth tables alongside existing tables and map users by email on first login — not rename or overwrite the existing User table.

**Stream 2: Public REST API**

Key components:
- `pages/api/v1/impact.ts` — POST endpoint, orchestrates validation → rate limit → calculate → store
- `lib/api/validateApiKey.ts` — SHA-256 hash lookup in `ApiKey` table
- `lib/api/rateLimit.ts` — `@upstash/ratelimit` sliding window, keyed by `apiKeyId`
- `lib/calculator/getEnvironmentalImpact.ts` — **new pure function** that synthesizes a `ProjectInventory`-compatible object from raw usage input (no project record needed)
- `lib/api/storeUsageSubmission.ts` — writes anonymized `ApiUsageSubmission` row (no PII)
- `lib/api/generateApiKey.ts` — `sk_live_` + `crypto.randomBytes(32)`, stores SHA-256 hash only

**Key architectural pattern — Calculator as library (not internal HTTP):** The public API calls `lib/calculator/` functions directly. Do not route through existing internal `/api/projects/[id]/projections` — that endpoint requires a DB-stored project. Create `getEnvironmentalImpact(input)` as a pure function wrapper.

**New database models:**
- `ApiKey` — `keyHash` (unique, SHA-256), `label`, `lastUsedAt`, `isActive`
- `ApiUsageSubmission` — `apiKeyId`, `ghgSavedKg`, `wasteSavedKg`, `waterSavedGallons`, `materialType?`, `submittedRegion?` — no IP, no email

**Suggested build order (sequential, auth first):**
```
1.  [Auth]  Prisma schema additions — Better Auth models
2.  [Auth]  lib/auth/auth.ts configuration
3.  [Auth]  pages/api/auth/[...all].ts handler
4.  [Auth]  Password reset/backfill mechanism for existing users
5.  [Auth]  Atomic route cutover — replace all Firebase middleware in one commit
6.  [Auth]  Remove Firebase packages + env vars
7.  [API]   lib/calculator/getEnvironmentalImpact.ts pure function
8.  [API]   Prisma: ApiKey + ApiUsageSubmission models
9.  [API]   lib/api/generateApiKey.ts + validateApiKey.ts
10. [API]   lib/api/rateLimit.ts
11. [API]   pages/api/v1/impact.ts
12. [API]   pages/api/v1/keys.ts (admin key issuance)
```

---

### From PITFALLS.md

**Top 5 critical pitfalls (causes rewrites, data loss, or security incidents):**

| # | Pitfall | Phase | Prevention |
|---|---------|-------|-----------|
| 1 | Firebase `token` cookie and Better Auth session cookie collision during cutover | Auth (Phase 1) | Force logout on deploy; clear `token` cookie at login page load before auth check runs |
| 2 | Better Auth config incompatible with Vercel Edge Runtime if Prisma is imported in middleware | Auth (Phase 1) | Keep middleware/edge-safe config without Prisma imports; only use Prisma in server-side handlers |
| 3 | Auth middleware cutover done page-by-page leaves some pages unprotected with no error thrown | Auth (Phase 1) | Replace `checkLogin` in a single atomic commit; write a test before touching it |
| 4 | Public API response returns internal Prisma fields (orgId, pricing, accountId) to anonymous callers | API (Phase 2) | Define Zod output schema for every public endpoint; validate response shape, not just input |
| 5 | Puppeteer PDF generation exceeds Vercel 250MB bundle and 10-second timeout | PDF (Phase 3) | Use `puppeteer-core` + `@sparticuz/chromium-min`; deploy PDF endpoint to Heroku (already in stack) or upgrade to Vercel Pro for 60s timeout |

**Additional critical items:**
- Rate limiting is a hard prerequisite for the public API launch — not a follow-up. Missing rate limiting enables DB connection exhaustion that takes down the entire SaaS app.
- The `NEXT_PUBLIC_REMOTE_USER_ID` auth bypass in `firebaseAdmin.ts` must not be carried forward into the new auth implementation. Never copy from `firebaseAdmin.ts`; write middleware fresh.
- LLM recommendations must never perform arithmetic. Pre-calculate all values; pass results as grounding context. Add explicit instruction in system prompt: "Do not perform any arithmetic."

**Multi-year calculator pitfalls:**
- Do not round at intermediate steps — rounding compounds year-over-year into visible drift
- Update EPA emission factors before building multi-year projections; consider versioning the factor set on the `Project` model so projections remain reproducible after future EPA updates

---

## Implications for Roadmap

### Suggested Phase Structure

**Phase 1: Auth Migration (Firebase → Better Auth)**
- Rationale: Auth touches every route in the app. Clean it up first before adding any new surface area. Building the public API while Firebase auth is still in place means the migration has to co-exist with new code, increasing risk.
- Delivers: Email/password auth, session management, elimination of 6+ Firebase env vars and 3 NPM packages, stable foundation for Phase 2
- Features: N/A (infrastructure, not user-facing)
- Pitfalls to avoid: Cookie collision (Pitfall 1), Edge Runtime Prisma import (Pitfall 2), partial cutover (Pitfall 3), `NEXT_PUBLIC_REMOTE_USER_ID` bypass reintroduction (Pitfall 13)
- Research flag: STANDARD PATTERNS — Better Auth v1 documentation is thorough. No additional research needed.

**Phase 2: Public REST API**
- Rationale: After auth is stable and Firebase is gone, the Prisma patterns are clean. API key management builds naturally on the Prisma foundation. Rate limiting must ship simultaneously with the endpoint.
- Delivers: `POST /api/v1/impact`, API key self-serve issuance, per-key rate limiting, OpenAPI spec, EPA factor provenance in response
- Features from FEATURES.md: API key issuance, rate limiting + 429 headers, single-call impact endpoint, versioned path, structured errors, OpenAPI spec, EPA attribution
- Pitfalls to avoid: Missing rate limiting at launch (Pitfall 10), internal fields in API response (Pitfall 4), no version prefix (Pitfall 11)
- Research flag: STANDARD PATTERNS — Upstash + Next.js rate limiting is well-documented. No additional research needed.

**Phase 3: PDF Export (Two Sub-Phases)**
- Phase 3a (quick win): Upgrade `react-to-print` to v3.x, add `@media print` CSS, document "browser → Save as PDF" workflow. Zero new dependencies.
- Phase 3b (server-generated): Puppeteer-based PDF generation on Heroku (not Vercel) to avoid serverless timeout constraints. Ship only when there is demand for programmatic PDF generation without user interaction.
- Pitfalls to avoid: Puppeteer bundle size and timeout on Vercel (Pitfall 5), react-pdf CSS incompatibility (Pitfall 6)
- Research flag: NEEDS RESEARCH for Phase 3b — Heroku + Puppeteer deployment specifics may need verification. Phase 3a is standard patterns.

**Phase 4: Multi-Year Calculator + EPA Factor Update**
- Rationale: EPA factor update must precede multi-year projections to avoid baking stale constants into 10-year charts. The calculator extension is a pure TypeScript change — no library additions needed. New `Line`/`DualAxes`/`Area` chart components consume the new multi-year arrays using existing `@ant-design/plots` patterns.
- Delivers: Multi-year GHG/waste/water/financial projections, updated EPA emission factors, payback crossover visualization
- Features from FEATURES.md: Multi-year time-series curves (differentiator for projections dashboard)
- Pitfalls to avoid: Intermediate rounding compounding (Pitfall 7), stale emission factors in 10-year projections (Pitfall 8)
- Research flag: NEEDS RESEARCH — The specific multi-year data model (how to structure annual slices, which growth rate assumptions are configurable) may need a focused research pass before implementation. Calculator extension logic is not documented in the research files.

**Phase 5: AI Recommendations**
- Rationale: Depends on stable calculator output from Phase 4. Rule-based triggers first; LLM narrative rendering second (behind feature flag). The existing `recommendations (Json)` field on the `Project` model is already in the schema.
- Delivers: Actionable threshold-based recommendations on the projections dashboard, LLM narrative rendering (optional, feature-flagged)
- Features from FEATURES.md: Rule-based triggers (5-10 conditions), LLM narrative rendering, per-project recommendation storage, LLM cost guard
- Pitfalls to avoid: LLM hallucinating calculator values (Pitfall 9), LLM latency blocking page render (Pitfall 12), vendor lock-in via no abstraction layer (Pitfall 15)
- Research flag: NEEDS RESEARCH — LLM provider selection, prompt design for structured output, and cost modeling should be researched before implementation.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Better Auth recommendation | HIGH | Official docs, v1.0 stable release confirmed on npm, Prisma integration via official Prisma docs, real production Firebase migration case study (April 2025) |
| NextAuth v5 rejection | HIGH | Official GitHub issues, Auth.js team's own statement of "no new feature work" |
| Public API architecture | HIGH | Well-established patterns for Next.js API key auth + Upstash rate limiting; multiple high-confidence sources |
| PDF export (Phase 3a — react-to-print) | HIGH | Already working in codebase today |
| PDF export (Phase 3b — Puppeteer) | MEDIUM | Technical approach confirmed; Vercel timeout risk is real and documented; Heroku deployment specifics unverified |
| Multi-year calculator extension | MEDIUM | The calculator engine is well-understood; the specific multi-year data model design was not deeply researched |
| AI recommendations — rule-based | MEDIUM-HIGH | Pattern is straightforward; existing `recommendations` JSON field confirms team intent |
| AI recommendations — LLM | MEDIUM | LLM hallucination risk is well-documented; cost modeling and provider selection need more research |
| Feature priorities / anti-features | MEDIUM | Sourced from Climatiq API analysis and ChartReuse engine; benchmarking framing is sound |

**Overall confidence:** MEDIUM-HIGH

**Gaps to address during planning:**
1. Multi-year calculator data model — how are annual slices structured, which parameters are configurable per year vs. fixed (inflation rate, repurchase rate changes), and how does the projection interact with the existing `ProjectInventory` type?
2. LLM provider selection — cost per call at expected volume, latency, structured output reliability (Claude vs. GPT-4o)
3. Heroku deployment for Puppeteer PDF — confirm that the existing Heroku instance supports full Node.js + Chromium without serverless constraints
4. Existing user password migration strategy — the codebase has existing users with Firebase-managed passwords. "Forced password reset on first Better Auth login" (Option B1) is the recommended approach, but the specific password reset email flow (Mailgun integration) needs to be confirmed as available in the existing stack
5. `isPublicUrl` allowlist — the existing substring-match auth bypass logic must be replaced with an explicit allowlist that includes `/api/v1/` from day one

---

## Research Flags by Phase

| Phase | Research Needed Before Planning? | Reason |
|-------|-----------------------------------|--------|
| Phase 1 — Auth Migration | No | Better Auth docs are thorough; migration pattern confirmed via production case study |
| Phase 2 — Public REST API | No | Architecture is fully specified; Upstash patterns are standard |
| Phase 3a — react-to-print upgrade | No | Already in codebase; v3 upgrade is straightforward |
| Phase 3b — Puppeteer PDF (Heroku) | Yes | Heroku + Puppeteer deployment specifics unverified |
| Phase 4 — Multi-Year Calculator | Yes | Data model design for annual slices needs clarification |
| Phase 5 — AI Recommendations | Yes | LLM provider, cost model, prompt structure need research |

---

## Sources (Aggregated)

**Authentication:**
- Better Auth v1.0 release notes: https://www.better-auth.com/v1
- Better Auth installation + Next.js integration: https://www.better-auth.com/docs/installation
- Prisma + Better Auth + Next.js (official Prisma docs): https://www.prisma.io/docs/guides/betterauth-nextjs
- Firebase to Better Auth migration (production case study, April 2025): https://saulotauil.com/2025/04/17/firebase-auth-to-better-auth.html
- NextAuth Credentials + Database Session bug: https://github.com/nextauthjs/next-auth/issues/9636
- Auth.js joins Better Auth announcement: https://www.better-auth.com/blog/authjs-joins-better-auth

**Public API:**
- Climatiq API reference (schema benchmark): https://www.climatiq.io/docs/api-reference/estimate
- Upstash rate limiting for Next.js: https://upstash.com/blog/nextjs-ratelimiting
- Building APIs with Next.js (official, Feb 2025): https://nextjs.org/blog/building-apis-with-nextjs
- k-Anonymity threshold research (peer reviewed): https://pmc.ncbi.nlm.nih.gov/articles/PMC2528029/
- EPA GHG Emission Factors Hub 2025: https://www.epa.gov/climateleadership/ghg-emission-factors-hub

**PDF Export:**
- Deploying Puppeteer with Next.js on Vercel (official): https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel
- html2canvas SVG not supported (GitHub issue): https://github.com/niklasvh/html2canvas/issues/1430
- Ant Design Charts DualAxes: https://ant-design-charts.antgroup.com/en/components/plots/dual-axes

**Auth Migration Pitfalls:**
- Auth.js v5 migration guide: https://authjs.dev/getting-started/migrating-to-v5
- Auth.js session protection: https://authjs.dev/getting-started/session-management/protecting
- Puppeteer on Vercel deployment: https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel

**Codebase-Specific:**
- ChartReuse calculator engine source: `/Users/derekalanrowe/Dev/ChartReuse/lib/calculator/`
- Codebase concerns (CONCERNS.md): `/Users/derekalanrowe/Dev/ChartReuse/.planning/codebase/CONCERNS.md`
