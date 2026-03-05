# Phase 2: Overview Redesign - Research

**Researched:** 2026-03-04
**Domain:** Next.js admin page redesign — Ant Design layout, styled-components, Prisma queries
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Page layout top to bottom: Title/subtitle → System Health KPI row → System Architecture Diagram → Section Cards → How It Works (collapsible)
- Architecture diagram: CSS flex row with arrows — pure HTML/CSS, no new dependencies, styled-components
- Diagram is 2-row layout: row 1 = Projects/RSP Data → Factor Library → Calculator Engine; row 2 = ComputeRun → MetricResult → Dashboards/Insights
- Each node is responsive (wraps to vertical on narrow screens)
- Clickable nodes: Factor Library → `/admin/data-science/constants`, Calculator Engine → `/admin/data-science/calculations`, ComputeRun → `/admin/data-science/runs`, MetricResult → `/admin/data-science/runs`, Dashboards → `/admin` or org analytics. Projects/RSP Data and Dashboards/Insights do not link
- Nodes are color-grouped: input tint, processing tint, output tint
- Each node shows a short subtitle (live count or descriptor)
- Section cards: 6 cards (AI Data Uploader excluded) — Inputs, Factors, Calculations, Test Runs, Lineage, Methodology
- Cards in a 3-col grid, 2 rows (3×2 clean grid)
- Each card: icon + title + 1-line description + "View →" link
- Entire card is hoverable and clickable (antd `hoverable` prop)
- No status badge on section cards
- System Health KPI row: 4 cards — Inputs (data health issues), Change Requests (pending), ComputeRun Errors (last 7 days), Test Runs (last run status + stale alert)
- Reuse existing `KpiCardBlock` component
- Stale test run logic: compare `lastFactor.updatedAt` vs `lastTestRun.createdAt`
- ComputeRun errors query: `prisma.computeRun.count({ where: { status: 'failed', createdAt: { gte: 7 days ago } } })`
- Change requests query: `prisma.changeRequest.count({ where: { status: 'pending' } })`
- KPI card links: Inputs → `/admin/data-science/inputs`, Change Requests → `/admin/data-science/change-requests`, Test Runs → `/admin/data-science/test-runs`, ComputeRun errors → `/admin/data-science/runs`
- How It Works: collapsible, closed by default, label "How Impact Governance Works"
- 6 steps using antd Steps (vertical, current={-1})
- Step titles are Links (same pattern as existing Steps)
- Remove existing "Methodology Documents" card
- Title: "Data Governance Admin"
- Subtitle: governance-framing description
- AdminLayout `title` prop updated to match

### Claude's Discretion
- Exact subtitle wording (governance framing — keep consistent with Phase 1 tone)
- Node subtitle counts not available for Dashboards/Insights — use a static label ("org analytics")
- Exact icon choices for section cards
- Exact color tints for diagram node groups (use Ant Design token colors or subtle grays/greens/blues)
- Arrow styling between nodes (→ character or CSS border trick)
- Whether ComputeRun subtitle in diagram shows total count or "last 7 days" count

### Deferred Ideas (OUT OF SCOPE)
- Changelog / release notes view for methodology versioning
- AI Data Uploader section card
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OVW-01 | Overview page title and subtitle updated to reflect "Data Governance" framing | Existing `AdminLayout title` prop and Typography `Title`/`Paragraph` components handle this — single string change in render + getServerSideProps not needed |
| OVW-02 | System Architecture card showing full pipeline with clickable nodes, color groups, live counts | Prisma queries for project count, factor count, computeRun count, metricResult count needed in `getServerSideProps`; CSS flex with styled-components confirmed feasible |
| OVW-03 | Section cards (6) for Inputs, Factors, Calculations, Test Runs, Lineage, Methodology with description, tooltip, "View →" link | antd `Card` with `hoverable` prop already imported; Row/Col 3-col grid with `gutter={[16,16]}` is the established pattern |
| OVW-04 | Collapsible "How Impact Governance Works" 6-step walkthrough | antd `Collapse` + `Steps` (vertical, current={-1}) both already imported and used in current page — direct reuse |
| OVW-05 | System Health Dashboard row of 4 KPI alert cards | `KpiCardBlock` component exists inline; 2 new Prisma queries needed (changeRequest pending count, computeRun failed last 7 days); stale flag logic is new |
</phase_requirements>

---

## Summary

