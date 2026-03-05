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

- [ ] **INP-01**: New `/admin/data-science/inputs` page created as data health dashboard
- [ ] **INP-02**: Page runs on-demand issue detection and surfaces results grouped by severity (error, warning)
- [ ] **INP-03**: Each issue displays: issue type, affected table/entity name, record ID, short description, severity badge
- [ ] **INP-04**: Issue checks cover: return rate >100%, zero-unit line items, projects missing USState, projects missing single-use or reusable line items
- [x] **INP-05**: `DataHealthIssue` Prisma model: `id`, `issueType`, `severity`, `entity`, `entityId`, `details`, `status` (open/acknowledged/resolved), `acknowledgedAt`, `acknowledgedByUserId`, `note`, `createdAt`, `updatedAt`
- [ ] **INP-06**: "Validate" action acknowledges an issue — sets `acknowledgedAt` + `acknowledgedByUserId`, prompts for optional note, transitions status to `acknowledged`
- [ ] **INP-07**: API: `POST /api/admin/data-health/scan` (run checks, upsert issues), `GET /api/admin/data-health/issues` (list with status), `PATCH /api/admin/data-health/issues/[id]` (acknowledge or resolve)

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
| INP-01 | Phase 3 | Pending |
| INP-02 | Phase 3 | Pending |
| INP-03 | Phase 3 | Pending |
| INP-04 | Phase 3 | Pending |
| INP-05 | Phase 3 | Complete |
| INP-06 | Phase 3 | Pending |
| INP-07 | Phase 3 | Pending |

**Coverage:**
- v1.8 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 — traceability finalized after roadmap creation*
