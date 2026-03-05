# Phase 3: Data Health Page - Research

**Researched:** 2026-03-05
**Domain:** Admin data quality dashboard — Prisma model + migration, scan engine, API routes, antd Table/Modal UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page load behavior**
- Auto-scan on load — page triggers the scan immediately when it mounts (client-side fetch on mount, not blocking SSR)
- Page renders quickly with a loading/spinner state while scan runs
- Results appear after scan completes — no manual "Scan" button required on first load
- A "Re-scan" button should be available to re-run checks on demand
- Issues persist in `DataHealthIssue` DB table — re-scan upserts (creates new or updates existing by issueType + entityId)

**Issue display layout**
- antd Table — same pattern as `pages/admin/data-science/change-requests/index.tsx`
- Issues grouped by severity: errors section first, then warnings section
- Each row shows: issue type, entity (table name), entity name/ID, short description, severity badge (antd `Tag`), status badge, and a "Validate" action button
- Only `open` and `acknowledged` issues shown by default (resolved issues hidden unless toggled)
- Empty state: "No issues detected — data looks healthy" with a green checkmark (shown when scan returns zero issues)
- Loading state: antd `Spin` while scan is running

**Acknowledge (Validate) flow**
- Clicking "Validate" on an issue opens an antd `Modal`
- Modal shows: issue description, entity name, severity
- Optional note text field (textarea) — user can describe what they did or why it's acceptable
- "Create Change Request" link in the modal footer — navigates to `/admin/data-science/change-requests` (new tab or same tab). Full CR pre-fill from issue is deferred.
- Confirming sets: `status: 'acknowledged'`, `acknowledgedAt: now()`, `acknowledgedByUserId: user.id`, `note: noteText`
- After acknowledging: row updates in place (status badge changes to "Acknowledged"), modal closes

**Data quality checks (scan suite)**
Errors (severity: 'error'):
- Projects missing `USState` — entity: `Project`, issueType: `missing_us_state`
- Projects with no single-use line items — entity: `Project`, issueType: `missing_single_use_items`
- Projects with no reusable line items — entity: `Project`, issueType: `missing_reusable_items`
- Single-use line items with `unitsPerCase = 0` — entity: `SingleUseLineItem`, issueType: `zero_unit_line_item`

Warnings (severity: 'warning') — "unlikely data" checks:
- `ReusableLineItem.annualRepurchasePercentage > 100` — issueType: `return_rate_over_100`
- `ReusableLineItem.caseCost < 0` — issueType: `negative_case_cost`
- `ReusableLineItem.caseCost > 1_000_000_000` — issueType: `unrealistic_case_cost`
- `SingleUseLineItem.caseCost < 0` — issueType: `negative_case_cost`
- `ReusableLineItem.casesPurchased < 0` — issueType: `negative_quantity`

Framework note: Check suite is a plain array of check functions — easy to add more without touching page or API.

**DataHealthIssue model** — Exactly per INP-05:
- `id`, `issueType`, `severity` ('error'|'warning'), `entity`, `entityId`, `details` (Json), `status` ('open'|'acknowledged'|'resolved'), `acknowledgedAt`, `acknowledgedByUserId`, `note`, `createdAt`, `updatedAt`
- Upsert key: `@@unique([issueType, entityId])`

**API routes**
- `POST /api/admin/data-health/scan` — runs all checks, upserts results, returns updated issue list
- `GET /api/admin/data-health/issues` — returns all non-resolved issues with optional `?status=` filter
- `PATCH /api/admin/data-health/issues/[id]` — acknowledge or resolve; body: `{ status, note? }`
- All routes: `handlerWithUser().post/get/patch()` pattern with `checkIsUpstream` guard

**Migration**
- New file: `prisma/migrations/20260305200000_data_health_issue/migration.sql`
- Local: `npx prisma migrate dev`, production: `npx prisma migrate deploy`

**Page copy**
- Title: "Data Inputs"
- Subtitle: "Scan project data for quality issues, discrepancies, and unlikely values."

### Claude's Discretion
- Exact column order in the table
- Whether errors and warnings use separate `<Table>` instances or a single table with section headers
- Exact wording of issue descriptions per issueType
- Whether "Re-scan" shows a timestamp of last scan
- Loading spinner placement (full-page or inline above table)

