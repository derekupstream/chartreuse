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
- [x] **Phase 2: Overview Redesign** - Redesign existing overview page with architecture diagram, section cards, How It Works walkthrough, and System Health dashboard (completed 2026-03-05)
- [x] **Phase 3: Data Health Page** - New Inputs page with on-demand issue detection, DataHealthIssue model, Prisma migration, and acknowledge/resolve workflow (completed 2026-03-05)

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
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — DataHealthIssue Prisma model + migration
- [ ] 03-02-PLAN.md — Scan engine library + 3 API routes
- [ ] 03-03-PLAN.md — Data Inputs page + overview KPI update

## Progress

**Execution Order:** Phase 1 → Phase 2 → Phase 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Navigation & Labels | 2/2 | Complete    | 2026-03-05 |
| 2. Overview Redesign | 2/2 | Complete   | 2026-03-05 |
| 3. Data Health Page | 3/3 | Complete   | 2026-03-05 |

---

---

## v1.9: Data Map + RSP Observability (Active Milestone)

**Milestone Goal:** Build a node-based Data Map visualization hub giving admins full observability into how data flows through the system — from RSP API ingestion through compute to metric results. Priority is RSP observability and a self-test harness for validating payloads before handing RSPs integration instructions.

**New dependencies:** `reactflow` + `@dagrejs/dagre` (not yet installed)
**DB changes:** None required for Phases 4–6. All models exist.

## Phases

- [x] **Phase 4: Data Map Page + RSP Feed + Trace Graph** - New `/admin/data-science/data-map` page with paginated RSP ingestion feed, React Flow provenance graph (status coloring, supersession edges), node detail drawers, minimap/zoom/pan (completed 2026-03-05)
- [x] **Phase 5: API Playground** - Playground tab: paste JSON payload, select API key, validate-only or full ingest mode, auto-navigate to trace graph after ingest; extract `ingestUsagePeriod()` lib function from `usage.ts` (completed 2026-03-05)
- [ ] **Phase 6: Data Health + RSP Integration** - Create DataHealthIssue records during RSP ingestion (unknown type, negative events, high supersession); issue badges on graph nodes; click navigates to filtered Inputs page
- [x] **Phase 7: Actuals + Projections Modes (V1)** - Mode segmented control on Data Map (RSP API | Actuals | Projections); Actuals graph (Project → Milestones → ComputeRuns → MetricResults); Projections graph (Project → Line Items → ComputeRun → MetricResults) (completed 2026-03-05)

## Phase Details

### Phase 4: Data Map Page + RSP Feed + Trace Graph
**Goal**: Admin can browse all RSP ingestions in a searchable, filterable feed table, click any row, and see a React Flow provenance graph with status coloring, supersession edges, node detail drawers, and an Intelligence Update node
**Depends on**: Nothing (install reactflow + dagre first)
**Requirements**: MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06, MAP-07, MAP-08
**Success Criteria**:
  1. `/admin/data-science/data-map` loads with paginated RSP period feed table
  2. Search bar finds periods by projectId, publicSlug, usagePeriodId, clientExternalId, org/account, or computeRunId
  3. Feed filters (date range, RSP org, status, has issues, compute status) narrow the feed list
  4. Clicking a row renders a React Flow graph: API Request → Validation → Dedup → UsageTimePeriod → UsagePeriodProducts → ComputeRun → MetricResults → Intelligence Update
  5. Node colors reflect status: green=ok/active, orange=superseded, red=failed, blue=running
  6. If supersededById exists, a dashed edge links to the prior period node
  7. Clicking any node opens an AntD Drawer with record details and deep links
  8. Minimap, zoom/pan, and fit-view controls are present
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md — Install reactflow + @dagrejs/dagre, add Data Map to nav, scaffold page shell
- [ ] 04-02-PLAN.md — Periods feed API (paginated, search, filters) + trace detail API
- [ ] 04-03-PLAN.md — Feed panel component (table, search, filters, row selection, auto-select)
- [ ] 04-04-PLAN.md — React Flow trace graph (nodes, status coloring, supersession edges, node drawers, minimap)

