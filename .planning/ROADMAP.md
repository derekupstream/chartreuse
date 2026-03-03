# Roadmap: ChartReuse (derekupstream fork)

## Overview

SaaS calculator for cost/environmental savings when switching from single-use to reusable foodware. This fork has evolved significantly beyond the original 4-phase plan — auth was modernized, a data science admin platform was built, an RSP API integration shipped, impact tracking and timelines were added, and ongoing methodology governance work is underway.

## Completed Milestones

### Milestone 1: Fork & Own Deployment + Auth Modernization ✅
**Completed**: ~2026-02-23
- App forked and running on own Vercel + Supabase stack
- Local dev against `chartreuse_local` Postgres database
- Firebase removed; Supabase Auth handles all authentication (Google OAuth + email/password)
- Session persistence, password reset, OAuth callback all working
- Prisma migrations applied to Supabase production DB

### Milestone 2: Responsive UI + Data Science Admin ✅
**Completed**: ~2026-02-26
- Mobile-responsive layout (768px breakpoint, hamburger nav, scroll fixes)
- Factor Library: 153 factors seeded (materials, reusables, utility rates, emission constants)
- `Factor`, `FactorCategory`, `FactorVersion`, `ChangeRequest` models
- Admin pages: constants/index, constants/new, constants/[id]/edit, change-requests/index
- `calculatorConstantKey` links DB factors to TypeScript constant paths

### Milestone 3: Data Science Admin Overhaul + AI-Powered Importer ✅
**Completed**: ~2026-02-27
- AI Import pipeline: `ImportSession` model, `/api/admin/import/classify` + `apply` endpoints
- Pipeline traceability page + LINEAGE_MAP
- Calculations registry with source code viewer
- Test runs + Golden datasets tabs
- TipTap methodology editor + subsections + data lineage page

### Milestone 4: RSP API Integration ✅
**Completed**: ~2026-02-28
- RSP (Reuse Service Provider) org type + `orgType` field
- `RspApiKey`, `UsageTimePeriod`, `UsagePeriodProduct` models
- API key generation (cr_rsp_{64hex}, SHA-256 hash stored)
- Public endpoint: `POST /api/rsp/usage` (Bearer token, Sharewares format, temporal dedup)
- Settings page restructured: Account / Org / API Integration tabs
- Admin RSP dashboard + API keys page
- Org profile fields: country, city, employeeCount, locationCount, reuseJourneyStage, primaryChallenge
- Account RSP linkage: rspClientId, rspOrgId

### Milestone 5: Project Milestones + Impact Timeline ✅
**Completed**: ~2026-03-01
- `ProjectMilestone` model: point-in-time KPI snapshots per project
- Environmental break-even calculation (`getEnvBreakEven.ts`)
- Break-even KPICard on EnvironmentalSummary page
- "Save Snapshot" button in ProjectionsStep → `POST /api/projects/[id]/milestones`
- Impact Timeline chart on analytics page (`@ant-design/plots` Line chart, metric toggle)
- Projects page All/Projections/Actuals Radio.Group filter

### Milestone 6: RSP Test Hub, AI Insights, Admin All-Projects ✅
**Completed**: ~2026-03-02
- RSP Test Hub for testing API key usage
- AI Insights on projections dashboard (async LLM rendering)
- Admin All-Projects view across all orgs
- Various bug fixes (AI insights errors, RSP dropdown, double-click prevention)

### Post-M6: Data Science Governance + Analytics ✅
**Completed**: ~2026-03-02
- **Phase 1**: Methodology Snapshot governance layer
- **Phase 2**: `ComputeRun` + `MetricResult` wired into all compute paths
- Analytics lineage visualization (run provenance detail)
- Impact simulator
- `FactorVersion` bootstrap + calculations rescan fix
- User role change + password reset admin actions
- Fix 403 on actuals projects for upstream admin users

---

## Remaining Work

### Project Dashboard Charts ✅
**Completed**: 2026-03-03
- DASH-01: `SnapshotTimeline` — per-project milestone KPI line chart, metric toggle (CO2/cost/waste/water), `@ant-design/plots`
- DASH-02: `BreakEvenChart` — cumulative cost curves, crossover annotated with payback months
- Both live in `components/projects/[id]/projections/components/ProjectTimeline/`
- Exposed via "Timeline" tab in `ProjectionsStep.tsx` sidebar nav

### Analytics Saved Views + Share Links + ImpactMultiplier ✅
**Completed**: 2026-03-03
- Analytics Saved Views: save/load named filter presets to localStorage (keyed by orgId)
- ShareButton redesigned as Popover panel with URL input, Copy Link + Preview buttons
- Fixed share API to correctly accept `publicSlug: null` for disabling sharing
- ImpactMultiplier: scale avg per-project impact across N locations (analytics page, projections category only)

### Calculator Accuracy + Multi-Year Projections
**Requirements**: CALC-01, CALC-02, CALC-03, CALC-04
- EPA WARM 2025 emission factors (replace stale constants)
- Multi-year projection output (1-10 year annual slices)
- Multi-year time-series charts on projections dashboard
- Payback period crossover visualization

### Future: Share & Export
**Requirements**: SHARE-01 through SHARE-09
- "Share & Export" panel with section toggles
- Raw data vs. equivalency mode per metric
- Custom title, narrative text, org logo
- Shareable public link + PDF export (browser print-to-PDF)

### Future: AI Recommendations
**Requirements**: AI-01 through AI-05
- Rule-based recommendation engine (threshold conditions, pre-calculated grounding)
- LLM narrative rendering, async delivery
- Per-project storage in `recommendations (Json)` field

---

## Progress

| Milestone | Status | Completed |
|-----------|--------|-----------|
| M1: Fork & Own Deployment + Auth | ✅ Done | ~2026-02-23 |
| M2: Responsive UI + Data Science Admin | ✅ Done | ~2026-02-26 |
| M3: Data Science Overhaul + AI Import | ✅ Done | ~2026-02-27 |
| M4: RSP API Integration | ✅ Done | ~2026-02-28 |
| M5: Project Milestones + Impact Timeline | ✅ Done | ~2026-03-01 |
| M6: RSP Test Hub + AI Insights | ✅ Done | ~2026-03-02 |
| Post-M6: Data Science Governance | ✅ Done | ~2026-03-02 |
| Project Dashboard Charts (DASH-01, DASH-02) | ✅ Done | ~2026-03-03 |
| Analytics Saved Views + Share + Multiplier | ✅ Done | ~2026-03-03 |
| Calculator Accuracy + Multi-Year | ⬜ Not started | - |
| Share & Export | ⬜ Not started | - |
| AI Recommendations | ⬜ Not started | - |