### Deferred Ideas (OUT OF SCOPE)
- Pre-fill a Change Request from a DataHealthIssue — future phase
- Resolve workflow with evidence note (INP-F02) — future milestone
- Scheduled/cron-based scanning (INP-F01) — future milestone
- Issue trend chart over time (INP-F03) — future milestone
- Filtering/sorting issues by type, entity, date — future enhancement
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INP-01 | New `/admin/data-science/inputs` page created as data health dashboard | AdminLayout + getServerSideProps pattern fully mapped; nav key already wired from Phase 1 |
| INP-02 | Page runs on-demand issue detection, surfaces results grouped by severity | Scan engine pattern defined (array of check functions); client-side fetch on mount |
| INP-03 | Each issue displays: type, entity name, record ID, description, severity badge | antd Table `ColumnsType` pattern from change-requests page; antd `Tag` for badges |
| INP-04 | Checks cover: return rate >100%, zero-unit items, missing USState, missing line items | Existing `getInputIssueCount()` in `lib/admin/inputValidation.ts` has 4 error checks to extend; 5 warning checks added |
| INP-05 | `DataHealthIssue` Prisma model with full field set + upsert key | Migration SQL pattern, Prisma schema additions, upsert via `@@unique([issueType, entityId])` |
| INP-06 | "Validate" action acknowledges issue — sets timestamps, prompts for optional note, transitions status | PATCH API + Modal pattern from change-requests review flow |
| INP-07 | 3 API routes: POST scan, GET issues, PATCH acknowledge | `handlerWithUser()` + `checkIsUpstream` pattern fully established |
</phase_requirements>

---

## Summary

Phase 3 is a self-contained admin feature: a new Prisma model, a migration, three API routes, a scan engine library function, and one page. All scaffolding patterns are already established in the project — this phase is primarily assembly and extension of existing patterns rather than net-new technical territory.

The most important insight is that `lib/admin/inputValidation.ts` already implements the four error checks as a count query. The scan engine needs to be a richer version of this — returning structured `DataHealthIssue` records rather than a count, and covering nine total checks (four errors + five warnings). The check framework should be designed as an extensible array so future checks can be added without touching the API or page.

The page UI follows the established antd Table + Modal pattern from `pages/admin/data-science/change-requests/index.tsx` almost exactly: columns with Tag badges, an action button per row, a modal for the action flow, and in-place state updates after confirmation. The only novel UI element is the auto-scan on mount behavior with a Spin loading state.

**Primary recommendation:** Implement in three waves — (1) Prisma model + migration, (2) scan engine library + three API routes, (3) page component with auto-scan, issue table, and validate modal. Keep the scan engine as a pure library function (`lib/admin/dataHealthScan.ts`) that returns typed `DataHealthIssueInput[]` for easy testing and future extension.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.x | DataHealthIssue model, upsert, queries | Project ORM — all DB access goes through Prisma |
| antd | 5.x | Table, Tag, Modal, Spin, Button, Typography | Project UI library — all admin pages use antd |
| next-connect | (via handlerWithUser) | API route chaining with middleware | Established pattern for all admin API routes |
| styled-components | (existing) | Any custom styled wrappers | Project styling approach for admin pages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lib/middleware/handler` | local | `handlerWithUser()` for API routes | Every admin API route |
| `lib/middleware/requireUpstream` | local | `checkIsUpstream` guard | Every admin API route that is upstream-only |
| `lib/objects` | local | `serializeJSON` for getServerSideProps | Every admin page's getServerSideProps |
| `lib/prisma` | local | Prisma client singleton | Every file that touches DB |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side fetch on mount for scan | SSR in getServerSideProps | SSR blocks render; scan can take seconds for large datasets — client-side is correct here |
| Single table with section dividers | Two separate `<Table>` components | Both valid; single table is simpler state; two tables give cleaner visual grouping but duplicate column config |
| Inline `useState` for issue list | SWR | SWR adds cache invalidation benefits but adds complexity for a triggered-action page; useState is sufficient |

**Installation:** No new packages required — all dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
lib/admin/
└── dataHealthScan.ts        # New: scan engine (replaces/extends inputValidation.ts)

pages/admin/data-science/
└── inputs/
    └── index.tsx            # New: Data Health dashboard page

pages/api/admin/data-health/
├── scan.ts                  # New: POST — run checks, upsert, return issues
├── issues.ts                # New: GET — list non-resolved issues
└── issues/
    └── [id].ts              # New: PATCH — acknowledge or resolve

prisma/migrations/
└── 20260305200000_data_health_issue/
    └── migration.sql        # New: DataHealthIssue table
```

