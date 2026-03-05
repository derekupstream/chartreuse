---
phase: 06-data-health-rsp-integration
plan: "02"
subsystem: admin-data-map
tags: [data-health, trace-graph, react-flow, issue-badges, navigation]
dependency_graph:
  requires: [06-01]
  provides: [issue-badge-navigation]
  affects: [trace-graph, inputs-page]
tech_stack:
  added: []
  patterns: [react-flow-custom-node-types, client-side-filter-by-query-param]
key_files:
  created: []
  modified:
    - pages/api/admin/data-map/periods/[id]/trace.ts
    - components/admin/data-map/graphLayout.ts
    - components/admin/data-map/TraceGraph.tsx
    - pages/admin/data-science/inputs/index.tsx
decisions:
  - IssueNode registered as default nodeType overrides all React Flow nodes — avoids per-node type complexity while intercepting all nodes with a single component
  - entityId stored directly in node data (not derived from data.period?.id) — consistent access across both usage-period and products nodes regardless of which period fields they carry
  - Client-side filter on inputs page (not server-side re-fetch) — scan POST already returns all issues; entityId filter is a UX narrowing, not a data query
metrics:
  duration_seconds: 121
  completed_date: "2026-03-05"
  tasks_completed: 2
  files_modified: 4
---

# Phase 06 Plan 02: Trace Graph Issue Badges + Filtered Navigation Summary

**One-liner:** Red issue-count badges on trace graph nodes with one-click navigation to a pre-filtered Data Inputs page via React Flow custom node types and query param filtering.

## What Was Built

Added visual data health issue indicators to the RSP trace graph and wired them to filtered navigation into the Data Inputs page.

### Task 1: Extend trace API with issue count + update graphLayout node data

**Files:** `pages/api/admin/data-map/periods/[id]/trace.ts`, `components/admin/data-map/graphLayout.ts`
**Commit:** `84c51b7`

- Added `prisma.dataHealthIssue.count` query for open issues linked to the period by `entityId`
- Returned `issueCount` on the period object in the trace API JSON response
- Added `issueCount?: number` to `TracePeriod` interface in graphLayout.ts
- Passed `issueCount` and `entityId` into both the `usage-period` and `products` node `data` objects

### Task 2: Issue badge on graph nodes + filtered inputs page navigation

**Files:** `components/admin/data-map/TraceGraph.tsx`, `pages/admin/data-science/inputs/index.tsx`
**Commit:** `69474b6`

- Created `IssueNode` functional component using React Flow's `NodeProps` — renders antd `Badge` with issue count when `data.issueCount > 0`
- Registered `IssueNode` as `nodeTypes = { default: IssueNode }` — intercepts all default nodes without needing per-type registration
- Badge `onClick` calls `e.stopPropagation()` to prevent NodeDrawer from opening, then `router.push('/admin/data-science/inputs?entityId={id}')` using `data.entityId`
- Added `useRouter` to inputs page; reads `router.query.entityId` as `entityIdFilter`
- Client-side `displayedIssues` computed: `entityIdFilter ? issues.filter(i => i.entityId === entityIdFilter) : issues`
- Filter notice rendered between header and Spin when `entityIdFilter` is active: shows entity ID in code block + "Clear filter" button that navigates to `/admin/data-science/inputs`
- Empty state guard uses `displayedIssues.length` so filtered view with no matches shows the all-clear state

## Decisions Made

1. **IssueNode as `default` nodeType** — Overrides the built-in default renderer for all nodes. Avoids creating separate named types per node kind; all nodes benefit from the badge capability automatically.

2. **`entityId` in node data** — Both usage-period and products nodes explicitly receive `entityId: trace.period.id` so `IssueNode` can read `data.entityId` uniformly without checking node type.

3. **Client-side filtering** — The scan POST already returns all issues; filtering by `entityId` is a client-side narrowing of the already-loaded list. No extra API call needed.

## Deviations from Plan

None — plan executed exactly as written.

## Artifacts Verified

- `pages/api/admin/data-map/periods/[id]/trace.ts` — returns `issueCount` field on period object via `prisma.dataHealthIssue.count`
- `components/admin/data-map/graphLayout.ts` — `TracePeriod.issueCount?: number`; usage-period and products nodes have `issueCount` and `entityId` in data
- `components/admin/data-map/TraceGraph.tsx` — `IssueNode` custom nodeType renders antd Badge; badge click calls `router.push` with entityId param
- `pages/admin/data-science/inputs/index.tsx` — reads `entityId` query param, applies client-side filter, renders filter notice with Clear button

## Self-Check: PASSED

Files exist:
- FOUND: pages/api/admin/data-map/periods/[id]/trace.ts
- FOUND: components/admin/data-map/graphLayout.ts
- FOUND: components/admin/data-map/TraceGraph.tsx
- FOUND: pages/admin/data-science/inputs/index.tsx

Commits exist:
- FOUND: 84c51b7 (Task 1)
- FOUND: 69474b6 (Task 2)

TypeScript: yarn tsc --noEmit PASSED
