---
phase: 02-overview-redesign
plan: 01
subsystem: ui
tags: [next.js, prisma, typescript, ant-design, styled-components, admin]

# Dependency graph
requires:
  - phase: 01-navigation-and-labels
    provides: Data Governance nav labels and admin page routes established
provides:
  - Redesigned Data Governance Admin page foundation: updated Props type, getServerSideProps with 4 new Prisma queries, KpiCardBlock with alertOverride, System Health KPI row, governance title/subtitle
affects: [02-overview-redesign plan 02 (section cards), any pages referencing data-science admin layout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "alertOverride pattern: optional boolean prop on KpiCardBlock allows server-side stale state to override zero-value 'all clear' display"
    - "isStale server computation: compare lastFactor.updatedAt vs lastTestRun.createdAt in getServerSideProps and pass to client as boolean"
    - "Promise.all with sevenDaysAgo window for recency-scoped counts (recentComputeRunErrors, recentComputeRunCount)"

key-files:
  created: []
  modified:
    - pages/admin/data-science/index.tsx

key-decisions:
  - "Merged Tasks 1 and 2 into a single atomic commit — removing publishedSections from props but leaving the JSX referencing it would break TypeScript; both layers had to be consistent"
  - "Removed Methodology Documents card entirely (used publishedSections) rather than leaving a broken stub — Plan 02 will replace it with section cards"
  - "Kept How-to Collapse section unchanged for Plan 02 to handle"

patterns-established:
  - "alertOverride?: boolean on KpiCardBlock: when true and value === 0, renders alert state with 'Factors updated — re-run tests' label instead of 'No issues detected'"

requirements-completed: [OVW-01, OVW-05]

# Metrics
duration: 3min
completed: 2026-03-05
---

# Phase 2 Plan 01: Data Governance Admin Foundation Summary

**getServerSideProps restructured with 4 new Prisma queries (changeRequest, computeRun, project, factor counts), isStale computed server-side, KpiCardBlock extended with alertOverride, and System Health KPI row replacing old pipeline health row**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-05T02:13:29Z
- **Completed:** 2026-03-05T02:15:34Z
- **Tasks:** 2 (merged into 1 commit for TypeScript consistency)
- **Files modified:** 1

## Accomplishments
- Replaced deprecated `MethodologySubsection` type and `publishedSections` prop with clean new `Props` type containing 12 stat fields
- Added 4 new Prisma queries in `Promise.all`: `pendingChangeRequests`, `recentComputeRunErrors`, `projectCount`, `factorCount`, `recentComputeRunCount`, `metricResultCount`
- Computed `isStale` server-side: `lastFactor.updatedAt > lastTestRun.createdAt`
- Extended `KpiCardBlock` with optional `alertOverride?: boolean` prop for stale-state signalling
- Updated page title and subtitle to governance framing ("Data Governance Admin")
- Replaced old 4-card KPI row (Inputs/Constants/Calculations/Test Runs) with System Health row: Data Inputs, Change Requests, ComputeRun Errors, Test Runs

## Task Commits

Tasks 1 and 2 were applied as a single atomic commit (necessary for TypeScript consistency — data layer and render layer had to stay in sync):

1. **Tasks 1+2: getServerSideProps restructure + title/subtitle + KpiCardBlock + System Health KPI row** - `d3617d0` (feat)

## Files Created/Modified
- `pages/admin/data-science/index.tsx` - Updated Props type, getServerSideProps, KpiCardBlock with alertOverride, title/subtitle, System Health KPI row; Methodology card removed

## Decisions Made
- **Merged task commits:** TypeScript required both layers (data + render) to be consistent. Separate commits would have left a broken intermediate state with unresolved variable references.
- **Removed Methodology card immediately:** The card used `publishedSections` which was removed from props. Rather than adding a placeholder, the card was removed cleanly — Plan 02 will replace it with the new section cards.
- **Kept How-to Collapse intact:** The collapse section doesn't depend on removed props and stays in place for Plan 02 to update.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Applied Tasks 1 and 2 together to maintain TypeScript correctness**
- **Found during:** Task 1 (getServerSideProps restructure)
- **Issue:** Removing `publishedSections` from props in Task 1 caused 9 TypeScript errors in the JSX (references to `publishedSections`, `constantsWithoutKey`, `constantsLastUpdated`, `FileTextOutlined`, `List`). The plan assumed tasks could be committed separately but the data layer and render layer are tightly coupled in this file.
- **Fix:** Applied Task 2's KPI row replacement and Methodology card removal in the same pass as Task 1's data layer changes.
- **Files modified:** pages/admin/data-science/index.tsx
- **Verification:** `yarn tsc --noEmit` passes with 0 errors
- **Committed in:** d3617d0

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** No scope change. Both tasks completed as specified; only the commit boundary was adjusted for TypeScript correctness.

## Issues Encountered
None beyond the coupled data/render layer requiring simultaneous application.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Foundation complete: Props type, getServerSideProps, KpiCardBlock extension, and System Health KPI row all in place
- Plan 02 can now build the visual section cards (Pipeline health, Data coverage, Governance activity) using `projectCount`, `factorCount`, `recentComputeRunCount`, `metricResultCount`, `functionsWithoutCoverage`, `totalFunctions`
- The How-to Collapse section and Quick Links row are in place for Plan 02 to update or replace

---
*Phase: 02-overview-redesign*
*Completed: 2026-03-05*