### Pattern 1: Prisma Model + Upsert Key
**What:** `DataHealthIssue` model with `@@unique([issueType, entityId])` composite key enabling upsert without duplicates.
**When to use:** Re-scan must update existing issues rather than create duplicates.

```typescript
// prisma/schema.prisma addition
model DataHealthIssue {
  id                   String    @id @default(uuid()) @db.Uuid
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  issueType            String
  severity             String    // 'error' | 'warning'
  entity               String    // 'Project' | 'SingleUseLineItem' | 'ReusableLineItem'
  entityId             String    @db.Uuid
  details              Json?
  status               String    @default("open")  // 'open' | 'acknowledged' | 'resolved'
  acknowledgedAt       DateTime?
  acknowledgedByUserId String?
  note                 String?

  @@unique([issueType, entityId])
}
```

### Pattern 2: Extensible Check Suite (lib/admin/dataHealthScan.ts)
**What:** Array of typed check functions, each returning zero or more issue records. The scan runner iterates the array and upserts all returned records.
**When to use:** Every time a new check is added — just push to the array, no other files change.

```typescript
// Source: project pattern — modeled on lib/admin/inputValidation.ts, extended
type IssueInput = {
  issueType: string;
  severity: 'error' | 'warning';
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
};

type CheckFn = () => Promise<IssueInput[]>;

// checks array — add new checks here only
const CHECKS: CheckFn[] = [
  checkMissingUSState,
  checkMissingSingleUseItems,
  checkMissingReusableItems,
  checkZeroUnitLineItems,
  checkReturnRateOver100,
  checkNegativeCaseCost,
  checkUnrealisticCaseCost,
  checkNegativeSingleUseCaseCost,
  checkNegativeQuantity,
];

export async function runDataHealthScan(): Promise<IssueInput[]> {
  const results = await Promise.all(CHECKS.map(fn => fn()));
  return results.flat();
}
```

### Pattern 3: Scan API Route (POST /api/admin/data-health/scan)
**What:** Runs `runDataHealthScan()`, upserts each result into `DataHealthIssue`, returns all current non-resolved issues.
**When to use:** Called on page mount and on "Re-scan" click.

```typescript
// Source: established handlerWithUser pattern
export default handlerWithUser()
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const issues = await runDataHealthScan();

    // Upsert each issue — composite unique key (issueType, entityId)
    await Promise.all(
      issues.map(issue =>
        prisma.dataHealthIssue.upsert({
          where: { issueType_entityId: { issueType: issue.issueType, entityId: issue.entityId } },
          create: { ...issue, status: 'open' },
          update: { severity: issue.severity, details: issue.details ?? undefined }
          // Note: do NOT reset status on upsert — acknowledged issues stay acknowledged
        })
      )
    );

    // Return all non-resolved
    const all = await prisma.dataHealthIssue.findMany({
      where: { status: { not: 'resolved' } },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }]
    });
    res.json(all);
  });
```

### Pattern 4: Page Component (pages/admin/data-science/inputs/index.tsx)
**What:** AdminLayout page with auto-scan on mount via `useEffect + fetch`, antd `Spin` loading state, issues split by severity into error/warning sections, antd `Table` per section, validate `Modal`.
**When to use:** The main page component.

```typescript
// Source: established AdminLayout + getServerSideProps pattern
// getServerSideProps: auth guard only (no data fetch — scan is client-side)
export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };
  return { props: serializeJSON({ user }) };
};

// Page component — auto-scan on mount
export default function DataInputsPage({ user }: Props) {
  const [issues, setIssues] = useState<DataHealthIssue[]>([]);
  const [scanning, setScanning] = useState(false);
  const [validateModal, setValidateModal] = useState<{ open: boolean; issue: DataHealthIssue | null }>({ open: false, issue: null });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const runScan = useCallback(async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/admin/data-health/scan', { method: 'POST' });
      const data = await res.json();
      setIssues(data);
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => { runScan(); }, [runScan]);

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  // ... render two Table instances, one Modal
}
```