Phase 2 is a single-file redesign of `pages/admin/data-science/index.tsx`. The page already contains most of the building blocks: `KpiCardBlock`, `KpiCard`/`KpiNumber`/`KpiLabel`/`KpiTitle` styled-components, antd `Collapse` + `Steps`, antd `Card` with `hoverable`, and `Row`/`Col` grid patterns. The main work is restructuring the layout order, adding two new Prisma queries, building the CSS flex architecture diagram, replacing the quick-link cards with proper 3×2 section cards, and updating the How-It-Works section to the 6-step governance walkthrough.

The architecture diagram is the only genuinely new UI pattern: a CSS flexbox two-row pipeline visualization with colored node boxes, arrow connectors, and live counts. No new npm packages are needed — styled-components handles the diagram styling, and Next.js `Link` handles node clickability.

`getServerSideProps` needs four new values added to its `Promise.all`: total project count, total factor count, pending change request count, and failed ComputeRun count in the last 7 days. The metricResult count can also be fetched cheaply. The existing `publishedSections` query (MethodologyDocument) is removed.

**Primary recommendation:** Rewrite `pages/admin/data-science/index.tsx` in a single task — restructure layout, add diagram, replace cards, extend getServerSideProps queries, update KPI row.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| styled-components | (project standard) | Diagram node boxes, arrows, responsive layout | All existing styles use it; no Tailwind in project |
| antd Card (hoverable) | 5.x | Section cards with click behavior | Already imported, `hoverable` prop gives hover state + cursor |
| antd Collapse (ghost) | 5.x | Collapsible How It Works section | Already used in current page with same ghost + border style |
| antd Steps (vertical) | 5.x | 6-step walkthrough inside Collapse | Already used in current page with `current={-1}` pattern |
| antd Row/Col | 5.x | 3×2 grid for section cards, 4-col KPI row | Established gutter pattern `[16, 16]` throughout |
| Next.js Link | 15 | Clickable diagram nodes, section card nav, step titles | All internal navigation uses Next.js Link |
| Prisma | 6 | New count queries for KPI/diagram | Already used in getServerSideProps |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @ant-design/icons | 5.x | Section card icons, KPI card icons | Already imported; choose from existing set |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS flex diagram | react-flow or mermaid | Overkill — diagram is static 2-row linear pipeline; no new deps needed |
| Inline KpiCardBlock | Extracted component file | Component is only used on this page; keep inline per existing pattern |

**Installation:** No new packages required.

## Architecture Patterns

### Recommended Page Structure (top to bottom)

```
<AdminLayout title="Data Governance Admin" selectedMenuItem="data-science">
  <div style={{ padding: '24px' }}>
    1. Title + Subtitle          (Typography.Title + Paragraph)
    2. System Health KPI row     (Row/Col × 4, KpiCardBlock reused)
    3. System Architecture card  (antd Card wrapping styled flex diagram)
    4. Section cards             (Row/Col 3×2 grid, antd Card hoverable)
    5. How It Works              (antd Collapse ghost + Steps vertical)
  </div>
</AdminLayout>
```

### Pattern 1: KpiCardBlock with Stale Alert (OVW-05)

**What:** The Test Runs KPI card needs a secondary stale-warning state — show alert even when `testRunFailures === 0` if factors were updated after the last test run.
**When to use:** Whenever a KPI card has a secondary condition beyond the zero-check.

```typescript
// Stale detection logic in getServerSideProps
const isStale =
  lastFactor?.updatedAt != null &&
  lastTestRun?.createdAt != null &&
  new Date(lastFactor.updatedAt) > new Date(lastTestRun.createdAt);

// Pass isStale as a separate prop field
// In render: pass $alert={testRunFailures > 0 || isStale} to KpiCard
// Show stale label text when isStale && testRunFailures === 0
```

The existing `KpiCardBlock` signature accepts `value`, `subtext`, `href`, `icon`, `title`. To handle the stale state, either:
- Add an optional `alertOverride?: boolean` prop to `KpiCardBlock`, OR
- Render the Test Runs KPI card inline (not via KpiCardBlock) with full control

Recommended: add `alertOverride?: boolean` prop — minimal change, keeps the component reusable.

### Pattern 2: CSS Flex Architecture Diagram (OVW-02)

**What:** Two-row pipeline visualization using styled-components flex rows with arrow connectors between nodes.

```typescript
// Styled components for the diagram
const DiagramRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
  justify-content: center;
`;

const DiagramNode = styled.div<{ $group: 'input' | 'processing' | 'output' }>`
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  min-width: 110px;
  background: ${p =>
    p.$group === 'input'
      ? '#f0f9ff'   // light blue tint
      : p.$group === 'processing'
      ? '#f6ffed'   // light green tint
      : '#fff7e6'}; // light amber tint
  border: 1px solid ${p =>
    p.$group === 'input'
      ? '#bae0ff'
      : p.$group === 'processing'
      ? '#b7eb8f'
      : '#ffd591'};
`;

