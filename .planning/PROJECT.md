# ChartReuse (derekupstream fork)

## What This Is

A personal fork of the UpstreamSolutions/ChartReuse SaaS calculator, hosted on derekupstream GitHub and deployed to a personal Vercel + Heroku stack. The app calculates the financial and environmental savings organizations achieve by switching from single-use to reusable foodware. This fork is an AI-assisted development sandbox for shipping improvements to the existing app and building a new public environmental impact API — with the best ideas potentially contributed back to Upstream.

## Core Value

The calculator's projection engine (GHG, waste, financial) must remain accurate and reliable — everything else is enhancements on top of that foundation.

## Requirements

### Validated

<!-- Existing capabilities confirmed in the live UpstreamSolutions codebase -->

- ✓ User can sign up, log in, and manage their account via Firebase auth — existing
- ✓ User belongs to an Org; Org has Accounts and Projects — existing
- ✓ User can create and manage Projects with multiple line-item types (single-use, reusable, dishwasher, labor, waste-hauling, other expenses) — existing
- ✓ Calculator produces financial projections (baseline vs. forecast cost, ROI, payback period) — existing
- ✓ Calculator produces environmental projections (GHG emissions, waste weight, water usage) — existing
- ✓ App supports two project modes: Advanced (institutional) and Event (simple) — existing
- ✓ Stripe subscription gates access with a 30-day free trial — existing
- ✓ Projects have shareable public read-only URLs — existing
- ✓ Projects can be exported to Excel (.xlsx) — existing
- ✓ Single-use and reusable product line items can be imported from Excel — existing
- ✓ Org-level product catalog (single-use and reusable) — existing
- ✓ Project templates (create project from org template) — existing
- ✓ Multi-currency and metric system support per Org — existing
- ✓ Role-based access: ORG_ADMIN vs ACCOUNT_ADMIN — existing
- ✓ Upstream admin panel (staff-only) — existing

### Active

<!-- Improvements to build in this fork -->

- [ ] Fork is running on derekupstream GitHub with its own Vercel + Heroku deployment and environment (Firebase project, Stripe account, Postgres DB)
- [ ] Auth replaced: Firebase → NextAuth.js (email/password)
- [ ] Calculator extended with multi-year projection curves (not just year 1)
- [ ] Calculator updated with current EPA GHG emission factors per material
- [ ] PDF export of the projections dashboard
- [ ] Public environmental impact API: callers send reusable product usage counts, receive GHG saved, waste avoided, and water impact — free to use, usage data aggregated anonymously for industry benchmarks
- [ ] AI-driven recommendations within the app (suggestions based on project data)

### Out of Scope

- Mobile app — web-first, same as Upstream version
- Replacing Postgres/Prisma — no reason to change the DB layer
- Re-building the product catalog from scratch — use existing CSV-backed catalogs
- Competing directly with Upstream commercially — this is a sandbox and research fork

## Context

- **Codebase**: Next.js 15 (pages router), TypeScript, Ant Design 5.x, Prisma 6 + PostgreSQL, Firebase auth, Stripe billing, Vercel + Heroku hosting. Full details in `.planning/codebase/`.
- **Current branch**: `feature/my-changes` off UpstreamSolutions main
- **Auth debt**: Firebase auth adds significant complexity (client SDK + `firebase-admin` on server, ID token cookies, middleware). NextAuth.js would simplify this considerably.
- **API opportunity**: The calculator engine (`lib/calculator/`) is pure functions with no external dependencies — ideal to expose as a standalone API. The environmental results (GHG, waste, water) are the high-value output for external callers.
- **Contribution intent**: Ship improvements here first; if they prove out, PR them back to UpstreamSolutions.

## Constraints

- **Tech stack**: Next.js + TypeScript + Prisma + PostgreSQL — keep the existing stack where possible; only replace what's worth replacing (Firebase → NextAuth)
- **Data integrity**: Calculator accuracy is non-negotiable; any changes to the engine need tests
- **Environment isolation**: This fork runs against its own DB, Firebase/auth, and Stripe accounts — never touches Upstream's production data
- **API design**: Environmental impact API must be free and data-sharing (no paywall); API keys for rate limiting only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fork to derekupstream (not a new repo) | Preserves full git history and makes PRing back to Upstream easy | — Pending |
| Replace Firebase auth with NextAuth | Firebase adds 2 SDKs + cookie-based token flow; NextAuth is simpler and keeps auth in-stack | — Pending |
| Expose calculator engine as public API | Pure functions are already isolated in `lib/calculator/` — minimal work to wrap in an API route | — Pending |
| Free API with data sharing | Lowers barrier to adoption; anonymous aggregate data creates network value | — Pending |

---
*Last updated: 2026-02-22 after initialization*