### Pattern 5: Acknowledge API (PATCH /api/admin/data-health/issues/[id])
**What:** Updates `status`, `acknowledgedAt`, `acknowledgedByUserId`, `note` on a `DataHealthIssue`.
**When to use:** Called when user confirms the Validate modal.

```typescript
// Source: mirrors change-requests/[id].ts PATCH pattern
export default handlerWithUser().patch(async (req, res) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query as { id: string };
  const { status, note } = req.body;
  if (!status || !['acknowledged', 'resolved'].includes(status))
    return res.status(400).json({ error: 'status must be acknowledged or resolved' });

  const updated = await prisma.dataHealthIssue.update({
    where: { id },
    data: {
      status,
      note: note || null,
      ...(status === 'acknowledged' && {
        acknowledgedAt: new Date(),
        acknowledgedByUserId: req.user.id
      })
    }
  });
  res.json(updated);
});
```

### Anti-Patterns to Avoid
- **Resetting status to 'open' on re-scan upsert:** Re-scan should update `severity` and `details` but NOT reset `status`. An acknowledged issue that still exists after re-scan should remain `acknowledged`.
- **Blocking SSR with scan:** Scan queries all projects and line items — runs client-side after page load, not in `getServerSideProps`.
- **Single monolithic scan function:** All nine checks should be individual functions in the CHECKS array — easy to disable or extend one check without touching others.
- **Storing `entityId` as String (non-UUID):** All entity IDs in this project are UUIDs with `@db.Uuid` — the `entityId` field should be `String @db.Uuid` even though it references multiple entity types.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API auth middleware | Custom auth check per route | `handlerWithUser()` + `checkIsUpstream` | Established pattern; consistent error handling |
| JSON serialization for SSR props | Manual JSON.stringify/parse | `serializeJSON` from `lib/objects` | Handles Date objects that Next.js can't serialize |
| DB upsert logic | Manual findUnique + create/update | `prisma.dataHealthIssue.upsert` with `@@unique` key | Atomic, race-condition safe |
| Prisma client instance | `new PrismaClient()` | `import prisma from 'lib/prisma'` | Singleton with connection pooling |

---

## Common Pitfalls

### Pitfall 1: Upsert Status Overwrite
**What goes wrong:** Re-scan upserts with `update: { status: 'open' }` — wipes `acknowledged` status that a user just set.
**Why it happens:** Copy-paste from `create` block into `update` block.
**How to avoid:** The `update` block in the upsert should only touch `severity` and `details` — never `status`, `acknowledgedAt`, `acknowledgedByUserId`, or `note`.
**Warning signs:** Clicking "Validate" then "Re-scan" resets the badge back to "Open".

### Pitfall 2: entityId UUID Type Mismatch
**What goes wrong:** Prisma migration fails or queries fail because `entityId` is `String` without `@db.Uuid` — PostgreSQL UUID columns won't accept plain `text`.
**Why it happens:** `entityId` references multiple model types so no foreign key exists, but the values are still UUIDs.
**How to avoid:** Declare `entityId String @db.Uuid` in the Prisma schema and `UUID NOT NULL` in the migration SQL.
**Warning signs:** Prisma type errors when querying, or migration SQL errors at the DB level.

### Pitfall 3: Missing `issueType_entityId` Prisma Unique Identifier
**What goes wrong:** Prisma upsert fails because the `where` clause for a composite unique key uses the wrong field name format.
**Why it happens:** For `@@unique([issueType, entityId])`, Prisma generates the compound name `issueType_entityId` — not `{ issueType, entityId }` as an object.
**How to avoid:** Use `where: { issueType_entityId: { issueType: '...', entityId: '...' } }` in the upsert.
**Warning signs:** TypeScript error on the `where` clause of the upsert call.

