---
phase: 03-data-health-page
plan: 02
subsystem: api
tags: [prisma, postgresql, nextjs, data-health, scan-engine]

# Dependency graph
requires:
  - phase: 03-data-health-page plan 01
    provides: DataHealthIssue Prisma model with composite unique key for upserts
provides:
  - runDataHealthScan() library function — 9 parallel checks returning IssueInput[]
  - POST /api/admin/data-health/scan — runs all 9 checks, upserts issues, returns non-resolved
  - GET /api/admin/data-health/issues — lists non-resolved issues with optional ?status= filter
  - PATCH /api/admin/data-health/issues/[id] — acknowledges or resolves with timestamp and userId
affects:
  - 03-03 (admin page — calls these 3 endpoints)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parallel check execution via Promise.all(CHECKS.map(fn => fn())) — 9 DB queries in parallel"
    - "Upsert with status preservation — update block never includes status field to avoid resetting acknowledged/resolved"
    - "Prisma.InputJsonValue cast for Json? fields from Record<string, unknown>"

key-files:
  created:
    - lib/admin/dataHealthScan.ts
    - pages/api/admin/data-health/scan.ts
    - pages/api/admin/data-health/issues.ts
    - pages/api/admin/data-health/issues/[id].ts
  modified: []

key-decisions:
  - "Prisma.InputJsonValue cast required for details field — Record<string,unknown> not directly assignable to Prisma Json? input type"
  - "Entity-prefixed issueType for negative_case_cost checks (reusable_negative_case_cost vs single_use_negative_case_cost) ensures @@unique([issueType, entityId]) key uniqueness across entity types"
  - "status field intentionally absent from upsert update block — preserves acknowledged/resolved state across re-scans"

patterns-established:
  - "CHECKS array + runDataHealthScan() runner pattern — extensible: add new CheckFn to CHECKS array to include in scan"
  - "data-health API auth guard: checkIsUpstream(req.user.orgId) returning 403 for non-upstream users"

requirements-completed: [INP-04, INP-07]

# Metrics
duration: 8min
completed: 2026-03-05
---

# Phase 3 Plan 02: Data Health Scan Engine and API Routes Summary

**9-check parallel scan engine (runDataHealthScan) with 3 upstream-only API routes for running, listing, and acknowledging data health issues**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-05T03:15:52Z
- **Completed:** 2026-03-05T03:23:52Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `lib/admin/dataHealthScan.ts` created with 9 check functions (4 errors + 5 warnings) run in parallel via Promise.all
- `POST /api/admin/data-health/scan` upserts all issues without overwriting acknowledged/resolved status
- `GET /api/admin/data-health/issues` returns non-resolved issues with optional ?status= filter
- `PATCH /api/admin/data-health/issues/[id]` acknowledges/resolves with timestamp and userId; 403 for non-upstream

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scan engine lib/admin/dataHealthScan.ts** - `42a8c6b` (feat)
2. **Task 2: Create 3 API routes for data health** - `5f0342c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `lib/admin/dataHealthScan.ts` - Scan engine library: IssueInput type, 9 check functions, CHECKS array, runDataHealthScan()
- `pages/api/admin/data-health/scan.ts` - POST endpoint: runs scan, upserts issues preserving status, returns non-resolved
- `pages/api/admin/data-health/issues.ts` - GET endpoint: list non-resolved issues with optional ?status= filter
- `pages/api/admin/data-health/issues/[id].ts` - PATCH endpoint: acknowledge/resolve with acknowledgedAt and acknowledgedByUserId

## Decisions Made
- `Prisma.InputJsonValue` cast required on the `details` field — TypeScript rejects direct assignment of `Record<string, unknown>` to Prisma's `Json?` input type; the cast is safe because our `details` objects are always plain JSON-serializable records
- Entity-prefixed `issueType` values for the two negative case cost checks ensure that the composite `@@unique([issueType, entityId])` constraint remains unique even if a Project and SingleUseLineItem share the same UUID (unlikely but guaranteed)
- `status` intentionally absent from the `upsert` update block — this is the core anti-pattern guard preventing re-scans from resetting user acknowledgements

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type error on Prisma Json? field assignment**
- **Found during:** Task 2 (scan.ts creation)
- **Issue:** `Record<string, unknown> | undefined` is not assignable to `NullableJsonNullValueInput | InputJsonValue | undefined` — Prisma's generated types for Json? fields don't accept plain Record types
- **Fix:** Added `import { Prisma } from '@prisma/client'` and cast `issue.details` as `Prisma.InputJsonValue | undefined` in both create and update blocks
- **Files modified:** pages/api/admin/data-health/scan.ts
- **Verification:** `npx tsc --noEmit` returns 0 errors
- **Committed in:** `5f0342c` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 TypeScript type error)
**Impact on plan:** Minimal — single-line cast in scan.ts. No behavioral change. Required for compilation.

## Issues Encountered
- TypeScript rejected `Record<string, unknown>` for Prisma Json? field — resolved with `Prisma.InputJsonValue` cast (documented above as auto-fix)

## User Setup Required
None - no external service configuration required for this plan.

## Next Phase Readiness
- All 3 API routes are live and can be called by the Plan 03 admin UI page
- `lib/admin/dataHealthScan.ts` exports `runDataHealthScan()` and `IssueInput` — ready for import by the page component
- Production deployment note: DataHealthIssue table must be migrated via `npx prisma migrate deploy` against Supabase before deploying these routes (from Plan 01)

---
*Phase: 03-data-health-page*
*Completed: 2026-03-05*

## Self-Check: PASSED

- lib/admin/dataHealthScan.ts: FOUND
- pages/api/admin/data-health/scan.ts: FOUND
- pages/api/admin/data-health/issues.ts: FOUND
- pages/api/admin/data-health/issues/[id].ts: FOUND
- .planning/phases/03-data-health-page/03-02-SUMMARY.md: FOUND
- Commit 42a8c6b (Task 1): FOUND
- Commit 5f0342c (Task 2): FOUND