const DiagramArrow = styled.div`
  padding: 0 8px;
  color: rgba(0,0,0,0.25);
  font-size: 18px;
  flex-shrink: 0;
`;

const DiagramNodeTitle = styled.div`
  font-weight: 600;
  font-size: 13px;
`;

const DiagramNodeSub = styled.div`
  font-size: 11px;
  color: rgba(0,0,0,0.45);
  margin-top: 2px;
`;

const DiagramWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
`;
```

Row 1: `[Projects/RSP Data] → [Factor Library] → [Calculator Engine]`
Row 2: `[ComputeRun] → [MetricResult] → [Dashboards/Insights]`

Clickable nodes wrap their content in `<Link href="...">` with `style={{ textDecoration: 'none', color: 'inherit' }}`. Non-clickable nodes render plain.

### Pattern 3: Section Cards 3×2 Grid (OVW-03)

```typescript
// Section card data array — drives the grid render
const SECTION_CARDS = [
  {
    key: 'inputs',
    icon: <UploadOutlined />,
    title: 'Inputs',
    description: 'Validate incoming project data for completeness and accuracy.',
    href: '/admin/data-science/inputs'
  },
  {
    key: 'factors',
    icon: <CalculatorOutlined />,
    title: 'Factors',
    description: 'Manage environmental constants: EPA WARM factors, utility rates, material weights.',
    href: '/admin/data-science/constants'
  },
  // ... 4 more
];

// Render
<Row gutter={[16, 16]}>
  {SECTION_CARDS.map(card => (
    <Col xs={24} sm={12} lg={8} key={card.key}>
      <Link href={card.href} style={{ display: 'block', height: '100%' }}>
        <Card hoverable style={{ height: '100%' }}>
          {card.icon} {card.title}
          <Paragraph>{card.description}</Paragraph>
        </Card>
      </Link>
    </Col>
  ))}
</Row>
```

`xs={24} sm={12} lg={8}` gives: mobile=1 col, tablet=2 col, desktop=3 col. With 6 cards this produces a clean 2-row grid at desktop.

### Pattern 4: getServerSideProps Extensions (OVW-02, OVW-05)

```typescript
// Add to existing Promise.all
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const [
  inputIssues,
  // ... existing queries ...
  pendingChangeRequests,      // NEW — OVW-05
  recentComputeRunErrors,     // NEW — OVW-05
  projectCount,               // NEW — OVW-02 diagram node
  factorCount,                // NEW — OVW-02 diagram node
  totalComputeRuns,           // NEW — OVW-02 diagram node
  metricResultCount           // NEW — OVW-02 diagram node
] = await Promise.all([
  getInputIssueCount(),
  // ... existing ...
  prisma.changeRequest.count({ where: { status: 'pending' } }),
  prisma.computeRun.count({ where: { status: 'failed', createdAt: { gte: sevenDaysAgo } } }),
  prisma.project.count(),
  prisma.factor.count(),
  prisma.computeRun.count(),
  prisma.metricResult.count()
]);
```

Remove `publishedSections` query (MethodologyDocument) — the Methodology Documents card is being removed.

### Anti-Patterns to Avoid

- **Tooltip on every section card:** OVW-03 mentions "tooltip" in the requirement, but CONTEXT.md section card decisions do NOT include tooltips — section cards have icon + title + description + "View →". Do not add antd `Tooltip` wrappers unless the planner explicitly adds them back.
- **Using `router.push` for card navigation:** The pattern is `Link` wrapping the whole card — not onClick handlers. Avoids right-click/open-in-tab issues.
- **Blocking `getServerSideProps` with slow queries:** All new Prisma queries are `count()` calls — fast. Run them in the existing `Promise.all`, not sequentially.
- **Removing `functionsWithoutCoverage` stat:** It's still needed for the Calculations section card subtitle ("N functions tracked"). Keep the `scanCalculatorFunctions()` call.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS arrow connectors | Custom SVG arrowheads | `→` Unicode character in a `DiagramArrow` div | Simple pipeline has no branching; SVG overkill adds maintenance burden |
| Hover state on section cards | onMouseEnter/Leave state | antd Card `hoverable` prop | Built-in — handles cursor, shadow, transition |
| Color tokens | Hardcoded hex values | Ant Design semantic colors (`#f0f9ff`, `#f6ffed`, `#fff7e6` from AntD palette) | Consistent with design system |
| Stale detection on client | useEffect + fetch | Server-side in `getServerSideProps` | All data on this page is server-side; keeps page static |