### Phase 5: API Playground
**Goal**: Admin can paste a JSON payload, pick an existing RSP API key, run validate-only or full ingest, and automatically see the trace graph for any created period
**Depends on**: Phase 4
**Requirements**: PLY-01, PLY-02, PLY-03
**Success Criteria**:
  1. Playground tab visible on Data Map page (RSP API mode only)
  2. "Validate Only" returns validation result + overlap check without writing to DB
  3. "Ingest" runs full pipeline and returns new period ID
  4. After ingest, "View in Graph" button auto-navigates feed tab to the new period's trace
  5. Warning banner: "Ingest mode writes to the production database"
  6. `ingestUsagePeriod()` extracted to `lib/rsp/ingestUsagePeriod.ts`; `usage.ts` is a thin wrapper
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — Extract ingestUsagePeriod() to lib/rsp/ingestUsagePeriod.ts; refactor usage.ts to thin wrapper
- [ ] 05-02-PLAN.md — Playground API endpoint + PlaygroundPanel component + tab wiring in data-map.tsx

### Phase 6: Data Health + RSP Integration
**Goal**: RSP-specific data quality issues automatically appear in DataHealthIssue during ingestion, with issue badges on affected graph nodes
**Depends on**: Phase 5
**Requirements**: RSP-H-01, RSP-H-02
**Success Criteria**:
  1. Ingesting a payload with unknown reusable_type creates a `warning` DataHealthIssue
  2. Ingesting a payload with negative event counts creates an `error` DataHealthIssue
  3. Ingestion that supersedes > 3 prior periods creates a `warning` DataHealthIssue
  4. Affected graph nodes show a red badge with issue count
  5. Clicking the badge navigates to `/admin/data-science/inputs` filtered by that entity
  6. RSP issues increment the governance overview KPI counter automatically
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md — Add RSP health checks to ingestUsagePeriod(); upsert DataHealthIssue for unknown type, negative events, high supersession
- [ ] 06-02-PLAN.md — Trace API issue count field; IssueNode badge in TraceGraph; filtered Inputs page navigation

### Phase 7: Actuals + Projections Modes (V1)
**Goal**: Data Map shows project-based provenance graphs for actuals and projections in addition to RSP mode
**Depends on**: Phase 4 (can run in parallel with Phase 6)
**Requirements**: ACT-01, PRJ-01
**Success Criteria**:
  1. Mode segmented control (RSP API | Actuals | Projections) appears above feed; mode persists in URL (`?mode=`)
  2. Actuals mode: select a project, graph shows Project → Milestones → ComputeRuns → MetricResults
  3. Projections mode: select a project, graph shows Project → Line Items (aggregate) → ComputeRun → MetricResults
  4. Node click opens Drawer with record details for all modes
**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md — Mode segmented control, URL persistence, actuals-trace + projections-trace API routes
- [ ] 07-02-PLAN.md — ActualsGraph + ProjectionsGraph components wired into data-map page

## Progress

**Execution Order:** Phase 4 → Phase 5 → Phase 6, Phase 7 (parallel with Phase 6)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 4. Data Map + RSP Feed + Trace Graph | 4/4 | Complete   | 2026-03-05 |
| 5. API Playground | 2/2 | Complete   | 2026-03-05 |
| 6. Data Health + RSP Integration | 0/2 | Not started | - |
| 7. Actuals + Projections Modes | 2/2 | Complete   | 2026-03-05 |

---

## Next Milestone

### v2.0: Data Map Graph Explorer (Planned)

**Milestone Goal:** Transform the Data Map into a zoomable graph explorer with semantic zoom levels (System → Schema → Relationships → Row data), a data dictionary, and additional view modes for Factors and Metrics.

**Context doc:** `.planning/phases/08-data-map-graph-explorer/08-CONTEXT.md`

## Phases

- [ ] **Phase 8: Data Map Graph Explorer** — Schema introspection API, expandable nodes (zoom into table fields), relationship edge drawing, row-level data view, data dictionary, Factors/Metrics view modes

Plans:
- [ ] 08-01: Schema introspection API (`GET /api/admin/data-map/schema`)
- [ ] 08-02: Expandable System Nodes (Level 1 → 2 zoom)
- [ ] 08-03: Relationship Edges (Level 2 → 3 zoom, dynamic FK edges)
- [ ] 08-04: Row/Data View (Level 3 → 4, sample data API)
- [ ] 08-05: Data Dictionary Integration (field descriptions, usage context)
- [ ] 08-06: View Mode Enhancements (Factors + Metrics tabs, node clustering)

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
| v1.8: Data Governance Admin Overhaul | Done | 2026-03-05 |
| v1.9: Data Map + RSP Observability | Not started | - |
| Calculator Accuracy + Multi-Year | Not started | - |
| Share & Export | Not started | - |
| AI Recommendations | Not started | - |
