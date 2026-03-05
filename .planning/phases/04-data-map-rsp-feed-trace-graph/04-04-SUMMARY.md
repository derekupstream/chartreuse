---
phase: 04-data-map-rsp-feed-trace-graph
plan: "04"
subsystem: ui
tags: [reactflow, dagre, admin, data-map, observability, graph]

requires:
  - phase: 04-03
    provides: FeedPanel and two-panel data-map layout with selectedPeriodId state

provides:
  - React Flow provenance graph (8-node pipeline) mounted in data-map right panel
  - dagre LR auto-layout for graph nodes via buildTraceGraph()
  - Status-colored nodes (green/orange/red/blue/grey) reflecting period and compute run status
  - Supersession dashed edge to greyed-out prior-period node
  - AntD Drawer with type-specific content for all 9 node types
  - MiniMap, Controls (zoom/pan), Background, and fit-view on graph canvas

affects: [data-map, admin observability, RSP feed]

tech-stack:
  added: []
  patterns:
    - "React Flow canvas pattern: useNodesState + useEdgesState + useEffect(buildGraph, [data])"
    - "dagre LR auto-layout: setGraph rankdir:LR, nodesep:40, ranksep:80, node position offset by half width/height"
    - "Node label in data.label (not top-level label property) for React Flow v11"
    - "Node styles as Record<string,unknown> (not React.CSSProperties) to satisfy reactflow Node type"

key-files:
  created:
    - components/admin/data-map/graphLayout.ts
    - components/admin/data-map/TraceGraph.tsx
    - components/admin/data-map/NodeDrawer.tsx
  modified:
    - pages/admin/data-science/data-map.tsx

key-decisions:
  - "Node label placed in data.label not top-level label — React Flow v11 Node type does not accept top-level label"
  - "Style typed as Record<string,unknown> not React.CSSProperties to satisfy Node generic constraint"

patterns-established:
  - "TraceGraph pattern: useSWR for trace data, useEffect to build graph when data changes, NodeDrawer for node detail"
  - "NodeContent switch pattern: single NodeContent component dispatches to type-specific sub-components by node.data.type"

requirements-completed: [MAP-02, MAP-03, MAP-04, MAP-05, MAP-08]

duration: 3min
completed: 2026-03-05
---

# Phase 04 Plan 04: Trace Graph Summary

**React Flow provenance graph with dagre auto-layout, status-colored nodes, supersession edges, and AntD node-detail drawers for full RSP submission observability**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-05T17:44:59Z
- **Completed:** 2026-03-05T17:47:43Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Built `graphLayout.ts` with `buildTraceGraph()`: 8-node pipeline (API Request → Validation → Dedup → Usage Period → Products → Compute Run → Metric Results → Intelligence Update), dagre LR layout, status color lookup
- Built `TraceGraph.tsx`: React Flow canvas with useSWR trace fetch, MiniMap, Controls, Background, fit-view, and NodeDrawer integration
- Built `NodeDrawer.tsx`: AntD Drawer with type-specific content for all 9 node types (api-request, validation, dedup, usage-period, products, compute-run, metric-results, intelligence-update, prior-period)
- Updated `data-map.tsx` to mount TraceGraph in the right panel when a period is selected

## Task Commits

Each task was committed atomically:

1. **Task 1: Build graph layout utility and node/edge builder** - `2442edf` (feat)
2. **Task 2: Build TraceGraph + NodeDrawer, wire into page** - `a82b60f` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `components/admin/data-map/graphLayout.ts` - dagre auto-layout, buildTraceGraph(), status color lookup for all node types
- `components/admin/data-map/TraceGraph.tsx` - React Flow canvas, useSWR trace fetch, minimap/controls/background, node click handler
- `components/admin/data-map/NodeDrawer.tsx` - AntD Drawer dispatching to 9 node-type-specific content components
- `pages/admin/data-science/data-map.tsx` - replaced placeholder with TraceGraph for selected period

## Decisions Made
- Node label placed in `data.label` (not top-level `label`) — React Flow v11 `Node` type does not accept a top-level `label` property; the label is rendered via `data.label` in the default node renderer
- Node style typed as `Record<string, unknown>` rather than `React.CSSProperties` to satisfy the React Flow `Node` generic constraint without importing React in a `.ts` file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Node type constraint: label moved to data, style typed as Record**
- **Found during:** Task 1 (graphLayout.ts)
- **Issue:** Plan specified `label` as a top-level Node property, but React Flow v11 Node type does not accept it; also `React.CSSProperties` requires React import in .ts file
- **Fix:** Moved label into `data.label`, changed style return type to `Record<string, unknown>`
- **Files modified:** `components/admin/data-map/graphLayout.ts`
- **Verification:** `yarn tsc --noEmit` passes clean
- **Committed in:** `2442edf` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary for TypeScript correctness. No scope creep. React Flow still renders node labels from data.label via its default node renderer.

## Issues Encountered
None — TypeScript caught the Node type constraints immediately and the fix was straightforward.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 04 complete: all MAP requirements satisfied (MAP-02 through MAP-08)
- Data Map page now provides full RSP submission observability: feed panel + provenance graph + node detail drawers
- Ready for next milestone phases

---
*Phase: 04-data-map-rsp-feed-trace-graph*
*Completed: 2026-03-05*
