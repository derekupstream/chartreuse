---
phase: 04-data-map-rsp-feed-trace-graph
plan: 03
subsystem: admin-ui
tags: [antd, swr, react, admin, data-map, feed-panel, rsp]

# Dependency graph
requires:
  - phase: 04-01
    provides: Data Map page shell at /admin/data-science/data-map with UPSTREAM_ADMIN auth gate
  - phase: 04-02
    provides: Paginated RSP period feed API at GET /api/admin/data-map/periods
provides:
  - FeedPanel component at components/admin/data-map/FeedPanel.tsx — paginated RSP ingestion table with search + filter + row selection
  - Updated data-map page at pages/admin/data-science/data-map.tsx — two-panel layout with FeedPanel on left, graph placeholder on right
affects:
  - 04-04-PLAN  # Trace graph component — replaces right-panel placeholder with React Flow graph

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SWR with URLSearchParams key — page/search/filter state assembled into query string as SWR cache key
    - Debounced search state — searchInput (immediate) + search (300ms delayed) pattern prevents over-fetching
    - Auto-select first row — useEffect watching data triggers onSelect(data.periods[0].id) when selectedId is null
    - rowClassName highlight — ant-table-row-selected CSS class applied via prop for keyboard-free row highlight

key-files:
  created:
    - components/admin/data-map/FeedPanel.tsx
  modified:
    - pages/admin/data-science/data-map.tsx

key-decisions:
  - "Search state split into searchInput (immediate) + search (debounced 300ms) to avoid excessive SWR refetches while typing"
  - "Auto-select only fires when selectedId is null — avoids clobbering user selection on re-fetch"
  - "Date range pickers deferred from filter row as planned — keeps filter row simple (search + 2 selects)"

requirements-completed:
  - MAP-01
  - MAP-06
  - MAP-07

# Metrics
duration: 5min
completed: 2026-03-05
---

# Phase 04 Plan 03: RSP Feed Panel + Two-Panel Layout Summary

**One-liner:** AntD paginated feed panel with SWR-driven filters + auto-select wired into a two-panel data-map page layout.

## What Was Built

The left feed panel (`FeedPanel.tsx`) is a full-featured AntD Table component that:
- Fetches RSP ingestion periods from `GET /api/admin/data-map/periods` via SWR
- Supports debounced search (org name / client ID), status dropdown, and compute-status dropdown
- Auto-selects the first row on load when no period is selected
- Highlights the selected row via `ant-table-row-selected` and fires `onSelect` on row click
- Shows paginated results (20/page) with Date Range, RSP Org, Status (Tag with color), Impact, Ingested (relative), and Products columns

The data-map page (`data-map.tsx`) was updated from scaffold to a two-panel layout:
- Left 40%: FeedPanel with "RSP Ingestion Feed" heading
- Right 60%: placeholder text (period ID shown when selected, "Select an ingestion" when not)
- `selectedPeriodId` state wired as `selectedId`/`onSelect` props to FeedPanel

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. `yarn tsc --noEmit` — PASSED, no errors
2. `components/admin/data-map/FeedPanel.tsx` — EXISTS
3. SWR fetches `/api/admin/data-map/periods` — CONFIRMED (1 occurrence in FeedPanel)
4. Two-panel flex layout in data-map.tsx — CONFIRMED
5. FeedPanel imported and rendered in data-map.tsx — CONFIRMED

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: Build FeedPanel | `742827e` | feat(04-03): build FeedPanel component for RSP ingestion feed |
| Task 2: Update data-map page | `58d7867` | feat(04-03): update data-map page with two-panel layout |

## Self-Check: PASSED

- `/Users/derekalanrowe/Dev/ChartReuse/components/admin/data-map/FeedPanel.tsx` — FOUND
- `/Users/derekalanrowe/Dev/ChartReuse/pages/admin/data-science/data-map.tsx` — FOUND
- Commit `742827e` — FOUND
- Commit `58d7867` — FOUND
