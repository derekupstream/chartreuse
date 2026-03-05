# Phase 4: Data Map Page + RSP Feed + Trace Graph - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

New `/admin/data-science/data-map` page added to the Data Governance nav group. Delivers:
1. A paginated, searchable, filterable RSP ingestion feed table
2. A React Flow provenance graph for any selected ingestion (API Request → Validation → Dedup → UsageTimePeriod → UsagePeriodProducts → ComputeRun → MetricResults → Intelligence Update)
3. Node status coloring, supersession dashed edges, node detail drawers, minimap/zoom/pan

API Playground, DataHealthIssue integration, and Actuals/Projections modes are separate phases. This phase is RSP feed + graph only.

</domain>

<decisions>
## Implementation Decisions

### Page Layout
- **Two-panel split**: Feed on left (~40%), graph on right (~60%)
- **Fixed width** — no resizable splitter, no collapse toggle
- **Graph empty state**: "Select an ingestion from the feed to view its trace" message when no row selected
- **Auto-select first row** on page load — shows the most recent ingestion's graph immediately; no blank state on initial visit
- **Search bar and filter row** positioned above the feed panel only (not spanning full page width)

### Feed Table
- **Primary columns**: Date range (dateMin–dateMax), RSP Org name + client_id, Status badge (active/superseded/failed), Computed impact (CO2 kg, waste lbs, water gal)
- **Secondary columns**: Ingested at (createdAt timestamp), Event count (total events in submission)
- **Issues column**: Reserved/hidden for Phase 6 (DataHealthIssue integration not yet built)
- **ComputeRun status**: Not a separate column — covered by the main status badge
- **Pagination**: 20 rows per page, default sort newest first
- **Row click**: Highlights the row and renders the selected period's trace graph in the right panel

### Graph Node Structure
- **UsagePeriodProducts**: Single aggregate node — "N Products". Clicking opens AntD Drawer listing each product: reusable_type, in/out warehouse event counts, computed impact contribution
- **MetricResults**: Single aggregate node — "N Metrics". Clicking opens AntD Drawer listing: metric key, value, units for each MetricResult row
- **Supersession chain**: If `supersededById` exists, a dashed edge connects the current UsageTimePeriod node to a greyed-out prior period subgraph. The prior period node is visible but visually de-emphasized (grey, no full trace expansion)

### Synthetic Node Drawers
- **API Request node**: Clicking opens Drawer showing rawPayload JSON (from UsageTimePeriod.rawPayload) in a collapsible/formatted code block. Most important thing an admin needs to debug submission issues.
- **Validation node**: Clicking opens Drawer showing validation result summary — list of checks run (required fields, date order, events non-empty, events array not empty), pass/fail per check, any field-level errors or warnings. Derived from ingestion logic, not stored as a separate record.
- **Dedup node**: Clicking opens Drawer showing overlap check result — whether an overlapping period was found, matching period's ID and date range if one existed, the decision made (fresh/superseded/rejected). Key for debugging duplicate submissions.
- **Intelligence Update node**: Clicking opens Drawer showing benchmark refresh status — yes/no whether benchmarks were refreshed, timestamp if yes, which org's benchmarks updated. Simple completion indicator.

### Node Status Coloring
- Green: active, compute succeeded
- Orange: superseded (period was superseded by a newer submission)
- Red: failed (validation failed or compute error)
- Blue: running (compute in progress)
- Grey: synthetic nodes (API Request, Validation, Dedup, Intelligence Update) unless error (red)

### Claude's Discretion
- Exact dagre layout direction (top-down vs left-right) — use whichever reads better for a linear pipeline
- Node dimensions, typography, spacing within React Flow canvas
- AntD Drawer width and content formatting
- Exact column widths in the feed table
- Loading skeleton design for feed and graph

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `layouts/AdminLayout.tsx`: Data Governance nav group already exists. Add `data-science/data-map` entry after `data-science/inputs` (between Inputs and Factors). Also add to `DATA_SCIENCE_KEYS` array at top of file.
- `prisma/schema.prisma` — `UsageTimePeriod` model has all needed fields: `rawPayload`, `status`, `supersededById`, `co2AvoidedKg`, `waterSavedGallons`, `wasteDivertedLbs`, `dateMin`, `dateMax`, `clientExternalId`, `orgId`, `submittedByKeyId`
- `prisma/schema.prisma` — `ComputeRun` model: `runType`, `status`, `errorText`, `metadataJson`, `startedAt`, `finishedAt`
- `prisma/schema.prisma` — `MetricResult` model: linked to `ComputeRun` via `runId`
- `prisma/schema.prisma` — `UsagePeriodProduct`: linked to `UsageTimePeriod` via `periodId`
- Existing AntD `Table`, `Drawer`, `Badge`, `Tag` usage throughout admin pages — follow same patterns

### Established Patterns
- Admin pages use `getServerSideProps` for auth check, then load data client-side via SWR or direct fetch
- `AdminLayout` wraps all admin pages with `selectedMenuItem` prop
- AntD `Table` with server-side pagination is used on `/admin/projects`, `/admin/orgs` — follow that pattern
- Drawers open with `open`/`onClose` pattern using local state

### Integration Points
- `layouts/AdminLayout.tsx`: Add `data-science/data-map` to `DATA_SCIENCE_KEYS` + nav children
- New page: `pages/admin/data-science/data-map.tsx`
- New API route: `pages/api/admin/data-map/periods.ts` — paginated list of UsageTimePeriods with RSP org info, search params, filters
- New API route: `pages/api/admin/data-map/periods/[id]/trace.ts` — fetch full trace data for one period (UsageTimePeriod + products + computeRun + metricResults)
- React Flow + dagre: install `reactflow` + `@dagrejs/dagre` before implementation

</code_context>

<specifics>
## Specific Ideas

- The page should feel like a master-detail admin view (similar to GitHub's PR list + diff view). Feed on left, graph fills the right panel.
- First row is auto-selected on load so the page isn't empty — admin always sees a graph immediately.
- Aggregate nodes for Products and Metrics keep the graph linear and readable — one node per "stage" in the pipeline, not one node per DB row.
- Superseded prior periods show as a greyed-out subgraph connected by a dashed edge — visible but clearly subordinate to the active period's trace.
- The API Request node's primary value is the rawPayload viewer — this is the first thing an admin checks when an RSP says "my submission failed."

</specifics>

<deferred>
## Deferred Ideas

- API Playground (paste JSON, validate/ingest) — Phase 5
- DataHealthIssue badges on graph nodes — Phase 6
- Actuals mode and Projections mode on the Data Map — Phase 7
- Issues column in feed table — deferred until Phase 6 builds DataHealthIssue during RSP ingestion

</deferred>

---

*Phase: 04-data-map-rsp-feed-trace-graph*
*Context gathered: 2026-03-05*
