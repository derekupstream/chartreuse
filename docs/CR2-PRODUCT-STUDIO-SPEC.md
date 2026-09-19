# Product Studio — Unified Spec (Field Builder + UX Builder + Products)

**v2 — 2026-09-19.** Supersedes the 2026-08-15 spec (kept in git history; its shipped
pieces — Command Center, golden-dataset linkage — carry forward unchanged). This version
unifies three prior iterations — the Annual Projections test bench, the designer-v2 board,
and the Smart Fields builder — into one system, per Derek's two mockups (Smart Field
Builder, Product UX Builder) and the 2026-09-19 brainstorm.

---

## 1. Thesis

**A product is fields + screens + a publication.** Everything else is a view of that one
definition.

```
Product
├── Fields   (the DATA view — Madhavi's material)
│   ├── input fields      questions users answer; values stored per submission
│   ├── smart fields      equations over inputs, database refs, other fields
│   └── database refs     live @{Database.column:rowkey} values (shipped)
├── Screens  (the UX view — Derek's material)
│   └── ordered blocks: heading · rich text · question group · input field ·
│       smart field card · chart · button
└── Publication (the PREVIEW → the shipped product)
    └── version snapshot + golden dataset + card on the Products page + rendered route
```

**Two governing principles**, learned from the iterations:

1. **AI and humans propose; the safe evaluator executes.** Every computed value is a
   smart-field equation the machinery can inspect, version, changelog, and golden-test.
   No stored `executionCode` ever runs — that's why designer-v2 stayed a shell. Its board
   survives as a *visualization* (lineage view), never as an execution engine.
2. **Constrained beats free-form.** The block palette is a closed set; one generic
   renderer serves the builder preview AND the published product, so preview is never a
   lie. Pixel freedom is out of scope on purpose.

## 2. The atom: a smart field is equation + presentation + provenance

From the Field Builder mockup — a smart field carries:

- **Equation**: typed tokens (variables, constants, operators, parens) ending in a named
  **output** (`… = ghgReduction`). Fields compose: one field's output is another's
  intermediate.
- **Presentation**: its own result card — label, display unit (auto-derived, overridable),
  % badge, baseline/forecast bars. *This is the bridge to the UX Builder*: placing a field
  places its card; there is no separate wiring step.
- **Provenance**: every variable resolves to a source — the Variable Source panel shows
  type, source database/table/cell, **version**, unit, "used in N smart fields", and a
  live preview of the actual source rows with the referenced cell highlighted
  ("Open in database" deep-links to the spreadsheet).
