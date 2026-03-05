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

### Analytics UX Overhaul ✅
**Completed**: 2026-03-04
- **Share toggle bug fix**: `useEnableAnalyticsShare` now uses `useSWRMutation` directly with `Data` properly typed as `{ analyticsSlug: string }` — trigger() return value is clean without `as any` casts
- **Print/Export scope dropdowns**: Print and Export buttons replaced with `Dropdown.Button`; Print options (Projections/Actuals); Export options (All/Projections/Actuals) pass `?category=` param to export API
- **Share scope indicator**: ShareAnalyticsButton popover shows "Sharing: [Projections/Actuals/Scenarios] view"
- **FilterRow button heights**: "Save view" and "Clear filters" buttons changed from `size='small'` to default (`size='middle'`) to match adjacent Select dropdowns
- **Scenarios tab redesign**: FilterRow + summary cards now shown on ALL tabs (not just Projections/Actuals); Leaderboard remains Projections/Actuals only
- **ProjectionTimeline**: New chart (`components/org/analytics/components/ProjectionTimeline.tsx`) replaces ImpactTimeline in Scenarios tab — per-project lines at 1yr→2yr→5yr→10yr x-axis; metric toggle (Savings/Waste/GHG/Single-Use); "Up to Xyr" dropdown on chart controls both visible years AND summary card multiplier; `animate={false}` + `key={visibleYears.length}` fix for G2 `equalizeSegments` stack overflow
- **ScenarioPlanner**: Slider removed (timeline now on chart); "Load scenario" Select moved inline with Save/Save as New/Reset buttons

---

## Active Milestone

### v1.8: Data Governance Admin Overhaul (In Progress)

**Milestone Goal:** Reorganize the "Data Science" admin into a clear, trainable Data Governance platform — rename nav items, redesign the overview page, and build a new on-demand Data Health monitoring page backed by a lightweight `DataHealthIssue` model.

## Phases

- [x] **Phase 1: Navigation & Labels** - Rename admin nav group and relabel existing pages (no new pages, no DB changes) (completed 2026-03-05)
- [ ] **Phase 2: Overview Redesign** - Redesign existing overview page with architecture diagram, section cards, How It Works walkthrough, and System Health dashboard
- [ ] **Phase 3: Data Health Page** - New Inputs page with on-demand issue detection, DataHealthIssue model, Prisma migration, and acknowledge/resolve workflow

## Phase Details

### Phase 1: Navigation & Labels
**Goal**: Admin users see a correctly named and ordered "Data Governance" admin nav with accurate page titles throughout
**Depends on**: Nothing (first phase)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, LBL-01, LBL-02, LBL-03
**Success Criteria** (what must be TRUE):
  1. Admin sidebar shows "Data Governance" as the group heading (not "Data Science")
  2. Nav items appear in order: Overview, Inputs, Factors, Calculations, Test Runs, Lineage, Methodology, Change Requests, AI Data Uploader
  3. Snapshots, Run History, and Impact Simulator are nested under an "Advanced" submenu
  4. The Constants Library page title reads "Factors" and the Import page title reads "AI Data Uploader"
  5. The Lineage page description uses governance framing ("trace how a metric was produced")
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Rename Data Governance nav group, restructure children and Advanced submenu in AdminLayout.tsx
- [ ] 01-02-PLAN.md — Update page titles, headings, descriptions, and back-link text across 6 pages

### Phase 2: Overview Redesign
**Goal**: The Data Governance overview page communicates the full pipeline architecture, provides quick navigation to all major sections, and surfaces system health at a glance
**Depends on**: Phase 1
**Requirements**: OVW-01, OVW-02, OVW-03, OVW-04, OVW-05
**Success Criteria** (what must be TRUE):
  1. Page title and subtitle reflect "Data Governance" framing
  2. A System Architecture card visually shows the full pipeline (Projects/RSP Data → Factor Library → Calculator Engine → ComputeRun → MetricResult → Dashboards/Insights)
  3. Section cards for each primary nav item are present with description, tooltip, and working "View →" link
  4. A collapsible "How Impact Governance Works" section expands to show the 6-step walkthrough
  5. A System Health row shows live KPI alert cards: open data health issues, pending change requests, recent ComputeRun errors, and last test run status with stale alert
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Update getServerSideProps, Props type, title/subtitle, System Health KPI row (OVW-01, OVW-05)
- [ ] 02-02-PLAN.md — System Architecture diagram, Section Cards 3x2 grid, How It Works Collapse (OVW-02, OVW-03, OVW-04)

### Phase 3: Data Health Page
**Goal**: Admin users can run on-demand data health scans, view detected issues grouped by severity, and acknowledge issues with an optional note
**Depends on**: Phase 2
**Requirements**: INP-01, INP-02, INP-03, INP-04, INP-05, INP-06, INP-07
**Success Criteria** (what must be TRUE):
  1. Navigating to `/admin/data-science/inputs` loads the Data Health dashboard page
  2. Clicking "Scan" triggers an on-demand check and displays detected issues grouped into error and warning sections
  3. Each issue row shows: issue type, affected table/entity name, record ID, short description, and severity badge
  4. Issue checks cover: return rate >100%, zero-unit line items, projects missing USState, projects missing single-use or reusable line items
  5. Clicking "Validate" on an issue transitions it to acknowledged, records the timestamp and user, and accepts an optional note
**Plans**: TBD

## Progress

**Execution Order:** Phase 1 → Phase 2 → Phase 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Navigation & Labels | 2/2 | Complete    | 2026-03-05 |
| 2. Overview Redesign | 1/2 | In Progress|  |
| 3. Data Health Page | 0/TBD | Not started | - |

---

## Future Work

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

## Overall Progress

| Milestone | Status | Completed |
|-----------|--------|-----------|
| M1: Fork & Own Deployment + Auth | Done | ~2026-02-23 |
| M2: Responsive UI + Data Science Admin | Done | ~2026-02-26 |
| M3: Data Science Overhaul + AI Import | Done | ~2026-02-27 |
| M4: RSP API Integration | Done | ~2026-02-28 |
| M5: Project Milestones + Impact Timeline | Done | ~2026-03-01 |
| M6: RSP Test Hub + AI Insights | Done | ~2026-03-02 |
| Post-M6: Data Science Governance | Done | ~2026-03-02 |
| Project Dashboard Charts (DASH-01, DASH-02) | Done | ~2026-03-03 |
| Analytics Saved Views + Share + Multiplier | Done | ~2026-03-03 |
| Analytics UX Overhaul | Done | 2026-03-04 |
| v1.8: Data Governance Admin Overhaul | In progress | - |
| Calculator Accuracy + Multi-Year | Not started | - |
| Share & Export | Not started | - |
| AI Recommendations | Not started | - |
