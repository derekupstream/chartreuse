---
phase: 03-data-health-page
plan: 03
subsystem: ui
tags: [nextjs, antd, react, prisma, data-health, admin]

# Dependency graph
requires:
  - phase: 03-data-health-page plan 02
    provides: POST /api/admin/data-health/scan, PATCH /api/admin/data-health/issues/[id], DataHealthIssue Prisma model
provides:
  - /admin/data-science/inputs page — auto-scan, two-section table, validate modal, empty state
  - Updated overview KPI card sourcing from DataHealthIssue table (not legacy getInputIssueCount)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-side scan pattern: useCallback runScan() triggered by useEffect on mount and Re-scan button — no SWR/React Query needed for triggered-action flows"
    - "In-place row update via setIssues(prev => prev.map(i => i.id === updated.id ? updated : i)) after PATCH"
    - "Custom Modal footer array with Link + Cancel + OK for mixed action footers in antd"

key-files:
  created:
    - pages/admin/data-science/inputs/index.tsx
  modified:
    - pages/admin/data-science/index.tsx

key-decisions:
  - "Auth-only getServerSideProps on inputs page — all data from client-side scan POST, no SSR data needed"
  - "Empty state shown only when !scanning && issues.length === 0 — avoids flash of empty state during initial scan"

patterns-established:
  - "Admin page with client-side data load: getServerSideProps does auth-only, useEffect triggers data fetch on mount"

requirements-completed: [INP-01, INP-02, INP-03, INP-06]

# Metrics
duration: 12min
completed: 2026-03-05
---

# Phase 3 Plan 03: Data Inputs Page and Overview KPI Update Summary

**Data Health admin page with auto-scan on mount, severity-grouped issue tables, validate modal with in-place row update, and overview KPI wired to DataHealthIssue table**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-05T03:25:00Z
- **Completed:** 2026-03-05T03:37:00Z
- **Tasks:** 2 auto (+ 1 checkpoint awaiting human verify)
- **Files modified:** 2

## Accomplishments
- `pages/admin/data-science/inputs/index.tsx` created: 317 lines, full auto-scan flow, two-section table (Errors then Warnings), validate modal with optional note, Re-scan button with last-scan timestamp, empty state with green checkmark
- Overview page KPI card updated to `prisma.dataHealthIssue.count({ where: { status: 'open' } })` — removes legacy `getInputIssueCount()` dependency
- TypeScript clean (`npx tsc --noEmit` passes with 0 errors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create pages/admin/data-science/inputs/index.tsx** - `066a847` (feat)
2. **Task 2: Update overview KPI card to query DataHealthIssue** - `aa30af9` (feat)
3. **Task 3: Human verify — Data Health page end-to-end** - (checkpoint, awaiting human verification)

**Plan metadata:** (docs commit follows after checkpoint approval)

## Files Created/Modified
- `pages/admin/data-science/inputs/index.tsx` - Data Inputs page: auth-only getServerSideProps, client-side auto-scan, Errors/Warnings sections, Validate modal, empty state, Re-scan button
- `pages/admin/data-science/index.tsx` - Removed getInputIssueCount() import/call; replaced with prisma.dataHealthIssue.count({ where: { status: 'open' } })

## Decisions Made
- Auth-only `getServerSideProps` on the inputs page — all data comes from the client-side POST to `/api/admin/data-health/scan` on mount; no server-side data passed as props (per plan spec and RESEARCH.md recommendation against SWR for triggered-action patterns)
- Empty state guard uses `!scanning && issues.length === 0` to prevent flash of empty state during the initial scan before results arrive

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compiled cleanly on first attempt for both files.

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

- All 3 plans in Phase 03-data-health-page are complete (pending human verification of Task 3)
- Production deployment note: DataHealthIssue table must be migrated via `npx prisma migrate deploy` against Supabase before deploying to production (from Plan 01)
- `lib/admin/inputValidation.ts` and its `getInputIssueCount()` function are now unused — safe to delete in a future cleanup pass

---
*Phase: 03-data-health-page*
*Completed: 2026-03-05*

## Self-Check: PASSED

- pages/admin/data-science/inputs/index.tsx: FOUND
- pages/admin/data-science/index.tsx: modified (getInputIssueCount removed, dataHealthIssue.count present)
- Commit 066a847 (Task 1): FOUND
- Commit aa30af9 (Task 2): FOUND
