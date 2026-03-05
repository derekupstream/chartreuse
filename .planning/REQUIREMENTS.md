# Requirements: ChartReuse — v1.8 Data Governance Admin Overhaul

**Defined:** 2026-03-04
**Core Value:** The calculator's projection engine (GHG, waste, financial) must remain accurate and reliable — everything else is enhancements on top of that foundation.

## v1.8 Requirements

### Navigation (NAV)

- [x] **NAV-01**: Admin sidebar group "Data Science" is renamed "Data Governance"
- [x] **NAV-02**: Primary nav items ordered as: Overview, Inputs, Factors, Calculations, Test Runs, Lineage, Methodology, Change Requests, AI Data Uploader
- [x] **NAV-03**: "Constants" nav item renamed to "Factors"
- [x] **NAV-04**: "Pipeline" nav item renamed to "Lineage" and points to `/admin/data-science/lineage`
- [x] **NAV-05**: "Import Data" nav item renamed to "AI Data Uploader"
- [x] **NAV-06**: Snapshots, Run History, and Impact Simulator moved into an "Advanced" submenu within the Data Governance group

### Overview Page (OVW)

- [x] **OVW-01**: Overview page title and subtitle updated to reflect "Data Governance" framing
- [x] **OVW-02**: System Architecture card added showing the full pipeline: Projects/RSP Data → Factor Library → Calculator Engine → ComputeRun → MetricResult → Dashboards/Insights
- [x] **OVW-03**: Section cards added for each primary nav item (Inputs, Factors, Calculations, Test Runs, Lineage, Methodology, AI Data Uploader) — each with a short description, tooltip, and "View →" link
- [x] **OVW-04**: Collapsible "How Impact Governance Works" section with 6-step walkthrough: Validate Inputs → Maintain Factors → Verify Calculations → Run Regression Tests → Trace Results → Maintain Methodology
- [x] **OVW-05**: System Health Dashboard — a row of KPI alert cards showing: open data health issues (unacknowledged), pending change requests, recent ComputeRun errors, last test run status + stale alert when factors have been updated since the last test run

### Page Labels (LBL)

- [x] **LBL-01**: Constants Library page title and description updated to "Factors" (reflecting environmental constants governance)
- [x] **LBL-02**: Import page title updated to "AI Data Uploader" with updated description
- [x] **LBL-03**: Lineage page description updated to governance framing ("trace how a metric was produced")

### Inputs / Data Health (INP)

- [x] **INP-01**: New `/admin/data-science/inputs` page created as data health dashboard
- [x] **INP-02**: Page runs on-demand issue detection and surfaces results grouped by severity (error, warning)
- [x] **INP-03**: Each issue displays: issue type, affected table/entity name, record ID, short description, severity badge
- [x] **INP-04**: Issue checks cover: return rate >100%, zero-unit line items, projects missing USState, projects missing single-use or reusable line items
- [x] **INP-05**: `DataHealthIssue` Prisma model: `id`, `issueType`, `severity`, `entity`, `entityId`, `details`, `status` (open/acknowledged/resolved), `acknowledgedAt`, `acknowledgedByUserId`, `note`, `createdAt`, `updatedAt`
- [x] **INP-06**: "Validate" action acknowledges an issue — sets `acknowledgedAt` + `acknowledgedByUserId`, prompts for optional note, transitions status to `acknowledged`
- [x] **INP-07**: API: `POST /api/admin/data-health/scan` (run checks, upsert issues), `GET /api/admin/data-health/issues` (list with status), `PATCH /api/admin/data-health/issues/[id]` (acknowledge or resolve)

---

## v1.9 Requirements — Data Map + RSP Observability

### Data Map (MAP)

- [x] **MAP-01**: New `/admin/data-science/data-map` page added to Data Governance nav group
- [x] **MAP-02**: React Flow graph renders RSP ingestion trace: API Request → Validation → Dedup → UsageTimePeriod → UsagePeriodProducts → ComputeRun → MetricResults
- [x] **MAP-03**: Clicking any graph node opens an AntD Drawer with record details and deep links
- [x] **MAP-04**: Node status coloring (green=ok/active, orange=superseded, red=failed, blue=running); dashed edge for supersession chain
- [x] **MAP-05**: Minimap, zoom/pan, fit-view controls present on graph
- [x] **MAP-06**: Search bar allows finding RSP periods by projectId, publicSlug, usagePeriodId, clientExternalId, org/account, or computeRunId
- [x] **MAP-07**: RSP feed supports filters: date range, RSP org, status (accepted/deduped/rejected/needs_review), has issues (critical/warn), compute status (success/fail)
- [x] **MAP-08**: RSP trace graph includes an Intelligence Update node at end of chain showing whether benchmarks were refreshed

