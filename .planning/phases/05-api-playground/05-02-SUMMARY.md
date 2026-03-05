---
phase: 05-api-playground
plan: "02"
subsystem: api
tags: [admin, rsp, playground, antd, swr, data-map, tabs]

# Dependency graph
requires:
  - phase: 05-api-playground
    provides: "ingestUsagePeriod() lib function callable from any server context"
provides:
  - "POST /api/admin/data-map/playground — validate-only and full-ingest admin endpoint"
  - "PlaygroundPanel.tsx — JSON paste UI with API key select, mode radio, validate/ingest result display"
  - "data-map.tsx tabbed layout — Feed and API Playground tabs with onIngest auto-navigation"
affects: [05-api-playground, data-map, rsp-observability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Playground pattern: admin can validate RSP payloads without DB writes, or run live ingestions that immediately appear in trace graph"
    - "onIngest callback pattern: PlaygroundPanel calls parent to switch tabs and select new period ID"

key-files:
  created:
    - pages/api/admin/data-map/playground.ts
    - components/admin/data-map/PlaygroundPanel.tsx
  modified:
    - pages/admin/data-science/data-map.tsx

key-decisions:
  - "Playground endpoint reuses same overlap query as ingestUsagePeriod for validate mode — no duplication"
  - "Warning banner (Alert type=warning) shown only when Ingest mode is selected — validate mode shows clean UI"
  - "onIngest handler in data-map.tsx calls both setSelectedPeriodId and setActiveTab — single action switches tab + selects period"

patterns-established:
  - "Thin API route: endpoint handles auth, validation, overlap query; delegates DB writes to ingestUsagePeriod()"
  - "Tabs items array pattern (not TabPane): consistent with test-runs/index.tsx in codebase"

requirements-completed: [PLY-01, PLY-02]

# Metrics
duration: 15min
completed: 2026-03-05
---

# Phase 05 Plan 02: API Playground Summary

**Admin playground tab on Data Map: JSON paste interface with validate-only and live-ingest modes, View-in-Graph auto-navigation after ingest**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-05T18:15:00Z
- **Completed:** 2026-03-05T18:30:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Admin endpoint at POST /api/admin/data-map/playground with both validate and ingest modes, using the same auth guard (handlerWithUser + checkIsUpstream) as all other data-map routes
- PlaygroundPanel.tsx with JSON textarea pre-filled with example payload, API key select sourced from SWR, mode radio with warning banner for ingest mode, validate/ingest result displays with check tags and metrics
- data-map.tsx refactored to tabbed layout (Feed + API Playground); onIngest callback auto-switches to Feed tab and selects new period in the trace graph

## Task Commits

Each task was committed atomically:

1. **Task 1: Create playground API endpoint** - `321f502` (feat)
2. **Task 2: Build PlaygroundPanel and wire tabs into data-map.tsx** - `f3332d9` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `pages/api/admin/data-map/playground.ts` — POST endpoint; validate mode returns checks + overlap count without DB writes; ingest mode calls ingestUsagePeriod() and returns new period ID + metrics
- `components/admin/data-map/PlaygroundPanel.tsx` — Playground UI; JSON textarea, API key select, mode radio, warning banner, validate/ingest result display, View in Graph button
- `pages/admin/data-science/data-map.tsx` — Refactored from single-page layout to Tabs; Feed tab contains existing two-panel layout; Playground tab mounts PlaygroundPanel with onIngest handler

## Decisions Made

- Playground endpoint reuses the same Prisma overlap query structure as ingestUsagePeriod for validate mode, ensuring consistency between what validate reports and what ingest would actually supersede
- Warning banner (Alert type=warning) shown only when Ingest mode is active, keeping the validate-only flow clean and non-alarming for routine payload testing
- onIngest handler in data-map.tsx is a single two-line callback that calls both setSelectedPeriodId(newPeriodId) and setActiveTab('feed'), which causes the Feed tab to become active and TraceGraph to immediately render the new period's provenance trace

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 05 is complete: playground tab, API endpoint, and View-in-Graph navigation all functional
- Milestone v1.9 Data Map + RSP Observability is now feature-complete across phases 04 and 05

---
*Phase: 05-api-playground*
*Completed: 2026-03-05*
