---
phase: 07-actuals-projections-modes-v1
verified: 2026-03-05T22:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 07: Actuals + Projections Modes Verification Report

**Phase Goal:** Data Map shows project-based provenance graphs for actuals and projections in addition to RSP mode.
**Verified:** 2026-03-05T22:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Mode segmented control (RSP API / Actuals / Projections) renders above the feed/graph area on the data-map page | VERIFIED | `pages/admin/data-science/data-map.tsx` lines 75-85: `<Segmented>` rendered in bordered div before mode-conditional content |
| 2 | Selecting a mode updates `?mode=` in the URL without full-page navigation | VERIFIED | `setMode()` function at line 38-42 calls `router.push({ query: { ...router.query, mode: m } }, undefined, { shallow: true })` |
| 3 | On page load, the mode is read from `?mode=` and the correct mode is active | VERIFIED | Line 27: `const mode = ((router.query.mode as DataMapMode \| undefined) ?? 'rsp') as DataMapMode` — derived from `router.query` each render |
| 4 | GET /api/admin/data-map/actuals-trace?projectId= returns project, milestones, computeRuns, metricResults | VERIFIED | `pages/api/admin/data-map/actuals-trace.ts`: full Prisma queries, `results` renamed to `metricResults` in response shaping (lines 61-69), returns `{ project, milestones, computeRuns }` |
| 5 | GET /api/admin/data-map/projections-trace?projectId= returns project, lineItemSummary, computeRun, metricResults | VERIFIED | `pages/api/admin/data-map/projections-trace.ts`: queries singleUseItems, reusableItems, latestComputeRun; returns `{ project, lineItemSummary: { singleUseCount, reusableCount, singleUseItems, reusableItems }, computeRun }` with `metricResults` renamed |
| 6 | Actuals mode: user selects a project, graph renders Project → Milestones → ComputeRuns → MetricResults | VERIFIED | `ActualsGraph.tsx` fetches from actuals-trace via useSWR, passes to `buildActualsGraph()` which builds project → milestone → compute-run → metric-results topology with unlinked-run fallback |
| 7 | Projections mode: user selects a project, graph renders Project → Line Items → ComputeRun → MetricResults | VERIFIED | `ProjectionsGraph.tsx` fetches from projections-trace via useSWR, passes to `buildProjectionsGraph()` which builds project → single-use-items + reusable-items (fork) → compute-run → metric-results topology |
| 8 | Clicking any node in either graph opens a NodeDrawer with record details | VERIFIED | Both graph components: `onNodeClick={(_, node) => setDrawerNode(node)}` + `<NodeDrawer node={drawerNode} onClose={() => setDrawerNode(null)} />`; NodeDrawer handles `project`, `milestone`, `single-use-items`, `reusable-items`, `compute-run`, `metric-results` node types |
| 9 | Actuals and Projections graphs use the same status coloring conventions as the RSP trace graph | VERIFIED | Both layout files copy GREEN/GREY/RED/BLUE style constants and `getComputeRunStyle()` from graphLayout.ts conventions |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `pages/api/admin/data-map/actuals-trace.ts` | Actuals trace API — project, milestones, computeRuns, metricResults | VERIFIED | 73 lines; upstream-auth-gated; full Prisma queries; 400 on missing projectId; 404 on project not found; metricResults shaped correctly |
| `pages/api/admin/data-map/projections-trace.ts` | Projections trace API — project, lineItemSummary, computeRun, metricResults | VERIFIED | 64 lines; upstream-auth-gated; full Prisma queries; 400/404 guards; computeRun.metricResults shaped correctly |
| `pages/admin/data-science/data-map.tsx` | Mode segmented control + URL persistence + mode-aware layout | VERIFIED | Contains `Segmented` (confirmed import line 3); router.push with shallow; conditional renders for rsp/actuals/projections; placeholders fully replaced by ActualsGraph/ProjectionsGraph |
| `components/admin/data-map/actualsGraphLayout.ts` | buildActualsGraph() with ActualsTraceResponse interface and dagre LR layout | VERIFIED | Exports `ActualsTraceResponse` interface and `buildActualsGraph()`; dagre LR with nodesep=40, ranksep=80; handles unlinked runs (project → run fallback) |
| `components/admin/data-map/projectionsGraphLayout.ts` | buildProjectionsGraph() with ProjectionsTraceResponse interface and dagre LR layout | VERIFIED | Exports `ProjectionsTraceResponse` interface and `buildProjectionsGraph()`; fork-join topology (both item nodes → compute-run); dagre LR layout |
| `components/admin/data-map/ActualsGraph.tsx` | React Flow graph for actuals mode with project Select, useSWR, NodeDrawer | VERIFIED | 105 lines; project Select via /api/admin/data-map/projects; useSWR to actuals-trace; useEffect → setNodes/setEdges; loading + empty states; onNodeClick → NodeDrawer |
| `components/admin/data-map/ProjectionsGraph.tsx` | React Flow graph for projections mode with project Select, useSWR, NodeDrawer | VERIFIED | Identical pattern to ActualsGraph; wired to projections-trace; correct empty state text |
| `pages/api/admin/data-map/projects.ts` | Upstream-gated project search API | VERIFIED | 25 lines; upstream auth; optional search filter; take 200; returns `{ projects }` |
| `components/admin/data-map/NodeDrawer.tsx` | NodeDrawer extended with project, milestone, single-use-items, reusable-items node types | VERIFIED | All four new content components (ProjectNodeContent, MilestoneNodeContent, SingleUseItemsContent, ReusableItemsContent) defined; switch cases at lines 318-328 handle all four types |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `pages/admin/data-science/data-map.tsx` | `?mode=` query param | `router.push` with `shallow: true` | WIRED | Line 39: `void router.push({ query: { ...router.query, mode: m } }, undefined, { shallow: true })` |
| `pages/api/admin/data-map/actuals-trace.ts` | `prisma.project.findUnique` + milestone + computeRun queries | Prisma queries joined by projectId | WIRED | Line 17: `prisma.project.findUnique`; lines 27-58: parallel `prisma.projectMilestone.findMany` + `prisma.computeRun.findMany` |
| `pages/api/admin/data-map/projections-trace.ts` | `prisma.project.findUnique` + singleUseLineItem + reusableLineItem + computeRun | Prisma queries joined by projectId | WIRED | Line 17: `prisma.project.findUnique`; lines 26-50: parallel queries for singleUseLineItem, reusableLineItem, computeRun.findFirst |
| `ActualsGraph.tsx` | `/api/admin/data-map/actuals-trace?projectId=` | `useSWR` when selectedProjectId is set | WIRED | Lines 36-38: `useSWR<ActualsTraceResponse>(selectedProjectId ? \`/api/admin/data-map/actuals-trace?projectId=${selectedProjectId}\` : null)` |
| `ProjectionsGraph.tsx` | `/api/admin/data-map/projections-trace?projectId=` | `useSWR` when selectedProjectId is set | WIRED | Lines 36-38: `useSWR<ProjectionsTraceResponse>(selectedProjectId ? \`/api/admin/data-map/projections-trace?projectId=${selectedProjectId}\` : null)` |
| `pages/admin/data-science/data-map.tsx` | `ActualsGraph` + `ProjectionsGraph` | Import + conditional render | WIRED | Lines 7,10: imports; lines 107,110: rendered with `selectedProjectId` + `onSelectProject` props; no placeholder divs remain |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ACT-01 | 07-01, 07-02 | Actuals mode graph: Project → ProjectMilestones → ComputeRuns → MetricResults | SATISFIED | `actualsGraphLayout.ts` builds exactly this topology; `ActualsGraph.tsx` renders it via React Flow wired to actuals-trace API; NodeDrawer handles milestone + compute-run + metric-results detail |
| PRJ-01 | 07-01, 07-02 | Projections mode graph: Project → Line Items (aggregate nodes) → ComputeRun → MetricResults | SATISFIED | `projectionsGraphLayout.ts` builds project → single-use-items + reusable-items → compute-run → metric-results; `ProjectionsGraph.tsx` renders it via React Flow wired to projections-trace API |

