---
phase: 01-navigation-and-labels
plan: 02
subsystem: ui
tags: [admin, data-governance, copy, labels, ant-design]

# Dependency graph
requires:
  - phase: 01-navigation-and-labels
    provides: "plan 01 nav restructure — AdminLayout Data Governance group labels established"
provides:
  - "Constants pages (index/new/edit) retitled to 'Factors' with governance-framing description"
  - "Import page retitled to 'AI Data Uploader' with bulk data onboarding description"
  - "Lineage page description uses governance framing ('Trace how a metric was produced...')"
  - "Pipeline page selectedMenuItem set to 'data-science/pipeline-legacy' (unlisted)"
affects: [02-data-health, 03-inputs-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin page titles match sidebar nav labels exactly (AdminLayout title prop === nav item label)"
    - "Legacy/unlisted pages use '-legacy' suffix in selectedMenuItem to suppress primary nav highlight"

key-files:
  created: []
  modified:
    - pages/admin/data-science/constants/index.tsx
    - pages/admin/data-science/constants/new.tsx
    - pages/admin/data-science/constants/[id]/edit.tsx
    - pages/admin/data-science/import/index.tsx
    - pages/admin/data-science/lineage/index.tsx
    - pages/admin/data-science/pipeline/index.tsx

key-decisions:
  - "Task 1 changes (constants pages) were already committed in plan 01-01 — no duplicate commit needed"
  - "Pipeline selectedMenuItem set to 'data-science/pipeline-legacy' so page loads but highlights no nav item"
  - "Lineage description reframed from 'end-to-end traceability' to 'trace how a metric was produced' (governance voice)"

patterns-established:
  - "Copy framing: use 'governance' and 'audit trail' language in admin descriptions"
  - "Legacy pages: suffix selectedMenuItem with '-legacy' to decouple from primary nav"

requirements-completed: [LBL-01, LBL-02, LBL-03]

# Metrics
duration: 12min
completed: 2026-03-04
---

# Phase 1 Plan 02: Navigation and Labels — Copy Updates Summary

**Six admin pages updated with Data Governance copy: 'Factors' titles, 'AI Data Uploader' heading, governance-framing descriptions, and pipeline nav decoupling**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-04T00:00:00Z
- **Completed:** 2026-03-04T00:12:00Z
- **Tasks:** 2
- **Files modified:** 6 (3 already done in 01-01, 3 in this plan)

## Accomplishments
- Constants pages (index, new, edit) — title, H2, description, and back-button text all updated to 'Factors' framing
- Import page — browser tab and H2 heading updated to 'AI Data Uploader'; description adds 'bulk data onboarding' context
- Lineage page — description rewritten to governance voice ('Trace how a metric was produced from raw inputs...')
- Pipeline page — selectedMenuItem changed to 'data-science/pipeline-legacy' so the legacy page no longer highlights any primary nav item

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Constants pages — titles, headings, and back-link text** - `6e92a78` (feat — committed as part of 01-01)
2. **Task 2: Update Import, Lineage, and Pipeline pages** - `682a9ca` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `pages/admin/data-science/constants/index.tsx` - AdminLayout title → 'Factors', H2 → 'Factors', description → governance framing
- `pages/admin/data-science/constants/new.tsx` - Back button → 'Back to Factors'
- `pages/admin/data-science/constants/[id]/edit.tsx` - Back button → 'Back to Factors'
- `pages/admin/data-science/import/index.tsx` - Title and H2 → 'AI Data Uploader', description adds bulk data onboarding
- `pages/admin/data-science/lineage/index.tsx` - Description rewritten to governance voice
- `pages/admin/data-science/pipeline/index.tsx` - selectedMenuItem → 'data-science/pipeline-legacy'

## Decisions Made
- Task 1 changes (constants files) were applied in plan 01-01's commit; no re-commit was needed. The current HEAD already matched all Task 1 done criteria.
- Pipeline selectedMenuItem suffix '-legacy' is a convention established here: unlisted pages use this pattern so they still render without highlighting a nav item.

## Deviations from Plan

None — plan executed exactly as written. Task 1 changes were pre-applied in 01-01; Task 2 changes applied cleanly in this execution.

## Issues Encountered
- First commit attempt (Task 1) failed with `error: could not write index` from lint-staged. Investigation revealed Task 1 changes had already been committed in plan 01-01 (commit 6e92a78). No data was lost; the working tree matched HEAD for those files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All six label/copy requirements (LBL-01, LBL-02, LBL-03) are complete
- Phase 1 navigation and label work is done; ready for Phase 2 (Data Health)
- No blockers

---
*Phase: 01-navigation-and-labels*
*Completed: 2026-03-04*
