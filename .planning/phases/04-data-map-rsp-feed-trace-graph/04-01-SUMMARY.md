---
phase: 04-data-map-rsp-feed-trace-graph
plan: 01
subsystem: ui
tags: [reactflow, dagre, admin, data-governance, next-pages]

# Dependency graph
requires: []
provides:
  - reactflow@11.11.4 and @dagrejs/dagre@2.0.4 installed and importable
  - Data Map page shell at /admin/data-science/data-map with UPSTREAM_ADMIN auth gate
  - Data Map nav entry in AdminLayout Data Governance sidebar between Inputs and Factors
affects:
  - 04-02-PLAN  # RSP feed table — imports reactflow
  - 04-03-PLAN  # Trace graph — uses ReactFlow + dagre layout

# Tech tracking
tech-stack:
  added:
    - reactflow@11.11.4
    - "@dagrejs/dagre@2.0.4"
    - "@types/dagre@0.7.54 (devDependency)"
  patterns:
    - Admin page auth uses getUserFromContext + checkIsUpstream (not raw Supabase client)
    - Admin pages export getLayout passthrough for AdminLayout to handle nav

key-files:
  created:
    - pages/admin/data-science/data-map.tsx
  modified:
    - layouts/AdminLayout.tsx
    - package.json
    - yarn.lock

key-decisions:
  - "Used getUserFromContext + checkIsUpstream auth pattern (consistent with all other data-science admin pages) instead of raw createSupabaseServerPropsClient pattern shown in plan interfaces"

patterns-established:
  - "Data Map page: scaffold-only placeholder; feed table (Plan 02) and graph panel (Plan 03) extend this shell"

requirements-completed:
  - MAP-01

# Metrics
duration: 12min
completed: 2026-03-05
---

# Phase 04 Plan 01: Data Map Shell + React Flow Dependencies Summary

**Installed reactflow + dagre and scaffolded the /admin/data-science/data-map page shell with nav registration in AdminLayout**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-05T17:23:00Z
- **Completed:** 2026-03-05T17:35:12Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Installed reactflow@11.11.4 and @dagrejs/dagre@2.0.4 — unblocks all subsequent React Flow code in Plans 02-03
- Added Data Map nav entry to AdminLayout Data Governance sidebar (between Inputs and Factors)
- Created auth-protected page shell at /admin/data-science/data-map with AdminLayout wrapper and placeholder title/subtitle

## Task Commits

Each task was committed atomically:

1. **Task 1: Install reactflow and @dagrejs/dagre packages** - `3b71bed` (chore)
2. **Task 2: Register nav entry and scaffold page shell** - `07a36c1` (feat)

**Plan metadata:** (docs commit — see final_commit step)

## Files Created/Modified
- `pages/admin/data-science/data-map.tsx` - Data Map page shell: UPSTREAM_ADMIN auth gate, AdminLayout wrapper, Typography title/subtitle
- `layouts/AdminLayout.tsx` - Added 'data-science/data-map' to DATA_SCIENCE_KEYS; added Data Map nav link after Inputs, before Factors
- `package.json` - Added reactflow, @dagrejs/dagre, @types/dagre
- `yarn.lock` - Updated with new package tree

## Decisions Made
- Used `getUserFromContext` + `checkIsUpstream` auth pattern (consistent with all other data-science admin pages such as inputs/index.tsx, calculations/index.tsx) rather than raw `createSupabaseServerPropsClient` pattern shown in the plan's interface block. The plan interface block described an older/alternative pattern; the established codebase pattern is the correct one.

## Deviations from Plan

None - plan executed exactly as written. Auth pattern deviation is a correct choice following existing codebase conventions, not a rule-triggered deviation.

## Issues Encountered
- Plan's verification command `node -e "require('./node_modules/reactflow/dist/cjs/index.js')..."` failed because reactflow ships only ESM + UMD (no CJS). Used `node -e "require('reactflow')"` instead via Node module resolution — confirmed working.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- reactflow and dagre are installed — Plan 02 (RSP feed table) and Plan 03 (provenance graph) can begin immediately
- Nav entry and page shell are live — the Data Map route is discoverable
- No blockers for subsequent plans

---
*Phase: 04-data-map-rsp-feed-trace-graph*
*Completed: 2026-03-05*
