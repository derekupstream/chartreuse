# ChartReuse (derekupstream fork)

## What This Is

A personal fork of the UpstreamSolutions/ChartReuse SaaS calculator, hosted on derekupstream GitHub and deployed to a personal Vercel + Supabase stack. The app calculates the financial and environmental savings organizations achieve by switching from single-use to reusable foodware. This fork is an AI-assisted development sandbox for shipping improvements to the existing app and building a new public environmental impact API — with the best ideas potentially contributed back to Upstream.

## Current Milestone: v1.8 Data Governance Admin Overhaul

**Goal:** Reorganize the "Data Science" admin into a clear, trainable Data Governance platform organized around the actual pipeline architecture.

**Target features:**
- Rename and restructure admin nav: "Data Governance" group, new ordering, Advanced submenu
- Overview redesign: System Architecture diagram, section cards, health KPI dashboard, How It Works walkthrough
- Relabel existing pages: Constants → Factors, Pipeline → Lineage, Import → AI Data Uploader
- New Inputs page: on-demand data health monitoring with issue detection + acknowledge/resolve workflow
- DataHealthIssue model (lightweight): open → acknowledged → resolved

## Core Value

The calculator's projection engine (GHG, waste, financial) must remain accurate and reliable — everything else is enhancements on top of that foundation.

## Requirements

### Validated (Existing Capabilities)

- ✓ User can sign up, log in, and manage their account
- ✓ User belongs to an Org; Org has Accounts and Projects
- ✓ User can create and manage Projects with multiple line-item types
- ✓ Calculator produces financial projections (baseline vs. forecast cost, ROI, payback period)
- ✓ Calculator produces environmental projections (GHG emissions, waste weight, water usage)
- ✓ App supports two project modes: Advanced (institutional) and Event (simple)
- ✓ Stripe subscription gates access with a 30-day free trial
- ✓ Projects have shareable public read-only URLs
- ✓ Projects can be exported to Excel (.xlsx)
- ✓ Single-use and reusable product line items can be imported from Excel
- ✓ Org-level product catalog (single-use and reusable)
- ✓ Project templates (create project from org template)
- ✓ Multi-currency and metric system support per Org
- ✓ Role-based access: ORG_ADMIN vs ACCOUNT_ADMIN
- ✓ Upstream admin panel (staff-only)

### Completed in Fork

- ✅ Fork running on derekupstream GitHub with own Vercel + Supabase deployment
- ✅ Auth replaced: Firebase → Supabase Auth (email/password + Google OAuth)
- ✅ Mobile-responsive layout across all core pages
- ✅ Factor Library: 153 factors (materials, reusables, utility rates, emission constants)
- ✅ Data Science admin: AI-powered importer, pipeline traceability, calculations registry, test runs, methodology editor
- ✅ RSP (Reuse Service Provider) API integration: org type, API keys, usage ingestion endpoint
- ✅ Project Milestones: point-in-time KPI snapshots, "Save Snapshot" button
- ✅ Environmental break-even calculation + KPICard
- ✅ Impact Timeline chart on analytics page
- ✅ AI Insights on projections dashboard (async LLM rendering)
- ✅ Methodology Snapshot governance + ComputeRun/MetricResult traceability layer
- ✅ Analytics lineage visualization + impact simulator
- ✅ Admin: user role change, password reset, All-Projects view, RSP Test Hub

### Active / Remaining

- [ ] Calculator extended with multi-year projection curves (1-10 year annual slices)
- [ ] EPA WARM 2025 emission factors replace stale constants
- [ ] PDF export of the projections dashboard
- [ ] Share & Export panel (section toggles, equivalency mode, branding, shareable link)
- [ ] AI-driven recommendations within the app (rule-based triggers + LLM narrative)
- [ ] Public environmental impact API: callers send usage counts, receive GHG/waste/water impact

### Out of Scope

- Mobile app — web-first, same as Upstream version
- Replacing Postgres/Prisma — no reason to change the DB layer
- Re-building the product catalog from scratch — use existing CSV-backed catalogs
- Competing directly with Upstream commercially — this is a sandbox and research fork

## Context

- **Data model**: See `.planning/DATA_MODEL.md` for full table reference (~35 tables across 5 domains)
- **Codebase**: Next.js 15 (pages router), TypeScript, Ant Design 5.x, Prisma 6 + PostgreSQL, Supabase Auth, Stripe billing, Vercel + Supabase hosting.
- **Production URL**: https://chartreuse-bay.vercel.app
- **Current branch**: `main`
- **Auth**: Supabase Auth fully replaces Firebase (Firebase packages are dead code, can be deleted)
- **API opportunity**: The calculator engine (`lib/calculator/`) is pure functions with no external dependencies — ideal to expose as a standalone API
- **Contribution intent**: Ship improvements here first; if they prove out, PR them back to UpstreamSolutions

## Constraints

- **Tech stack**: Next.js + TypeScript + Prisma + PostgreSQL — keep the existing stack where possible
- **Data integrity**: Calculator accuracy is non-negotiable; any changes to the engine need tests
- **Environment isolation**: This fork runs against its own DB, Supabase auth, and Stripe accounts — never touches Upstream's production data
- **API design**: Environmental impact API must be free and data-sharing (no paywall); API keys for rate limiting only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fork to derekupstream | Preserves git history, makes PRing back to Upstream easy | ✅ Done |
| Replace Firebase auth with Supabase | Firebase adds 2 SDKs + cookie-based token flow; Supabase keeps auth in-stack with DB | ✅ Done |
| Supabase for DB + auth | Single vendor for both reduces ops complexity | ✅ Done |
| RSP API with SHA-256 key hash | Keys generated as cr_rsp_{64hex}, only hash stored for security | ✅ Done |
| AI Insights async rendering | Page loads immediately; LLM response appears when ready | ✅ Done |
| PDF export via browser print | Simpler than Puppeteer; covers 90% of use case | ⬜ Pending |
| Expose calculator as public API | Pure functions in lib/calculator/ — minimal work to wrap | ⬜ Pending |

---
*Last updated: 2026-03-04 — Milestone v1.8 started*