### Pitfall 4: `negative_case_cost` issueType Collision
**What goes wrong:** Both `ReusableLineItem` and `SingleUseLineItem` use the issueType `negative_case_cost` — if the entityId overlaps (impossible since they're separate tables), the upsert key is ambiguous.
**Why it happens:** Same string issueType across different entity types with a shared `@@unique([issueType, entityId])` key.
**How to avoid:** Since entity IDs come from different tables and UUIDs won't collide across tables, this is safe in practice. However, consider prefixing: `reusable_negative_case_cost` vs `single_use_negative_case_cost` for clarity and guaranteed uniqueness. The CONTEXT.md uses `negative_case_cost` for both — this is a Claude's Discretion area on exact issueType strings.
**Warning signs:** Upsert constraint violation if the same UUID somehow appears in both tables (extremely unlikely).

### Pitfall 5: Overview Page KPI Card Still Using `getInputIssueCount()`
**What goes wrong:** After Phase 3, the overview page's "Data Inputs" KPI card (`pages/admin/data-science/index.tsx`) still calls `getInputIssueCount()` which re-runs its own Prisma queries instead of reading from `DataHealthIssue`.
**Why it happens:** The overview page was built before `DataHealthIssue` existed — its data source was not updated.
**How to avoid:** After the `DataHealthIssue` table exists, update `getServerSideProps` in `index.tsx` to query `prisma.dataHealthIssue.count({ where: { status: 'open' } })` instead. This is a small follow-up task inside Phase 3.
**Warning signs:** Overview KPI count differs from what the Inputs page shows.

### Pitfall 6: Large Dataset Scan Performance
**What goes wrong:** The scan runs 9 parallel Prisma queries across potentially 291+ projects and thousands of line items — if any query is slow, the scan endpoint times out.
**Why it happens:** `Promise.all` across all checks in parallel; each check may do a `findMany` returning many records.
**How to avoid:** Use `select: { id: true, ... }` (minimal fields) in all scan queries — match the pattern in `getInputIssueCount()` which uses `select: { id: true }`. Don't `include` relations in the scan phase.
**Warning signs:** Scan endpoint takes >5 seconds; Vercel function timeout on production.

---

## Code Examples

Verified patterns from existing codebase:

### Migration SQL (established format from project)
```sql
-- Source: prisma/migrations/20260303000000_project_milestones/migration.sql
CREATE TABLE IF NOT EXISTS "DataHealthIssue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "issueType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedByUserId" TEXT,
    "note" TEXT,
    CONSTRAINT "DataHealthIssue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DataHealthIssue_issueType_entityId_key"
    ON "DataHealthIssue"("issueType", "entityId");
```

### antd Table + Tag + Spin (established admin page pattern)
```typescript
// Source: pages/admin/data-science/change-requests/index.tsx
import { Table, Tag, Modal, Spin, Button, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const SeverityTag = ({ severity }: { severity: string }) => {
  const color = severity === 'error' ? 'red' : 'orange';
  return <Tag color={color}>{severity}</Tag>;
};

const StatusTag = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    open: 'processing',
    acknowledged: 'success',
    resolved: 'default'
  };
  return <Tag color={colors[status] || 'default'}>{status}</Tag>;
};

const columns: ColumnsType<DataHealthIssue> = [
  { title: 'Type', dataIndex: 'issueType', render: t => <Text code>{t}</Text> },
  { title: 'Entity', dataIndex: 'entity' },
  { title: 'Entity ID', dataIndex: 'entityId', render: id => <Text type='secondary' style={{ fontSize: 12 }}>{id}</Text> },
  { title: 'Description', key: 'description', render: (_, r) => ISSUE_DESCRIPTIONS[r.issueType] ?? r.issueType },
  { title: 'Severity', dataIndex: 'severity', render: s => <SeverityTag severity={s} /> },
  { title: 'Status', dataIndex: 'status', render: s => <StatusTag status={s} /> },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, r) =>
      r.status === 'open' ? (
        <Button size='small' type='primary' onClick={() => openValidateModal(r)}>Validate</Button>
      ) : null
  }
];
```

### Prisma Upsert with Composite Unique Key
```typescript
// Source: prisma/schema.prisma @@unique([name, categoryId]) pattern on Factor model
await prisma.dataHealthIssue.upsert({
  where: {
    issueType_entityId: { issueType: issue.issueType, entityId: issue.entityId }
  },
  create: {
    issueType: issue.issueType,
    severity: issue.severity,
    entity: issue.entity,
    entityId: issue.entityId,
    details: issue.details ?? undefined,
    status: 'open'
  },
  update: {
    severity: issue.severity,
    details: issue.details ?? undefined
    // Do NOT include status — preserve acknowledged/resolved state
  }
});
```

### Admin Page Auth Guard (getServerSideProps)
```typescript
// Source: all admin pages in data-science/
export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };
  return { props: serializeJSON({ user }) };
};
```

---

## Integration Points

### Files to Create
| File | Purpose |
|------|---------|
| `prisma/migrations/20260305200000_data_health_issue/migration.sql` | DataHealthIssue table + unique index |
| `lib/admin/dataHealthScan.ts` | Scan engine: CHECKS array + `runDataHealthScan()` |
| `pages/api/admin/data-health/scan.ts` | POST — run scan, upsert, return issues |
| `pages/api/admin/data-health/issues.ts` | GET — list non-resolved issues |
| `pages/api/admin/data-health/issues/[id].ts` | PATCH — acknowledge or resolve |
| `pages/admin/data-science/inputs/index.tsx` | Data Health dashboard page |

### Files to Modify
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `DataHealthIssue` model |
| `pages/admin/data-science/index.tsx` | Update `getServerSideProps` to query `DataHealthIssue.count` for the "Data Inputs" KPI card instead of `getInputIssueCount()` |
| `lib/admin/inputValidation.ts` | Either deprecate `getInputIssueCount()` or update it to query `DataHealthIssue` (after model exists); the old implementation can remain as a fallback |

### Navigation
- `pages/admin/data-science/inputs/index.tsx` maps to `selectedMenuItem='data-science/inputs'`
- Nav key `data-science/inputs` was already added to `DATA_SCIENCE_KEYS` in Phase 1

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `getInputIssueCount()` — count-only scan, no persistence | `runDataHealthScan()` — full issue records with type/severity/status, persisted in DB | Enables per-issue acknowledgment, audit trail, and KPI count from DB |
| No dedicated inputs page | `/admin/data-science/inputs` dashboard | Admin can see exactly which records are problematic, not just a count |

---

## Open Questions

1. **`negative_case_cost` issueType naming across entities**
   - What we know: Both `ReusableLineItem` and `SingleUseLineItem` have a `negative_case_cost` check in CONTEXT.md
   - What's unclear: Whether to use the same string `negative_case_cost` for both (relying on UUID non-collision) or prefix with entity type
   - Recommendation: Use `negative_case_cost` as specified in CONTEXT.md; UUIDs across tables won't collide. If desired, the planner can choose to prefix (Claude's Discretion on exact issueType strings).