### API Playground (PLY)

- [x] **PLY-01**: Playground tab on Data Map: paste JSON payload, select API key, validate-only or ingest mode
- [x] **PLY-02**: After ingest, "View in Graph" button auto-navigates to the new period's trace
- [x] **PLY-03**: `ingestUsagePeriod()` extracted to `lib/rsp/ingestUsagePeriod.ts`; `pages/api/rsp/usage.ts` becomes a thin wrapper

### RSP Data Health (RSP-H)

- [x] **RSP-H-01**: RSP ingestion creates DataHealthIssue records for: unknown reusable_type (warning), negative event counts (error), high supersession count >3 (warning)
- [x] **RSP-H-02**: Affected graph nodes show issue badge; clicking navigates to filtered Inputs page

### Actuals + Projections Modes (ACT, PRJ)

- [x] **ACT-01**: Actuals mode graph: Project → ProjectMilestones → ComputeRuns → MetricResults
- [x] **PRJ-01**: Projections mode graph: Project → Line Items (aggregate nodes) → ComputeRun → MetricResults

## Future Requirements

### Data Health Enhancements

- **INP-F01**: Scheduled/cron-based issue scanning
- **INP-F02**: Issue resolution with evidence note
- **INP-F03**: Issue trend chart over time

## Out of Scope

| Feature | Reason |
|---------|--------|
| Changing how calculations work | This milestone is UI/governance only — no calculator changes |
| Removing existing functionality | All existing features preserved (versioning, golden datasets, ComputeRun, etc.) |
| Full workflow system for DataHealthIssue | Lightweight only: open → acknowledged → resolved |
| Mobile-responsive admin sidebar | Admin is desktop-only, consistent with existing pattern |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 1 | Complete |
| NAV-02 | Phase 1 | Complete |
| NAV-03 | Phase 1 | Complete |
| NAV-04 | Phase 1 | Complete |
| NAV-05 | Phase 1 | Complete |
| NAV-06 | Phase 1 | Complete |
| LBL-01 | Phase 1 | Complete |
| LBL-02 | Phase 1 | Complete |
| LBL-03 | Phase 1 | Complete |
| OVW-01 | Phase 2 | Complete |
| OVW-02 | Phase 2 | Complete |
| OVW-03 | Phase 2 | Complete |
| OVW-04 | Phase 2 | Complete |
| OVW-05 | Phase 2 | Complete |
| INP-01 | Phase 3 | Complete |
| INP-02 | Phase 3 | Complete |
| INP-03 | Phase 3 | Complete |
| INP-04 | Phase 3 | Complete |
| INP-05 | Phase 3 | Complete |
| INP-06 | Phase 3 | Complete |
| INP-07 | Phase 3 | Complete |
| MAP-01 | Phase 4 | Complete |
| MAP-02 | Phase 4 | Complete |
| MAP-03 | Phase 4 | Complete |
| MAP-04 | Phase 4 | Complete |
| MAP-05 | Phase 4 | Complete |
| MAP-06 | Phase 4 | Complete |
| MAP-07 | Phase 4 | Complete |
| MAP-08 | Phase 4 | Complete |
| PLY-01 | Phase 5 | Complete |
| PLY-02 | Phase 5 | Complete |
| PLY-03 | Phase 5 | Complete |
| RSP-H-01 | Phase 6 | Complete |
| RSP-H-02 | Phase 6 | Complete |
| ACT-01 | Phase 7 | Complete |
| PRJ-01 | Phase 7 | Complete |

**Coverage:**
- v1.8 requirements: 21 total — all Complete
- v1.9 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-05 — v1.9 requirements added (MAP-06, MAP-07, MAP-08 from PRD), traceability updated*
