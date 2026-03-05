---
phase: 04-data-map-rsp-feed-trace-graph
plan: 02
subsystem: api
tags: [prisma, next-pages, admin, rsp, pagination, filtering]

# Dependency graph
requires:
  - phase: 04-01
    provides: Data Map page shell at /admin/data-science/data-map with UPSTREAM_ADMIN auth gate
provides:
  - Paginated RSP period feed API at GET /api/admin/data-map/periods with search + filter params
  - Single-period trace API at GET /api/admin/data-map/periods/[id]/trace with full nested data
affects:
  - 04-03-PLAN  # Feed table component — consumes periods API via SWR
  - 04-04-PLAN  # Trace graph component — consumes trace API via SWR

# Tech tracking
tech-stack:
  added: []
  patterns:
    - handlerWithUser() + checkIsUpstream() pattern for UPSTREAM_ADMIN API routes (consistent with all data-science admin routes)
    - ComputeRun queried by orgId (no direct FK from UsageTimePeriod) — schema has no computeRuns relation on UsageTimePeriod

key-files:
  created:
    - pages/api/admin/data-map/periods.ts
    - pages/api/admin/data-map/periods/[id]/trace.ts
  modified: []

key-decisions:
  - "ComputeRun has no direct FK to UsageTimePeriod — fetched via orgId match; computeStatus filter uses a 2-step subquery to get orgIds first"
  - "MetricResult.value is valueNumeric in actual schema (not value as in plan interface); mapped to value in response for downstream consumers"
  - "latestComputeRun in periods feed is per-org (not per-period) because schema has no period-level ComputeRun link"

patterns-established:
  - "Periods feed pattern: pagination (page/pageSize), search OR clause with UUID detection, per-filter where accumulation, two-step computeStatus filter"
  - "Trace response pattern: period + products (full rows) + computeRun (with metricResults) + priorPeriod (supersession edge)"

requirements-completed:
  - MAP-06
  - MAP-07

# Metrics
duration: 15min
completed: 2026-03-05
---

# Phase 04 Plan 02: RSP Period Feed API + Trace API Summary

**Two UPSTREAM_ADMIN API routes backing the Data Map page: paginated/searchable/filterable RSP period feed and full-trace detail endpoint with products, computeRun, and supersession edge**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-05T17:37:00Z
- **Completed:** 2026-03-05T17:52:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Built `GET /api/admin/data-map/periods` with pagination (page/pageSize), search (org name/clientExternalId/UUID), and filters (rspOrgId, status, dateFrom, dateTo, computeStatus)
- Built `GET /api/admin/data-map/periods/[id]/trace` returning full period with products, latest rsp_usage ComputeRun + metricResults, and optional priorPeriod for supersession graph edges
- Both routes use the established `handlerWithUser() + checkIsUpstream()` UPSTREAM_ADMIN auth pattern; TypeScript compiles clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Build paginated periods feed API** - `72438a7` (feat)
2. **Task 2: Build single-period trace API** - `4727717` (feat)

**Plan metadata:** (docs commit — see final_commit step)

## Files Created/Modified
- `pages/api/admin/data-map/periods.ts` - Paginated feed: GET with search/filter query params, returns periods[] + total + page + pageSize
- `pages/api/admin/data-map/periods/[id]/trace.ts` - Trace detail: GET returns period with products, computeRun, metricResults, priorPeriod

## Decisions Made
- `ComputeRun` has no direct FK to `UsageTimePeriod` in the actual Prisma schema — the plan's interface block showed a `computeRuns` relation that doesn't exist. Adapted by fetching ComputeRuns by `orgId` after the period query; `computeStatus` filter uses a 2-step subquery (get matching orgIds first, then filter periods).
- `MetricResult.value` in the plan's interface is actually `valueNumeric` in the schema. Mapped to `value` in the response shape to match what downstream consumers expect.
- `latestComputeRun` in the periods feed is the most recent rsp_usage ComputeRun per org (not per period) because no period-level link exists in the schema.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adapted schema mismatches between plan interface and actual Prisma schema**
- **Found during:** Task 1 and Task 2 (both API implementations)
- **Issue:** Plan's `<interfaces>` block showed `UsageTimePeriod.computeRuns`, `UsagePeriodProduct.inCount`/`outCount`, and `MetricResult.value`/`units` — none matching the actual schema (`ComputeRun` has no FK to `UsageTimePeriod`; product fields are `inWarehouseEvents`/`outWarehouseEvents`; metric field is `valueNumeric`)
- **Fix:** Queries adapted to use actual schema: ComputeRun fetched by orgId, products included with actual field names, MetricResult.valueNumeric mapped to response `value`
- **Files modified:** Both API files
- **Verification:** `yarn tsc --noEmit` passes clean
- **Committed in:** 72438a7 (Task 1), 4727717 (Task 2)

---

**Total deviations:** 1 auto-fixed (schema mismatch correction)
**Impact on plan:** Necessary adaptation — plan interface block described the intended schema design, actual schema has slightly different field names. Response shapes match plan spec exactly.

## Issues Encountered
- TypeScript error on `[...new Set(...)]` spread — downlevelIteration required. Fixed using `Array.from(new Set(...))` instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `GET /api/admin/data-map/periods` ready for SWR consumption in Plan 03 (feed table component)
- `GET /api/admin/data-map/periods/[id]/trace` ready for SWR consumption in Plan 04 (trace graph component)
- No blockers for subsequent plans

---
*Phase: 04-data-map-rsp-feed-trace-graph*
*Completed: 2026-03-05*
