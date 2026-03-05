---
phase: 01-navigation-and-labels
plan: 01
subsystem: ui
tags: [antd, navigation, sidebar, admin, next.js]

# Dependency graph
requires: []
provides:
  - Admin sidebar group renamed from "Data Science" to "Data Governance"
  - Nav children reordered: Overview, Inputs, Factors, Calculations, Test Runs, Lineage, Methodology, Change Requests, AI Data Uploader
  - "Advanced" submenu containing Snapshots, Run History, Impact Simulator
  - Lineage nav link pointing to /admin/data-science/lineage (replaces Pipeline)
  - Factors label replacing Constants
  - AI Data Uploader label replacing Import Data
  - DATA_SCIENCE_KEYS extended with data-science/inputs and data-science/lineage
affects:
  - 01-navigation-and-labels (subsequent plans in phase)
  - Phase 3 data health pages (will use data-science/inputs key)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ant Design Menu nested children used for Advanced submenu inside a top-level group"
    - "DATA_SCIENCE_KEYS array drives auto-open behavior for the group — new pages must add their key to this array"

key-files:
  created: []
  modified:
    - layouts/AdminLayout.tsx

key-decisions:
  - "Kept data-science/pipeline in DATA_SCIENCE_KEYS (group stays open on that route) but removed the nav link — users reach it via internal links; primary entry point is now /admin/data-science/lineage"
  - "data-science/inputs added to DATA_SCIENCE_KEYS proactively for Phase 3 Inputs page (not yet built)"

patterns-established:
  - "Admin nav groups use an array (e.g., DATA_SCIENCE_KEYS) to determine defaultOpenKeys — any new admin sub-page must add its selectedMenuItem key to the relevant array"

requirements-completed: [NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06]

# Metrics
duration: 1min
completed: 2026-03-05
---

# Phase 1 Plan 01: Navigation and Labels Summary

**Admin sidebar renamed to "Data Governance" with reordered children, Lineage/Factors/AI Data Uploader labels, and an Advanced submenu for legacy tools**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-05T01:15:48Z
- **Completed:** 2026-03-05T01:16:42Z
- **Tasks:** 1 of 1
- **Files modified:** 1 (layouts/AdminLayout.tsx; additional files auto-formatted by lint-staged)

## Accomplishments
- Renamed "Data Science" sidebar group to "Data Governance" throughout AdminLayout
- Reordered nav children to match product-specified order: Overview, Inputs, Factors, Calculations, Test Runs, Lineage, Methodology, Change Requests, AI Data Uploader
- Replaced the flat "Pipeline" link with "Lineage" pointing to `/admin/data-science/lineage`
- Renamed "Constants" to "Factors" and "Import Data" to "AI Data Uploader"
- Added nested "Advanced" submenu containing Snapshots, Run History, and Impact Simulator
- Extended `DATA_SCIENCE_KEYS` with `data-science/inputs` and `data-science/lineage` so the group auto-opens on those routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Update DATA_SCIENCE_KEYS and restructure the Data Governance nav group** - `6e92a78` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `/Users/derekalanrowe/Dev/ChartReuse/layouts/AdminLayout.tsx` - Renamed group label, reordered children, added Advanced submenu, updated DATA_SCIENCE_KEYS

## Decisions Made
- Kept `data-science/pipeline` in `DATA_SCIENCE_KEYS` without a nav link: the old Pipeline page still exists and the group remains auto-opened when visiting it, but the primary nav entry point is now the new Lineage item at `/admin/data-science/lineage`.
- Added `data-science/inputs` proactively so Phase 3's Inputs page will auto-open the group without requiring another AdminLayout edit.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. TypeScript compiled cleanly; lint-staged applied prettier formatting to several files as part of the pre-commit hook.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AdminLayout is ready for any subsequent nav changes in Phase 1
- The `data-science/lineage` and `data-science/inputs` keys are registered; Phase 3 can create those pages and they will auto-highlight correctly in the sidebar
- No blockers

---
*Phase: 01-navigation-and-labels*
*Completed: 2026-03-05*

## Self-Check: PASSED
- SUMMARY.md: FOUND at .planning/phases/01-navigation-and-labels/01-01-SUMMARY.md
- AdminLayout.tsx: FOUND at layouts/AdminLayout.tsx
- Task commit 6e92a78: FOUND in git log