No orphaned requirements found. Both ACT-01 and PRJ-01 appear in both plan frontmatter blocks and are verifiably implemented end-to-end.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `ActualsGraph.tsx` | 64 | `placeholder='Select a project...'` | Info | Ant Design Select placeholder attribute — correct usage for empty select state, not a stub |
| `ProjectionsGraph.tsx` | 64 | `placeholder='Select a project...'` | Info | Same as above — correct usage |

No blocker or warning anti-patterns found. The two "placeholder" matches are Ant Design `Select` component prop values (empty state text), not implementation stubs.

---

### Human Verification Required

#### 1. RSP Mode Preservation

**Test:** Navigate to `/admin/data-science/data-map` (no `?mode=` param). Verify the Feed and Playground tabs render and the RSP ingestion feed loads.
**Expected:** RSP mode is default; selecting an ingestion from the feed shows the trace graph unchanged from pre-phase-07 behavior.
**Why human:** RSP mode conditional render (`mode === 'rsp'`) can only be confirmed functioning by browsing the page.

#### 2. Actuals Graph Rendering

**Test:** Switch to Actuals mode via the Segmented control. Select a project that has milestones from the dropdown. Verify the React Flow graph renders with Project → Milestone → ComputeRun → MetricResults nodes.
**Expected:** Graph appears with correct node colors (green project, grey milestones, status-colored runs, green/grey metric-results). URL updates to `?mode=actuals`.
**Why human:** React Flow rendering, dagre layout correctness, and node click → Drawer behavior require visual confirmation.

#### 3. Projections Graph Rendering

**Test:** Switch to Projections mode. Select a project. Verify graph renders Project → Single-Use Items + Reusable Items → ComputeRun → MetricResults with fork-join topology.
**Expected:** Both item nodes converge into the compute-run node. NodeDrawer shows tables of line items when those nodes are clicked.
**Why human:** Fork-join dagre layout and table rendering in Drawer require visual confirmation.

#### 4. Mode Persistence on Reload

**Test:** Navigate to `?mode=projections`, reload the page. Verify the Projections mode is active on load (not RSP default).
**Expected:** Segmented control shows "Projections" as selected value on page load.
**Why human:** Next.js `router.query` hydration behavior (initial render may be empty before hydration) is best confirmed in browser.

#### 5. selectedProjectId Reset on Mode Switch

**Test:** Select a project in Actuals mode, then switch to Projections mode. Verify no stale graph from the previous mode persists.
**Expected:** Graph area shows empty state ("Select a project to view its projections trace") after mode switch.
**Why human:** State reset timing requires runtime observation.

---

### Gaps Summary

No gaps found. All 9 observable truths are verified. All 9 required artifacts exist, are substantive, and are wired into the application. Both requirement IDs (ACT-01, PRJ-01) are fully satisfied. TypeScript compiles clean (exit code 0). All 4 commit hashes from SUMMARYs (`e62fad4`, `283e9ee`, `bba43e5`, `1bb7f06`) exist in git history.

The only open items are human verification tasks for visual and runtime behavior — automated checks cannot substitute for browser testing of React Flow rendering, Drawer interaction, and URL hydration.

---

_Verified: 2026-03-05T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