**Key insight:** The entire redesign is a layout restructure + new Prisma count queries. All UI primitives already exist in the codebase.

## Common Pitfalls

### Pitfall 1: OVW-03 tooltip requirement vs CONTEXT.md
**What goes wrong:** REQUIREMENTS.md says "each with a short description, tooltip, and 'View →' link" for section cards, but CONTEXT.md (locked decisions) does NOT include tooltips on section cards — only icon + title + description + "View →".
**Why it happens:** Requirements were written before the discussion phase refined the design.
**How to avoid:** CONTEXT.md decisions are locked. Section cards do NOT get antd `Tooltip` wrappers. The description text on each card IS the tooltip-equivalent content.
**Warning signs:** If a task says "add Tooltip to section card" — that's wrong.

### Pitfall 2: KpiCardBlock stale-alert coupling
**What goes wrong:** The existing `KpiCardBlock` uses `value === 0` as the sole alert-off condition. The Test Runs card needs to show alert when value is 0 but `isStale` is true.
**Why it happens:** `KpiCardBlock` was designed for simple count-based alerting.
**How to avoid:** Extend `KpiCardBlock` with an optional `alertOverride?: boolean` prop. Pass `alertOverride={isStale}` for the Test Runs card.
**Warning signs:** Test Runs KPI shows green when factors have been updated since the last run.

### Pitfall 3: `publishedSections` prop not removed
**What goes wrong:** The existing `Props` type and `getServerSideProps` include `publishedSections: MethodologySubsection[]`. If the Methodology Documents card is removed from render but the type/query is kept, the code compiles but is dead weight.
**Why it happens:** Easy to forget to clean up unused query + type + prop.
**How to avoid:** Remove `MethodologySubsection` type, remove `publishedSections` from `Props`, remove `prisma.methodologyDocument.findMany(...)` from Promise.all, remove from `serializeJSON` return.

### Pitfall 4: Diagram node min-width causing overflow on narrow desktop
**What goes wrong:** If `DiagramNode` has a fixed width and the diagram has 3 nodes per row with arrows, it can overflow at ~900px viewport.
**Why it happens:** Admin layout is constrained to `maxWidth: 1200` with a 210px sidebar = ~990px content area.
**How to avoid:** Use `flex-wrap: wrap` on `DiagramRow` and ensure nodes have `min-width` (not fixed width). Test at ~800px content width.

### Pitfall 5: ComputeRun query scope
**What goes wrong:** Using `prisma.computeRun.count()` without scoping shows all-time runs including test runs, not just production runs.
**Why it happens:** ComputeRun has `runType` field (`'projection' | 'scenario' | 'test' | 'actuals_ingest' | 'backfill'`). The diagram subtitle for "ComputeRun" node may want to show recent runs vs. total.
**How to avoid:** For the diagram subtitle count, use total count or last-7-days count — either is acceptable per Claude's Discretion. For the KPI error card, the query is already scoped to `status: 'failed'` + `createdAt: { gte: sevenDaysAgo }`. Both are correct.

## Code Examples

Verified from existing `pages/admin/data-science/index.tsx` source:

### Existing KpiCardBlock (reuse as-is for 3 of 4 KPI cards)
```typescript
// Source: pages/admin/data-science/index.tsx lines 82-111
function KpiCardBlock({
  title,
  value,
  subtext,
  href,
  icon
}: {
  title: string;
  value: number;
  subtext: string;
  href: string;
  icon: React.ReactNode;
}) {
  const isZero = value === 0;
  return (
    <KpiCard $alert={!isZero} hoverable>
      <KpiTitle>
        {icon} {title}
      </KpiTitle>
      <KpiNumber $zero={isZero}>{isZero ? <CheckCircleOutlined /> : value}</KpiNumber>
      <KpiLabel>{isZero ? 'No issues detected' : `${value} issue${value !== 1 ? 's' : ''} found`}</KpiLabel>
      <KpiLabel style={{ fontSize: 11, marginTop: 2 }}>{subtext}</KpiLabel>
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <Button href={href} block size='small'>
          View →
        </Button>
      </div>
    </KpiCard>
  );
}
```

### Existing Collapse + Steps pattern (reuse for How It Works)
```typescript
// Source: pages/admin/data-science/index.tsx lines 248-327
<Collapse
  ghost
  style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 8 }}
  items={[
    {
      key: 'howto',
      label: (
        <span style={{ fontWeight: 600, fontSize: 15 }}>
          <QuestionCircleOutlined style={{ marginRight: 8, color: '#2bbe50' }} />
          How to use the Data Science Admin
        </span>
      ),
      children: (
        <div style={{ padding: '8px 8px 16px' }}>
          <Steps
            direction='vertical'
            current={-1}
            items={[/* step items */]}
          />
        </div>
      )
    }
  ]}
/>
```