- **Shape**: fields compute **baseline/forecast pairs** (the engine's `MetricTriple`),
  not scalars — reduction and % fall out for free.

**Detected requirements** (the panel in the mockup; `detectRequirements()` already exists
in `lib/smartFields/variables.ts`) is the contract between builders: a field knows which
user inputs and factors it needs, with ✓/⚠ status. Requirements propagate upward — a
screen's required questions are *computed* from the fields placed on it.

## 3. One expression language, two editors (Visual | Console)

Today two syntaxes describe the same idea: Smart Field equation tokens and the
spreadsheet/console formula grammar `= 2 * @{Purchase Frequency.Annual_Factor:weekly}`.
**Unify them**: the pill editor emits formula text; the console edits formula text; they
round-trip losslessly (Dreamweaver split view). The `Visual | Console` toggle appears in
BOTH builders (per the UX Builder mockup — the console view of a screen is its block
definition; the console view of a field is its formula).

The grammar grows three things it lacks today:
- **named outputs** (`= expr AS ghgReduction` or the mockup's trailing `= name` pill)
- **input variables** (see §4)
- **aggregates over repeating groups** (see §4 — the hard requirement)

Shipped seeds: the formula evaluator + `@` token resolution (spreadsheet cells, Model
Console scratchpad), the variable catalog with database provenance (Smart Fields), the
client-side engine pattern (test bench, Validation page, Model Console).

## 4. The new primitive: input fields, submissions, and repeating groups

Today "user inputs" are hardcoded Prisma models. Composed products need:

- **InputField definition**: key, question text, type (number, currency, select,
  boolean, state/province, …), unit, validation, default, help text. Lives in the
  product's field list; appears in the variable catalog under **Inputs**.
- **Submission store**: a generic `ProductSubmission` (product, version, project/user,
  `valuesJson` keyed by input field) — the "input fields that store data" from the
  brainstorm. Anonymous submissions supported for public calculators.
- **Repeating groups — the make-or-break feature.** Her model is not `a × b`; it is
  *"for each product line: compute, then SUM"* (`SUM(Calc_SU!N5:N34)`). So: an input
  field may be a **group** (a line-item table with its own member fields), and the
  language gets aggregates (`SUM over <group> of <expr>`, later AVG/COUNT/MIN/MAX).
  Intermediates scoped to a group are the Calc_SU/Calc_Reuse columns as a concept.
  Nothing ships without this; it is phase 2, not a stretch goal.

**Variable taxonomy** (the Add-variable dropdown): `Inputs · Factors · Products ·
Intermediates · Outputs`.

## 5. Field Builder (mockup 1)

Layout: left — field gallery (each card shows live value, % badge, mini bars) + New
smart field. Center — selected field: its result card rendered exactly as users will see
it (display-unit selector), the equation (pills ↔ console), Add variable / constant /
operator, **Detected requirements** (✓ satisfied, ⚠ missing, "View all"). Right —
**Variable Source** panel (provenance + live source-row preview + used-in counts).
Header: Preview · Save · **Publish** (fields publish independently of products — a
published field is reusable across products).

Console option: the same field as editable formula text with `@` autocomplete (the
spreadsheet's picker, already built). Test inputs (`testInputs`, already in the model)
drive the live card.

## 6. Product UX Builder (mockup 2)

Breadcrumb: `Products / <product> / Builder`. Header: **Visual | Console** · Preview ·
Save draft · **Publish**. Tabs on the builder: **Preview / Data / UX** (§7).

- **Left — Product structure**: ordered screens (the mockup's seven — Welcome, About your
  operation, Single-use details, Reusable system, Operations, Results, Summary — are
  today's project wizard re-expressed as screens; the proof the current product is
  eventually describable in this system). Drag to reorder; New screen.
- **Center — the screen canvas**: rendered by the SAME generic renderer the published
  product uses. Device preview (Desktop/Tablet/Mobile). "Blocks on this screen" list
  below, plus the closed **block palette**: Heading · Rich text · Question group ·
  Input field · Smart field card · Chart · Button. "Create new smart field" opens the
  Field Builder (the escape hatch runs both directions).
- **Right — Properties & data** for the selected block: label, component type, source
  (Smart field → linked field), format, **visibility rule** ("Show when results are
  available" — declarative conditions, no code). Below it, **Data dependencies**: required
  inputs, required factors, intermediates used — computed from placed fields, with ⚠ for
  anything no screen collects. A product cannot publish with unsatisfied dependencies.
- Buttons carry product-level actions from a small set (next screen, compare scenario,
  print/share) — not arbitrary handlers.

## 7. The Products page: Preview / Data / UX

Every product (composed or native) gets three tabs — three views of one definition:

| Tab | Shows | Who lives there |
|---|---|---|
| **Preview** | The rendered product on its golden dataset — the test bench generalized (PASS/FAIL badges while inputs match golden) | everyone |
| **Data** | The field graph: inputs, smart fields, database refs, requirements, validation, versions | Madhavi |
| **UX** | The screens and blocks | Derek |

Building only from existing fields? The Data tab is read-only reference — visible, never
in the way (transparency, not clutter). **Native products** (Annual Projections,
Event Actuals — code-built, launching January) get the same tabs with Data/UX rendered
from their known structure, read-only; they are the reference implementations, ported to
composed form only when the system has proven itself (§9).

## 8. Publish pipeline and governance

Publishing a product:
1. Dependency check (every required input collected somewhere; no ⚠).
2. Golden run — the linked GoldenDataset computes and matches (the product's acceptance
   test; pattern already proven by the bench + CI).
3. Version snapshot on `DataProductDefinition` (fields + screens + linked data release),
   status → published, card appears on the Products page, route `/p/<slug>` renders it.
4. Changelog entry; restore works like data releases (exact).

Governance extends, not duplicates: fields version like factors ("value changes bump the
version"); change requests can reference a field; the Command Center's impact line —
**"this change altered 3 published products"** — comes from requirements lineage
(FactorDatabaseChange × field dependencies).

## 9. Reuse inventory — what becomes what

| Existing (shipped) | Becomes |
|---|---|
| Smart Fields builder + `evaluateEquation`/`detectRequirements` | Field Builder core |
| `@{…}` formula grammar + evaluator + recompute (spreadsheet cells) | The console syntax + execution engine |
| Model Console (client-side engine, scratchpad, project-inputs API) | Field Builder's console + test-input machinery |
| Annual Projections test bench (golden PASS/FAIL, live recompute) | The Preview tab, generalized |
| Validation page checks | Product-level checks in the Data tab |
| designer-v2 flow graph + Data Map (ReactFlow) | Lineage visualization inside the Data tab |
| AI Designer prompt→scaffold (old spec §AI) | AI proposes fields/screens as DRAFTS into the same structures — never executable code |
| `DataProductDefinition` (inputSchema/outputSchema/publishedVersion, goldenDatasetId) | The product row; flow/executionCode columns retired |
| Data releases / changelog / change requests / methodology stamps | Same machinery, one level up |
| Project wizard screens + KPI cards + calculation inspector | The generic renderer's block implementations |

New construction, honestly: InputField + ProductSubmission models, repeating groups +
aggregates in the grammar, the screen renderer, the UX Builder shell, publish pipeline.

## 10. Build phases

Post-launch work (January 2027 launch scope is untouched; native products ship it).

1. ✅ **Thin vertical slice** — SHIPPED 2026-09-19 and dogfooded end to end wearing all
   three hats: a smart field built in the GUI, a second built entirely in the new
   Console editor (`oneTimeCosts - fundingAmount * fundingTimesPerYear`), the
   **Funding Estimator** composed in the Product UX Builder (screens/blocks, derived
   dependencies, one-click input defs), published, and used as an end user at
   `/p/funding-estimator` — answers + results snapshot stored as a ProductSubmission.
   Shipped pieces: `lib/smartFields/console.ts` (Visual|Console round-trip),
   `lib/products/composed.ts` + `ComposedProductRenderer` (one renderer for builder
   preview and live product), the builder at products/[id]/builder (Preview/Data/UX
   tabs, dependency-gated publish), `/p/[slug]` + submissions, migration
   20260919000000. Dogfooding fixes: unsaved-work guard + console resync in the Field
   Builder; suggestion tags carry catalog labels/units; new input blocks default to
   the first unplaced input.
2. **Repeating groups + aggregates** — the grammar and group inputs; re-express one
   Calc_SU column as a field chain to prove it.
3. **Field Builder to mockup 1** — gallery, requirements panel, Variable Source panel,
   Visual|Console round-trip, field publishing.
4. **UX Builder to mockup 2** — screens, palette, properties, dependencies, visibility
   rules, device preview.
5. **First real composed product: ECCC scenario comparison** (backlog #19b — the paid
   deliverable; scenario products add comparison unit/interventions/geography/horizon
   from the old spec §product-types).
6. **Port the natives** — Annual Projections expressed as fields+screens, verified by the
   same golden dataset; the wizard becomes a renderer theme.

## Carried forward from v1 of this spec

- **Command Center** (shipped) stays the Data Science home.
- **Every product has a golden dataset** — unchanged, now load-bearing in publish.
- **Guided/Advanced** is recast as **Visual | Console** — same intent, sharper form.
- **AI Uploader stays a separate feature** (data intake), deliberately apart from the
  AI Designer (product scaffolding).
