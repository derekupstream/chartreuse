# Phase 2: Overview Redesign - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the existing `/admin/data-science` overview page (`pages/admin/data-science/index.tsx`). No new pages, no DB migrations. Delivers: updated title/subtitle, System Architecture diagram, 6 section cards, System Health KPI row (4 cards), and a collapsible "How Impact Governance Works" 6-step walkthrough.

</domain>

<decisions>
## Implementation Decisions

### Page layout (top to bottom)
- Title/subtitle → System Health KPI row → System Architecture Diagram → Section Cards → How It Works (collapsible)
- Health KPIs surface at the top — most actionable info for an operator

### Architecture diagram
- CSS flex row with arrows — pure HTML/CSS, no new dependencies, styled-components
- 2-row layout: row 1 = Projects/RSP Data → Factor Library → Calculator Engine; row 2 = ComputeRun → MetricResult → Dashboards/Insights
- Each node is responsive (wraps to vertical on narrow screens — admin is typically desktop but should wrap cleanly)
- Relevant nodes are clickable links: Factor Library → `/admin/data-science/constants`, Calculator Engine → `/admin/data-science/calculations`, ComputeRun → `/admin/data-science/runs`, MetricResult → `/admin/data-science/runs` (same), Dashboards → `/admin` or org analytics. Projects/RSP Data and Dashboards/Insights are not admin pages — they do not link
- Nodes are color-grouped: input (Projects/RSP Data) in one tint, processing (Factor Library, Calculator Engine, ComputeRun, MetricResult) in another, output (Dashboards/Insights) in a third
- Each node shows a short subtitle (live count or descriptor): Projects/RSP Data → "N projects", Factor Library → "N factors", Calculator Engine → "N functions", ComputeRun → "N recent runs", MetricResult → "N results", Dashboards/Insights → "org analytics"
- Extra counts for subtitles need new queries in getServerSideProps (project count, factor count already available; computeRun count and metricResult count needed)

### Section cards
- 6 cards (AI Data Uploader excluded from section cards — not needed as a quick link)
- Cards: Inputs, Factors, Calculations, Test Runs, Lineage, Methodology
- 3-col grid, 2 rows (clean 3×2, no orphan row)
- Each card: icon + title + 1-line description + "View →" link
- Entire card is hoverable and clickable (antd `hoverable` prop, full card navigates on click)
- No status badge on section cards — health state is handled by the dedicated KPI row above

### System Health KPI row
- 4 cards: Inputs (data health issues), Change Requests (pending), ComputeRun Errors (last 7 days), Test Runs (last run status + stale alert)
- Reuse existing `KpiCardBlock` component (already handles alert/zero states with red/green coloring)
- **Stale test run logic**: compare `lastFactor.updatedAt` vs `lastTestRun.createdAt` — if any factor was updated after the last test run, show a stale warning even if the last run passed
- **ComputeRun errors**: `prisma.computeRun.count({ where: { status: 'failed', createdAt: { gte: 7 days ago } } })`
- **Change requests**: `prisma.changeRequest.count({ where: { status: 'pending' } })` (new query)
- Each KPI card links to its page: Inputs → `/admin/data-science/inputs`, Change Requests → `/admin/data-science/change-requests`, Test Runs → `/admin/data-science/test-runs`, ComputeRun errors → `/admin/data-science/runs`

### How It Works walkthrough
- Collapsible section, closed by default — consistent with existing Collapse behavior
- Label: "How Impact Governance Works"
- 6 steps using antd Steps (vertical, existing pattern):
  1. Validate Inputs → `/admin/data-science/inputs`
  2. Maintain Factors → `/admin/data-science/constants`
  3. Verify Calculations → `/admin/data-science/calculations`
  4. Run Regression Tests → `/admin/data-science/test-runs`
  5. Trace Results → `/admin/data-science/lineage`
  6. Maintain Methodology → `/admin/methodology`
- Each step title is a Link (same pattern as existing Steps in current page)

### Methodology Documents card
- Remove the existing standalone "Methodology Documents" card — replaced by the Methodology section card + How It Works step
- A proper changelog/release notes view is deferred

### Title/subtitle
- Title: "Data Governance Admin" (OVW-01)
- Subtitle: governance-framing description (e.g. "Govern the full impact calculation pipeline — validate inputs, maintain factors, verify calculations, and trace every result")
- AdminLayout `title` prop updated to match

### Claude's Discretion
- Exact subtitle wording (governance framing — keep consistent with Phase 1 tone)
- Node subtitle counts not available for Dashboards/Insights — use a static label ("org analytics")
- Exact icon choices for section cards
- Exact color tints for diagram node groups (use Ant Design token colors or subtle grays/greens/blues)
- Arrow styling between nodes (→ character or CSS border trick)
- Whether ComputeRun subtitle in diagram shows total count or "last 7 days" count

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `KpiCardBlock` component (inline in index.tsx): reusable, handles alert/zero state, "View →" button — use for System Health row
- `KpiCard`, `KpiNumber`, `KpiLabel`, `KpiTitle` styled-components: already defined, extend or reuse
- antd `Collapse` (ghost, white background, border): already used for "How to use" — reuse same pattern for "How It Works"
- antd `Steps` (vertical, current={-1}): already used inside the Collapse — reuse for 6-step walkthrough
- antd `Card` (hoverable, size variants): already imported

### Established Patterns
- styled-components for layout; no Tailwind
- antd `Row`/`Col` with `gutter={[16, 16]}` for responsive grids
- `getServerSideProps` fetches all data server-side (no client-side fetching on this page)
- `AdminLayout` with `title` prop and `selectedMenuItem='data-science'`
- `serializeJSON` wrapper on all `getServerSideProps` return props

### Integration Points
- `getServerSideProps`: add `prisma.changeRequest.count({ where: { status: 'pending' } })`, `prisma.computeRun.count({ where: { status: 'failed', createdAt: { gte: sevenDaysAgo } } })`, project count, total computeRun count, metricResult count to the existing `Promise.all`
- `getInputIssueCount()` already imported from `lib/admin/inputValidation` — keep for Inputs KPI
- `scanCalculatorFunctions()` already used — keep for Calculations section card subtitle
- `publishedSections` query (MethodologyDocument) can be removed (Methodology Documents card removed)

</code_context>

<specifics>
## Specific Ideas

- Health KPIs at the very top — operator's first glance should show system status
- Architecture diagram nodes with live counts make it informative, not just decorative
- 3×2 section card grid is clean — no orphan row needed since AI Data Uploader excluded

</specifics>

<deferred>
## Deferred Ideas

- Changelog / release notes view for methodology versioning — user wants a "version reference" but it's a separate feature from MethodologyDocument and MethodologySnapshot; capture as a future phase
- AI Data Uploader section card — user decided not to include it in the quick-link section cards for this phase

</deferred>

---

*Phase: 02-overview-redesign*
*Context gathered: 2026-03-04*
