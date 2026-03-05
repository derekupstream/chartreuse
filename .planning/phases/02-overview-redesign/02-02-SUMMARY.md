---
phase: 02-overview-redesign
plan: 02
subsystem: ui
tags: [next.js, ant-design, styled-components, admin, data-governance]

# Dependency graph
requires:
  - phase: 02-overview-redesign
    plan: 01
    provides: Props type with 12 stat fields, getServerSideProps with Prisma queries, System Health KPI row, governance title/subtitle
provides:
  - Complete Data Governance Admin overview page with System Architecture Diagram, Section Cards 3x2 grid, and How It Works Collapse
affects: [phase 03 inputs page, any admin pages linked from section cards]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DiagramNode $group prop: 'input'|'processing'|'output' drives background/border color via styled-components conditional — blue, green, amber"
    - "SECTION_CARDS array inside component body: JSX icon values require component scope; placed before return statement"
    - "Collapse with no defaultActiveKey: starts closed per locked UX decision; ghost + white background + border pattern"

key-files:
  created: []
  modified:
    - pages/admin/data-science/index.tsx

key-decisions:
  - "Combined Tasks 1 and 2 into single commit — both tasks modify the same file and the old quick-link section and old How-to Collapse needed to be removed while adding new content; splitting would create an intermediate broken state"
  - "SECTION_CARDS placed inside component body (not module scope) to allow JSX icon values without extra typing overhead"
  - "No defaultActiveKey on How It Works Collapse — starts closed per OVW-04 locked decision"
  - "Removed Button component from antd imports — KpiCardBlock now uses plain <a> tag for View link"

patterns-established:
  - "DiagramWrapper/DiagramRow/DiagramNode/DiagramArrow: CSS flex pipeline diagram pattern for admin overview pages"

requirements-completed: [OVW-02, OVW-03, OVW-04]

# Metrics
duration: 3min
completed: 2026-03-05
---

# Phase 2 Plan 02: Data Governance Admin Visual Redesign Summary

**CSS flex pipeline Architecture Diagram with 6-node 2-row layout, Section Cards 3x2 grid (6 governance sections), and How Impact Governance Works Collapse replacing old quick-link cards**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-05T02:17:27Z
- **Completed:** 2026-03-05T02:20:06Z
- **Tasks:** 2 (combined into 1 commit for file consistency)
- **Files modified:** 1

## Accomplishments
- Added 6 new styled-components: DiagramWrapper, DiagramRow, DiagramNode (color-grouped), DiagramArrow, DiagramNodeTitle, DiagramNodeSub
- System Architecture card: 2-row flex pipeline — Row 1: Projects/RSP Data → Factor Library → Calculator Engine; Row 2: ComputeRun → MetricResult → Dashboards/Insights
- Clickable Links on 4 processing nodes (Factor Library, Calculator Engine, ComputeRun, MetricResult) navigating to correct admin pages
- Replaced old quick-link cards (Calculations/Import/Governance) with Section Cards 3x2 grid (6 cards: Inputs, Factors, Calculations, Test Runs, Lineage, Methodology)
- Replaced old 5-step How-to Collapse with 6-step "How Impact Governance Works" Collapse (starts closed, governance-framed titles with Links)
- Removed unused imports: CodeOutlined, ImportOutlined, Tag, Button

## Task Commits

Tasks 1 and 2 were combined into a single atomic commit (both touch the same file, removing old sections while adding new ones):

1. **Tasks 1+2: Architecture Diagram + Section Cards + How It Works Collapse** - `b02efb2` (feat)

## Files Created/Modified
- `pages/admin/data-science/index.tsx` - Architecture Diagram styled-components + System Architecture card + Section Cards 3x2 grid + How It Works Collapse; old quick-link cards and old How-to Collapse removed

## Decisions Made
- Combined Tasks 1 and 2 into one commit — the old quick-link section and old How-to Collapse needed simultaneous removal to avoid an intermediate file with orphaned JSX and unused imports that would fail the linter.
- `SECTION_CARDS` array placed inside component body (before return) — icon values are JSX (`<UploadOutlined />` etc.) which requires component scope; placing outside would require `React.ReactNode` typing gymnastics.
- No `defaultActiveKey` on Collapse — How Impact Governance Works starts closed per OVW-04 locked decision.
- Replaced `<Button href={href}>` in KpiCardBlock with `<a href={href}>` — removed Button from antd imports since it was the only usage and the KPI card footer link works fine as a plain anchor.

## Deviations from Plan

None - plan executed exactly as written. Tasks 1 and 2 were combined into a single commit (same pattern as Plan 01) for file consistency, not due to any bug or deviation.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 OVW requirements now satisfied across Plans 01 and 02
- Full page layout complete: Title/subtitle → System Health KPI row → System Architecture → Section Cards → How It Works
- Phase 3 (Data Inputs page) can proceed — `/admin/data-science/inputs` route is linked from Architecture Diagram, KPI row, Section Cards, and How It Works step 1

---
*Phase: 02-overview-redesign*
*Completed: 2026-03-05*