2. **`acknowledgedByUserId` field type**
   - What we know: Existing `User.id` is `String` (Supabase auth UID, not UUID — see schema: `id String @id` without `@db.Uuid`)
   - What's unclear: Should `acknowledgedByUserId` be `String` or `String @db.Uuid`?
   - Recommendation: Use plain `String` (no `@db.Uuid`) to match the `User.id` type. In the migration SQL, use `TEXT` not `UUID`.

3. **Overview page KPI update timing**
   - What we know: Phase 3 should update the overview KPI card to use `DataHealthIssue` count
   - What's unclear: Whether this is a separate task or folded into the API/page task
   - Recommendation: Include as a sub-task in the API or page plan — it's a small `getServerSideProps` change in `index.tsx`.

---

## Sources

### Primary (HIGH confidence)
- Project codebase — `lib/admin/inputValidation.ts` (existing check queries)
- Project codebase — `pages/admin/data-science/change-requests/index.tsx` (Table/Modal/Tag UI pattern)
- Project codebase — `pages/api/admin/change-requests/[id].ts` (PATCH + status update pattern)
- Project codebase — `pages/api/admin/change-requests/index.ts` (GET with filter + POST pattern)
- Project codebase — `prisma/schema.prisma` (Factor `@@unique([name, categoryId])` — upsert key precedent)
- Project codebase — `prisma/migrations/20260303000000_project_milestones/migration.sql` (migration SQL format)
- Project codebase — `lib/middleware/handler.ts` (`handlerWithUser` definition)
- Project codebase — `pages/admin/data-science/index.tsx` (AdminLayout, KpiCardBlock, getServerSideProps auth pattern)

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions — all locked choices verified against existing codebase patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all patterns verified in existing code
- Architecture: HIGH — scan engine pattern and API routes directly modeled on existing files
- Pitfalls: HIGH — derived from reading actual code (upsert, UUID types, status preservation)
- Migration SQL format: HIGH — copied from existing migration files

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable tech stack; no external API dependencies)