### Existing Row/Col grid pattern
```typescript
// Source: pages/admin/data-science/index.tsx lines 137-174
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={6}>
    {/* KPI card */}
  </Col>
</Row>
```

### Prisma count queries (new)
```typescript
// New queries for getServerSideProps Promise.all
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

prisma.changeRequest.count({ where: { status: 'pending' } }),
prisma.computeRun.count({ where: { status: 'failed', createdAt: { gte: sevenDaysAgo } } }),
prisma.project.count(),
prisma.factor.count(),
prisma.computeRun.count(),
prisma.metricResult.count()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| "Data Science Admin" title | "Data Governance Admin" title | Phase 1 nav rename completed | Title must match the renamed nav group |
| Quick-link 3-col cards (Calculations/Import/Governance) | 3×2 section cards for all 6 primary nav items | This phase | Replaces ad-hoc links with structured navigation grid |
| "How to use the Data Science Admin" Collapse | "How Impact Governance Works" Collapse | This phase | Reframing to governance language; steps updated to 6 |
| Methodology Documents card | Removed | This phase | Replaced by Methodology section card + How It Works step |
| KPI cards: Inputs/Constants/Calculations/Test Runs | KPI cards: Inputs/Change Requests/ComputeRun Errors/Test Runs | This phase | Shift from code coverage metrics to operational health metrics |

**Deprecated in this phase:**
- `publishedSections` query and `MethodologySubsection` type — removed when Methodology Documents card is removed
- "Constants" and "Calculations" KPI cards — replaced by "Change Requests" and "ComputeRun Errors" in the health row
- Quick-link section (3-col Calculations/Import/Governance cards) — replaced by 3×2 section card grid

## Open Questions

1. **Inputs KPI card href**
   - What we know: CONTEXT.md specifies `href='/admin/data-science/inputs'`
   - What's unclear: The `/admin/data-science/inputs` page is Phase 3 work (INP-01). At the end of Phase 2 this link will point to a not-yet-existing page.
   - Recommendation: Link to `/admin/data-science/inputs` as specified. Since Phase 3 creates that page next, users of this admin area will rarely encounter a broken link, and the Phase 3 page creation will make it valid. Do not add a guard.

2. **ComputeRun diagram subtitle: total count vs last-7-days count**
   - What we know: Claude's Discretion — either total count or last-7-days count is acceptable
   - What's unclear: Total count could be very large (thousands); last-7-days is more operationally meaningful
   - Recommendation: Show last-7-days count with label "N runs (7d)" for the diagram subtitle. Fetch with `prisma.computeRun.count({ where: { createdAt: { gte: sevenDaysAgo } } })` — add this as a 7th new query or reuse the failed-only query by also fetching a total-recent query.

3. **Section card for Inputs — description copy**
   - What we know: Card should have "1-line description"
   - What's unclear: Phase 3 defines INP-01 (data health dashboard) — the card description should match what that page will do
   - Recommendation: Description = "Detect and acknowledge data quality issues across projects." — matches INP-02/INP-03 intent.

## Sources

### Primary (HIGH confidence)
- Direct code reading: `pages/admin/data-science/index.tsx` — full existing implementation, component inventory, getServerSideProps queries
- Direct code reading: `prisma/schema.prisma` — ComputeRun (status: 'failed'), ChangeRequest (status: 'pending'), TestRun (failed field), Factor (updatedAt), MetricResult model confirmed
- Direct code reading: `layouts/AdminLayout.tsx` — AdminLayout title prop, selectedMenuItem, DATA_SCIENCE_KEYS array, nav structure
- Direct code reading: `lib/admin/inputValidation.ts` — getInputIssueCount() confirmed importable
- Direct code reading: `lib/admin/calculatorScan.ts` — scanCalculatorFunctions() confirmed, returns ScannedFunction[]

### Secondary (MEDIUM confidence)
- `.planning/phases/02-overview-redesign/02-CONTEXT.md` — all locked decisions derived from user discussion
- `.planning/REQUIREMENTS.md` — OVW-01 through OVW-05 requirements

### Tertiary (LOW confidence)
- None — all findings based on direct source inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use in the target file
- Architecture: HIGH — patterns verified by reading existing implementation
- Pitfalls: HIGH — identified from direct schema + component inspection
- Prisma queries: HIGH — schema fields confirmed (`status`, `createdAt`, `failed` on correct models)

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable Next.js/Prisma/antd stack)
