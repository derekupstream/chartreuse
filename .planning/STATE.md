---
gsd_state_version: 1.0
milestone: v1.9
milestone_name: Data Map + RSP Observability
status: In progress
stopped_at: Completed 07-01-PLAN.md
last_updated: "2026-03-05T21:23:00.000Z"
last_activity: 2026-03-05 — Phase 07 Plan 01 complete
progress:
  total_phases: 7
  completed_phases: 6
  total_plans: 4
  completed_plans: 1
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-05)

**Core value:** The calculator's projection engine (GHG, waste, financial) must remain accurate and reliable — everything else is enhancements on top of that foundation.
**Current focus:** v1.9 Data Map + RSP Observability

## Current Position

Phase: 07-actuals-projections-modes-v1
Plan: 01 of 4
Status: In progress
Last activity: 2026-03-05 — Completed 07-01 (mode control + trace APIs)

Progress: [██░░░░░░░░] 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (this milestone)
- Prior milestones: 6+ shipped at ~1 milestone per 1-2 days of active development

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: n/a (new milestone)
- Trend: —
| Phase 01-navigation-and-labels P01 | 1 | 1 tasks | 1 files |
| Phase 01-navigation-and-labels P02 | 12 | 2 tasks | 6 files |
| Phase 02-overview-redesign P01 | 3 | 2 tasks | 1 files |
| Phase 02-overview-redesign P02 | 3 | 2 tasks | 1 files |
| Phase 03-data-health-page P01 | 2 | 2 tasks | 2 files |
| Phase 03-data-health-page P02 | 8 | 2 tasks | 4 files |
| Phase 03-data-health-page P03 | 12 | 2 tasks | 2 files |
| Phase 03-data-health-page P03 | 15 | 3 tasks | 2 files |
| Phase 04-data-map-rsp-feed-trace-graph P01 | 12 | 2 tasks | 4 files |
| Phase 04-data-map-rsp-feed-trace-graph P02 | 15 | 2 tasks | 2 files |
| Phase 04-data-map-rsp-feed-trace-graph P03 | 5 | 2 tasks | 2 files |
| Phase 04-data-map-rsp-feed-trace-graph P04 | 3 | 2 tasks | 4 files |
| Phase 05-api-playground P01 | 2 | 2 tasks | 2 files |
| Phase 05-api-playground P02 | 15 | 2 tasks | 3 files |
| Phase 06-data-health-rsp-integration P01 | 2 | 1 tasks | 2 files |
| Phase 06-data-health-rsp-integration P02 | 121 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

