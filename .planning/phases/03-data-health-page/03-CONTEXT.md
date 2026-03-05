# Phase 3: Data Health Page - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the `/admin/data-science/inputs` page as a data quality dashboard. Includes: `DataHealthIssue` Prisma model + migration, 3 API routes (scan, list, acknowledge), the page itself with auto-scan on load, issues table grouped by severity, and an acknowledge modal with optional note. No new nav changes needed — the link was wired in Phase 1.

</domain>

<decisions>
## Implementation Decisions

### Page load behavior
- **Auto-scan on load** — page triggers the scan immediately when it mounts (client-side fetch on mount, not blocking SSR)
- Page renders quickly with a loading/spinner state while scan runs
- Results appear after scan completes — no manual "Scan" button required on first load
- A **"Re-scan" button** should be available to re-run checks on demand
- Issues persist in `DataHealthIssue` DB table — re-scan upserts (creates new or updates existing by issueType + entityId)

### Issue display layout
- **antd Table** — same pattern as `pages/admin/data-science/change-requests/index.tsx`
- Issues grouped by severity: **errors section first**, then **warnings section**
- Each row shows: issue type, entity (table name), entity name/ID, short description, severity badge (antd `Tag`), status badge, and a "Validate" action button
- Only `open` and `acknowledged` issues shown by default (resolved issues hidden unless toggled)
- **Empty state**: "No issues detected — data looks healthy" with a green checkmark (shown when scan returns zero issues)
- **Loading state**: antd `Spin` while scan is running

### Acknowledge (Validate) flow
- Clicking **"Validate"** on an issue opens an antd `Modal`
- Modal shows: issue description, entity name, severity
- **Optional note** text field (textarea) — user can describe what they did or why it's acceptable
- **"Create Change Request" link** in the modal footer — navigates to `/admin/data-science/change-requests` (new tab or same tab). Full CR pre-fill from issue is deferred.
- Confirming sets: `status: 'acknowledged'`, `acknowledgedAt: now()`, `acknowledgedByUserId: user.id`, `note: noteText`
- After acknowledging: row updates in place (status badge changes to "Acknowledged"), modal closes

### Data quality checks (scan suite)
The scan runs these checks and upserts results into `DataHealthIssue`:

**Errors (severity: 'error'):**
- Projects missing `USState` — entity: `Project`, issueType: `missing_us_state`
- Projects with no single-use line items — entity: `Project`, issueType: `missing_single_use_items`
- Projects with no reusable line items — entity: `Project`, issueType: `missing_reusable_items`
- Single-use line items with `unitsPerCase = 0` — entity: `SingleUseLineItem`, issueType: `zero_unit_line_item`

**Warnings (severity: 'warning') — "unlikely data" checks:**
- `ReusableLineItem.annualRepurchasePercentage > 100` — return rate over 100%, entity: `ReusableLineItem`, issueType: `return_rate_over_100`
- `ReusableLineItem.caseCost < 0` — negative cost, entity: `ReusableLineItem`, issueType: `negative_case_cost`
- `ReusableLineItem.caseCost > 1_000_000_000` — unrealistically large value, entity: `ReusableLineItem`, issueType: `unrealistic_case_cost`
- `SingleUseLineItem.caseCost < 0` — negative cost, entity: `SingleUseLineItem`, issueType: `negative_case_cost`
- `ReusableLineItem.casesPurchased < 0` — negative quantity, entity: `ReusableLineItem`, issueType: `negative_quantity`

**Framework note:** The check suite is a plain array of check functions — easy to add more in future phases without touching the page or API.

### DataHealthIssue model
Exactly as specified in INP-05:
- `id`, `issueType`, `severity` ('error'|'warning'), `entity`, `entityId`, `details` (Json), `status` ('open'|'acknowledged'|'resolved'), `acknowledgedAt`, `acknowledgedByUserId`, `note`, `createdAt`, `updatedAt`
- Upsert key: `@@unique([issueType, entityId])` — re-scan updates existing records rather than creating duplicates

### API routes
- `POST /api/admin/data-health/scan` — runs all checks, upserts results, returns updated issue list
- `GET /api/admin/data-health/issues` — returns all non-resolved issues (status != 'resolved') with optional `?status=` filter
- `PATCH /api/admin/data-health/issues/[id]` — acknowledge or resolve; body: `{ status, note? }`
- All routes: `handlerWithUser().post/get/patch()` pattern with `checkIsUpstream` guard

### Migration
- New migration file: `prisma/migrations/20260305200000_data_health_issue/migration.sql`
- Run locally with `npx prisma migrate dev`, production with `npx prisma migrate deploy`

### Page copy / framing
- Page title: "Data Inputs"
- Subtitle: "Scan project data for quality issues, discrepancies, and unlikely values."
- Governance framing consistent with Phase 1 tone

### Claude's Discretion
- Exact column order in the table
- Whether errors and warnings use separate `<Table>` instances or a single table with section headers
- Exact wording of issue descriptions per issueType
- Whether "Re-scan" shows a timestamp of last scan
- Loading spinner placement (full-page or inline above table)

</decisions>

<specifics>
## Specific Ideas

- "How good is our data right now" — the page should answer that question at a glance
- Errors are things that will break calculations; warnings are unlikely/suspicious values that are worth reviewing
- The check suite should be an extensible framework — adding a new check shouldn't require touching the page or the API handler
- "Validate" = acknowledge you've seen it, it may still be a real issue — not the same as resolving it

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/admin/inputValidation.ts` (`getInputIssueCount`): has the 4 error checks already — extend into full `runDataHealthScan()` returning `DataHealthIssue[]` rather than a count
- `KpiCardBlock` on overview page: already queries `inputIssues` count — will update once DataHealthIssue table exists
- `handlerWithUser().patch()` + `checkIsUpstream`: established API auth pattern (see `pages/api/admin/change-requests/[id].ts`)
- antd `Table` with `ColumnsType`, `Tag`, `Modal`, `Badge`: all imported in change-requests page

### Established Patterns
- Admin pages: `AdminLayout` + `getServerSideProps` with `getUserFromContext` + `checkIsUpstream`
- API routes: `handlerWithUser()` from `lib/middleware/handler`, `checkIsUpstream` for upstream-only guard
- `serializeJSON` wrapper on all `getServerSideProps` return props
- Prisma upsert with `@@unique` composite key (established in Factor Library)
- Client-side data fetching: `useSWR` used elsewhere in the app for client-side data

### Integration Points
- `pages/admin/data-science/inputs/index.tsx` — new file (nav already points here from Phase 1)
- `pages/api/admin/data-health/scan.ts`, `issues.ts`, `issues/[id].ts` — new API files
- `lib/admin/inputValidation.ts` — extend or replace `getInputIssueCount` with richer scan function
- `prisma/schema.prisma` — add `DataHealthIssue` model
- Overview page health KPI card (Inputs) — currently uses `getInputIssueCount()`; after this phase it can query `DataHealthIssue` count directly

</code_context>

<deferred>
## Deferred Ideas

- Pre-fill a Change Request from a DataHealthIssue (requires ChangeRequest model extension or loose reference field) — future phase
- Resolve workflow with evidence note (INP-F02) — future milestone
- Scheduled/cron-based scanning (INP-F01) — future milestone
- Issue trend chart over time (INP-F03) — future milestone
- Filtering/sorting issues by type, entity, date — future enhancement

</deferred>

---

*Phase: 03-data-health-page*
*Context gathered: 2026-03-05*
