---
phase: 07-actuals-projections-modes-v1
plan: 02
subsystem: ui, api
tags: [next.js, reactflow, dagre, antd, admin, data-map, actuals, projections, graph]

requires:
  - phase: 07-actuals-projections-modes-v1
    plan: 01
    provides: Mode segmented control + actuals-trace/projections-trace API contracts + selectedProjectId state in data-map

provides:
  - ActualsGraph React Flow component: project Select + useSWR actuals-trace + dagre LR layout (Project → Milestones → ComputeRuns → MetricResults)
  - ProjectionsGraph React Flow component: project Select + useSWR projections-trace + dagre LR layout (Project → Single-Use/Reusable Items → ComputeRun → MetricResults)
  - actualsGraphLayout.ts: buildActualsGraph() with ActualsTraceResponse interface
  - projectionsGraphLayout.ts: buildProjectionsGraph() with ProjectionsTraceResponse interface
  - GET /api/admin/data-map/projects: upstream-gated project search API (name contains, take 200)
  - NodeDrawer extended: project, milestone, single-use-items, reusable-items node types
  - data-map.tsx wired: placeholder divs replaced with real ActualsGraph/ProjectionsGraph components

affects: []

tech-stack:
  added: []
  patterns:
    - "Graph layout builder pattern: separate .ts file per graph type, exports interface + build function, dagre LR, returns { nodes, edges }"
    - "React Flow graph component pattern: project Select → useSWR → useEffect → setNodes/setEdges → ReactFlow with NodeDrawer"
    - "NodeDrawer extension pattern: add interface + content component + switch case for each new node type"

key-files:
  created:
    - components/admin/data-map/actualsGraphLayout.ts
    - components/admin/data-map/projectionsGraphLayout.ts
    - components/admin/data-map/ActualsGraph.tsx
    - components/admin/data-map/ProjectionsGraph.tsx
    - pages/api/admin/data-map/projects.ts
  modified:
    - components/admin/data-map/NodeDrawer.tsx
    - pages/admin/data-science/data-map.tsx

key-decisions:
  - "IssueNode in ActualsGraph/ProjectionsGraph is a simpler version than TraceGraph — no badge/link needed since these node types don't link to the inputs page"
  - "Unlinked compute runs (not referenced by any milestone) draw directly from project node to avoid orphaned nodes in actuals graph"
  - "Node data stores full entity object (e.g. node.data.milestone, node.data.project) so NodeDrawer can display rich detail without an extra fetch"

patterns-established:
  - "Graph layout builder pattern: separate .ts file per graph type with exported interface + builder function"

requirements-completed: [ACT-01, PRJ-01]

duration: 3min
completed: 2026-03-05
---

# Phase 07 Plan 02: ActualsGraph + ProjectionsGraph Components Summary

**React Flow provenance graphs for actuals (Project → Milestones → ComputeRuns → MetricResults) and projections (Project → Line Items → ComputeRun → MetricResults) with dagre layout, project Select dropdown, and NodeDrawer detail panel**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-05T21:25:03Z
- **Completed:** 2026-03-05T21:28:59Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Two graph layout builder files (`actualsGraphLayout.ts`, `projectionsGraphLayout.ts`) with exported interfaces and dagre LR positioning
- Two React Flow graph components (`ActualsGraph`, `ProjectionsGraph`) with project Select, useSWR data fetching, and NodeDrawer integration
- `GET /api/admin/data-map/projects` upstream-gated endpoint used by both graph components for the project dropdown
- `NodeDrawer.tsx` extended with four new node types: `project`, `milestone`, `single-use-items`, `reusable-items`
- `data-map.tsx` placeholder divs replaced with real components — ACT-01 and PRJ-01 fully delivered
- Zero TypeScript errors across all new and modified files

## Task Commits

Each task was committed atomically:

1. **Task 1: Graph layout builders for actuals and projections** - `bba43e5` (feat)
2. **Task 2: ActualsGraph + ProjectionsGraph components + wire into data-map page** - `1bb7f06` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `components/admin/data-map/actualsGraphLayout.ts` - `buildActualsGraph()` + `ActualsTraceResponse` interface; handles milestone → compute-run links and unlinked run fallback
- `components/admin/data-map/projectionsGraphLayout.ts` - `buildProjectionsGraph()` + `ProjectionsTraceResponse` interface; fork-join topology (both item nodes → compute-run)
- `components/admin/data-map/ActualsGraph.tsx` - React Flow component with project Select, useSWR actuals-trace, loading/empty states
- `components/admin/data-map/ProjectionsGraph.tsx` - Identical pattern wired to projections-trace
- `pages/api/admin/data-map/projects.ts` - GET with upstream auth + optional search filter + take 200
- `components/admin/data-map/NodeDrawer.tsx` - Added ProjectNodeContent, MilestoneNodeContent, SingleUseItemsContent, ReusableItemsContent + 4 switch cases
- `pages/admin/data-science/data-map.tsx` - Imports ActualsGraph/ProjectionsGraph, replaces placeholder content, passes selectedProjectId + onSelectProject props

## Decisions Made
- IssueNode in ActualsGraph/ProjectionsGraph is a simplified version — no badge or navigation to inputs page since these node types don't have data health issues in the same way
- Unlinked compute runs (no milestone references them via `computeRunId`) fall back to a direct `project → run` edge to keep the graph connected
- Full entity objects stored in `node.data` (e.g., `node.data.milestone`) so NodeDrawer can render rich detail panels without additional network requests

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- ACT-01 and PRJ-01 fully satisfied end-to-end
- Phase 07 plans 01 and 02 are both complete — data-map page has all three modes operational
- No blockers for remaining phase 07 plans if any

---
*Phase: 07-actuals-projections-modes-v1*
*Completed: 2026-03-05*

## Self-Check: PASSED

- FOUND: components/admin/data-map/actualsGraphLayout.ts
- FOUND: components/admin/data-map/projectionsGraphLayout.ts
- FOUND: components/admin/data-map/ActualsGraph.tsx
- FOUND: components/admin/data-map/ProjectionsGraph.tsx
- FOUND: pages/api/admin/data-map/projects.ts
- FOUND: .planning/phases/07-actuals-projections-modes-v1/07-02-SUMMARY.md
- FOUND commit: bba43e5
- FOUND commit: 1bb7f06
