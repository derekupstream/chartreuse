---
phase: 07-actuals-projections-modes-v1
plan: 01
subsystem: api, ui
tags: [next.js, prisma, antd, segmented, data-map, admin, actuals, projections]

requires:
  - phase: 04-data-map-rsp-feed-trace-graph
    provides: data-map page with FeedPanel + TraceGraph + RSP Tabs; handlerWithUser + checkIsUpstream auth pattern; ComputeRun/MetricResult Prisma models
  - phase: 05-api-playground-v1
    provides: PlaygroundPanel component + onIngest callback wired to data-map
provides:
  - Mode segmented control (RSP API | Actuals | Projections) with URL persistence on data-map page
  - GET /api/admin/data-map/actuals-trace?projectId= returning project, milestones, computeRuns with metricResults
  - GET /api/admin/data-map/projections-trace?projectId= returning project, lineItemSummary, computeRun with metricResults
affects:
  - 07-02 (ActualsGraph and ProjectionsGraph components consume these API contracts)

tech-stack:
  added: []
  patterns:
    - "Mode URL persistence via shallow router.push with ?mode= query param — read from router.query on render"
    - "Conditional render by mode: {mode === 'rsp' && <Tabs/>} {mode === 'actuals' && ...} {mode === 'projections' && ...}"
    - "API response shaping: rename prisma results relation to metricResults for downstream consumers"

key-files:
  created:
    - pages/api/admin/data-map/actuals-trace.ts
    - pages/api/admin/data-map/projections-trace.ts
  modified:
    - pages/admin/data-science/data-map.tsx

key-decisions:
  - "Segmented control positioned above Tabs in its own bordered div — Tabs only visible in RSP mode"
  - "rspActiveTab renamed from activeTab to clarify it is RSP-mode-scoped state"
  - "selectedProjectId state added to data-map for Plan 02 ActualsGraph/ProjectionsGraph to consume"
  - "feedContent height adjusted to account for Segmented control bar (added -46px to viewport calc)"

patterns-established:
  - "Mode-aware data-map pattern: URL-driven mode + conditional render + shared selectedProjectId state"

requirements-completed: [ACT-01, PRJ-01]

duration: 2min
completed: 2026-03-05
---

# Phase 07 Plan 01: Actuals & Projections Modes — Mode Control + Trace APIs Summary

**URL-driven mode segmented control (RSP API / Actuals / Projections) on data-map page plus two new project-trace API routes providing structured data contracts for ActualsGraph and ProjectionsGraph**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T21:21:12Z
- **Completed:** 2026-03-05T21:22:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Two new admin API routes (`actuals-trace`, `projections-trace`) returning structured project-scoped trace data
- Segmented control renders above the existing Feed/Playground tabs; switching modes updates `?mode=` in the URL without full-page navigation
- RSP mode, Feed, and Playground fully preserved — no regressions
- Zero TypeScript errors across all three files

## Task Commits

Each task was committed atomically:

1. **Task 1: Create actuals-trace and projections-trace API routes** - `e62fad4` (feat)
2. **Task 2: Add mode segmented control + URL persistence to data-map.tsx** - `283e9ee` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `pages/api/admin/data-map/actuals-trace.ts` - GET endpoint returning project + milestones + computeRuns (actuals_ingest/backfill) with metricResults
- `pages/api/admin/data-map/projections-trace.ts` - GET endpoint returning project + lineItemSummary (singleUse/reusable items) + latest projection computeRun with metricResults
- `pages/admin/data-science/data-map.tsx` - Added Segmented control, mode state from URL, selectedProjectId state, conditional mode rendering

## Decisions Made
- Segmented control positioned in its own bordered div above Tabs — Tabs only render in RSP mode (`{mode === 'rsp' && <Tabs .../>}`)
- `activeTab` renamed to `rspActiveTab` to scope it clearly to RSP mode only
- `selectedProjectId` state added now so Plan 02 graph components can be wired without changing data-map props interface
- feedContent height calculation updated to subtract extra 46px for Segmented control bar height

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Mode control and API data contracts are in place; Plan 02 can build ActualsGraph and ProjectionsGraph against these API shapes
- `selectedProjectId` and `setSelectedProjectId` are ready in data-map state for Plan 02 to use as props

---
*Phase: 07-actuals-projections-modes-v1*
*Completed: 2026-03-05*

## Self-Check: PASSED

- FOUND: pages/api/admin/data-map/actuals-trace.ts
- FOUND: pages/api/admin/data-map/projections-trace.ts
- FOUND: pages/admin/data-science/data-map.tsx
- FOUND: .planning/phases/07-actuals-projections-modes-v1/07-01-SUMMARY.md
- FOUND commit: e62fad4
- FOUND commit: 283e9ee