- **Auth**: Supabase Auth (not Firebase, not NextAuth) — migration complete, all routes protected
- **DB**: Supabase PostgreSQL in production, local Postgres.app for dev
- **RSP API**: Bearer token (cr_rsp_{64hex}), SHA-256 hash stored, Sharewares format
- **AI Insights**: Async LLM rendering, pre-calculated context passed to LLM, stored in project.recommendations
- **PDF Export**: Deferred — browser print-to-PDF planned for Share & Export milestone
- **DataHealthIssue**: Lightweight model only — open → acknowledged → resolved (no full workflow system)
- [Phase 01-navigation-and-labels]: Kept data-science/pipeline in DATA_SCIENCE_KEYS without nav link; Lineage is new primary entry at /admin/data-science/lineage
- [Phase 01-navigation-and-labels]: data-science/inputs added to DATA_SCIENCE_KEYS proactively for Phase 3 Inputs page
- [Phase 01-navigation-and-labels]: Pipeline selectedMenuItem set to 'data-science/pipeline-legacy' to decouple legacy page from primary nav highlight
- [Phase 01-navigation-and-labels]: Admin page copy uses governance/audit trail framing consistently: 'Factors', 'AI Data Uploader', 'Trace how a metric was produced'
- [Phase 02-overview-redesign]: Tasks 1+2 merged into single commit for TypeScript consistency — removing publishedSections from props required simultaneous render layer updates
- [Phase 02-overview-redesign]: alertOverride pattern on KpiCardBlock: boolean prop allows server-side isStale to override zero-value all-clear display for Test Runs card
- [Phase 02-overview-redesign]: Tasks 1+2 combined into single commit for file consistency — removing old sections and adding new ones must be atomic to avoid linter failures
- [Phase 02-overview-redesign]: SECTION_CARDS placed inside component body — JSX icon values require component scope
- [Phase 02-overview-redesign]: How It Works Collapse has no defaultActiveKey — starts closed per OVW-04 locked decision
- [Phase 03-data-health-page]: entityId uses @db.Uuid even with no FK — entity IDs across Project/LineItem tables are all PostgreSQL UUIDs
- [Phase 03-data-health-page]: acknowledgedByUserId is plain String? (no @db.Uuid) — references User.id which is Supabase auth UID (plain string)
- [Phase 03-data-health-page]: @@unique([issueType, entityId]) is the DataHealthIssue upsert key — prevents duplicate rows on re-scan
- [Phase 03-data-health-page]: Prisma.InputJsonValue cast required for Json? fields — Record<string,unknown> not assignable to Prisma Json input type
- [Phase 03-data-health-page]: Entity-prefixed issueType for negative_case_cost checks ensures @@unique([issueType, entityId]) key uniqueness across entity types
- [Phase 03-data-health-page]: status absent from upsert update block — preserves acknowledged/resolved state on re-scan
- [Phase 03-data-health-page]: Auth-only getServerSideProps on inputs page — all data from client-side scan POST, no SSR data needed
- [Phase 03-data-health-page]: Empty state guard uses !scanning && issues.length === 0 to prevent flash of empty state during initial scan
- [Phase 04-data-map-rsp-feed-trace-graph]: getUserFromContext + checkIsUpstream auth pattern used for Data Map page (consistent with all existing data-science admin pages)
- [Phase 04-data-map-rsp-feed-trace-graph]: ComputeRun has no direct FK to UsageTimePeriod — periods feed fetches ComputeRuns by orgId; computeStatus filter uses 2-step subquery
- [Phase 04-data-map-rsp-feed-trace-graph]: MetricResult.valueNumeric (not .value) is the actual schema field; mapped to value in API response for downstream consumers
- [Phase 04-data-map-rsp-feed-trace-graph]: Search state split into searchInput (immediate) + search (debounced 300ms) to avoid excessive SWR refetches while typing
- [Phase 04-data-map-rsp-feed-trace-graph]: Date range pickers deferred from FeedPanel filter row — keeps filter row simple (search + 2 selects)
- [Phase 04-data-map-rsp-feed-trace-graph]: Node label placed in data.label not top-level label — React Flow v11 Node type does not accept top-level label property
- [Phase 05-api-playground]: Extract-to-lib pattern: compute logic in lib/, API routes are thin HTTP wrappers — ingestUsagePeriod() callable from any server-side context
- [Phase 05-api-playground]: Playground endpoint reuses same overlap query as ingestUsagePeriod for validate mode — consistent reporting
- [Phase 05-api-playground]: onIngest callback sets both selectedPeriodId and activeTab atomically — switches tab and selects period in single action
- [Phase 06-data-health-rsp-integration]: RSP health checks placed after finishComputeRun inside try/catch — best-effort, errors do not propagate to caller
- [Phase 06-data-health-rsp-integration]: Array.from(new Set(...)) used for dedup instead of spread on Set — TypeScript target does not enable downlevelIteration
- [Phase 06-data-health-rsp-integration]: status absent from RSP DataHealthIssue upsert update block — preserves acknowledged/resolved state on re-ingest (consistent with scan.ts)
- [Phase 06-data-health-rsp-integration]: IssueNode registered as default nodeType overrides all React Flow nodes — avoids per-node type complexity while intercepting all nodes with a single component
- [Phase 06-data-health-rsp-integration]: entityId stored directly in node data for uniform access across usage-period and products nodes regardless of which period fields they carry
- [Phase 06-data-health-rsp-integration]: Client-side filter on inputs page (not server-side re-fetch) — scan POST already returns all issues; entityId filter is a UX narrowing, not a data query
- [Phase 07-actuals-projections-modes-v1]: Segmented control positioned in its own bordered div above Tabs — Tabs only render in RSP mode for clean conditional layout
- [Phase 07-actuals-projections-modes-v1]: rspActiveTab renamed from activeTab to scope it clearly to RSP mode; selectedProjectId state added now for Plan 02 graph components
- [Phase 07-actuals-projections-modes-v1]: actuals-trace returns last 10 computeRuns (runType actuals_ingest/backfill); projections-trace returns single latest projection run — different cardinality by design
- [Phase 07-actuals-projections-modes-v1]: feedContent height calculation updated to subtract extra 46px for Segmented control bar

### Pending Todos

None captured yet.

### Blockers/Concerns

- Calculator multi-year projections: EPA WARM 2025 factor update should happen first to avoid baking stale constants into 10-year charts (future milestone)
- Phase 3 requires a Prisma migration for `DataHealthIssue` — run `npx prisma migrate deploy` against production after local dev

## Session Continuity

Last session: 2026-03-05T19:10:20.341Z
Stopped at: Completed 06-02-PLAN.md
Resume file: None
