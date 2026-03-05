---
phase: 05-api-playground
plan: "01"
subsystem: api
tags: [rsp, ingest, refactor, prisma, compute-run]

# Dependency graph
requires:
  - phase: 04-data-map-rsp-feed-trace-graph
    provides: ComputeRun/MetricResult infrastructure used by ingestUsagePeriod()
provides:
  - lib/rsp/ingestUsagePeriod.ts — callable pipeline function with typed params/result
  - Thin HTTP wrapper for POST /api/rsp/usage (behavior unchanged)
affects:
  - 05-02 (playground endpoint calls ingestUsagePeriod in validate-only and full-ingest modes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Extract-to-lib: move API route compute logic into lib/ so it can be called from multiple contexts without duplication"

key-files:
  created:
    - lib/rsp/ingestUsagePeriod.ts
  modified:
    - pages/api/rsp/usage.ts

key-decisions:
  - "EventRow type exported from ingestUsagePeriod.ts so playground endpoint can reuse it without re-declaring"
  - "rawPayload typed as unknown in IngestParams — cast to any only at Prisma boundary, preserving type safety at call sites"
  - "On error lib re-throws after finishComputeRun — caller (HTTP wrapper) handles HTTP response; lib stays framework-agnostic"

patterns-established:
  - "Extract-to-lib pattern: compute logic lives in lib/, API routes are thin HTTP wrappers (auth + parse + call lib + shape response)"

requirements-completed: [PLY-03]

# Metrics
duration: 2min
completed: 2026-03-05
---

# Phase 5 Plan 01: Extract ingestUsagePeriod Summary

**RSP ingest pipeline extracted from API route into reusable lib/rsp/ingestUsagePeriod.ts, enabling the playground endpoint to call the same logic without code duplication**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-05T18:11:35Z
- **Completed:** 2026-03-05T18:12:52Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `lib/rsp/ingestUsagePeriod.ts` with exported `EventRow`, `IngestParams`, `IngestResult` types and `ingestUsagePeriod()` function
- Reduced `pages/api/rsp/usage.ts` from 183 lines to 80 lines — thin HTTP wrapper only
- Zero TypeScript errors across both tasks; POST /api/rsp/usage behavior identical to pre-refactor

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/rsp/ingestUsagePeriod.ts** - `9f364af` (feat)
2. **Task 2: Refactor pages/api/rsp/usage.ts to thin wrapper** - `428504f` (refactor)

## Files Created/Modified
- `lib/rsp/ingestUsagePeriod.ts` - Extracted pipeline: calcImpact per event, overlapping-period query, startComputeRun, prisma.$transaction, saveMetricResults/finishComputeRun; exports EventRow, IngestParams, IngestResult, ingestUsagePeriod()
- `pages/api/rsp/usage.ts` - Now only handles method guard, API key validation, body parsing/validation, account lookup, calls ingestUsagePeriod(), shapes response

## Decisions Made
- `EventRow` exported from ingestUsagePeriod.ts so the playground endpoint (Plan 02) can reuse it without re-declaring the type
- `rawPayload` typed as `unknown` in `IngestParams` — cast to `any` only at the Prisma boundary, preserving call-site type safety
- On error, lib calls `finishComputeRun` with 'failed' then re-throws; the HTTP wrapper handles the 500 response — keeps lib framework-agnostic

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `ingestUsagePeriod()` is callable from any server-side context
- Plan 02 (playground endpoint) can now import and call it in both validate-only and full-ingest modes
- No blockers

---
*Phase: 05-api-playground*
*Completed: 2026-03-05*
