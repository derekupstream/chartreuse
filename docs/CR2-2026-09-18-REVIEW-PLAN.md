# Implementation Plan — Madhavi Workbook Review (2026-09-18)

Source: Derek + Madhavi walkthrough of `Upstream Chart-Reuse Databases.xlsx` (Sept 18
revision — adds a README contract tab; Funding_Opportunities now carries
min_amount / max_amount / funding_range_text and tracker links). This plan turns the
meeting notes into workstreams, sequenced against `CR2-LAUNCH-PLAN.md` (this meeting
covers a large part of milestone M0).

---

## 0. What the meeting confirmed (no work — record it)

The workbook↔product mapping Madhavi described is exactly what's built:

| Workbook tab | Product surface | Status |
|---|---|---|
| Dashboard | Projections Dashboard page | Mapped; 17/17 metrics reconcile (Scenario Dashboard project) |
| Scenario_SU | Single-Use Purchasing page (usage/user inputs) | Mapped |
| Scenario_Reuse | Reusables Purchasing page | Mapped |
| Dishwashing | Dishwashing page (inputs feed a calc layer) | Mapped (forecast-program semantics, 1f71f9e) |
| Additional_Costs | Other Expenses page | Mapped |
| Calc_SU / Calc_Reuse | Single-Use Details / Reusables Details views | **The gap**: detail views still compute v1 (feedback #11 — her model doesn't define the decompositions yet) |
| Remaining tabs | Data Science admin (databases + functions) | Built |

Her framing to keep: the workbook is the *calculation specification + QA harness*
(her README tab now says so explicitly); Scenario tabs are usage-input tabs, not
"scenarios"; the Dashboard is the aggregation layer, with planned Q4 flexibility for
users to choose/reorder/remove dashboard content.

---

## Workstream A — IA changes in the Data Science admin

### A1. Purchase Frequency folds into the Data Dictionary page

Decision from the meeting: it's a conversion factor, not a standalone database.

- **Keep the underlying `Purchase Frequency` FactorDatabase** — cell formulas reference
  it via `@{...Annual_Factor...}` tokens and the runtime suite's ripple check edits it;
  deleting it breaks the formula system and the workbook diff (her tab still exists).
- **Change where it appears**: remove it from the Databases listing (its `kind`
  stays `factors`; add a `hidden`/`dictionary` presentation flag or filter by name) and
  render it ON the Data Dictionary page as a new section — "Defined terms & conversion
  factors": the dictionary's `frequency` enum row (Daily/Weekly/Monthly/Annually)
  becomes expandable to show each term's annualization factor (365 / 52 / 12 / 1),
  editable in place with the same changelog machinery.
- The uploader keeps accepting her `Purchase_Frequency` tab and routes it to the same
  table — nothing changes for her workflow.

### A2. Data Dictionary page (already exists) grows into the "app contract" view

It's already a page (`/admin/data-science/data-dictionary`). Additions:
- The frequency-definitions section above.
- Surface her dictionary's contract columns prominently: Field / Type / Unit /
  Authority / Role / Requirement — this is what she means by "Python-friendly": a
  machine-readable spec someone could re-implement the model from.
- Add an "Export contract" button: JSON + CSV of the dictionary and all database
  schemas, for her Python work.

### A3. Remove Open Questions everywhere

Menu is already clean. Finish the job: drop `open_questions` from
`scripts/load-cr2-data-release.ts` + `scripts/data/cr2-release-2.0.json`, delete the
FactorDatabase row if present, and add `Open_Questions` + `README` to the uploader's
non-data skip list so her new README tab never shows up as "+1 new database."

### A4. Products page (rename/regroup, mostly existing pieces)

Meeting decision: Validation belongs to a *product*, and products deserve a top-level
page.

- New menu item **Products** (replaces the Advanced → "Data Products & Designer" +
  "Annual Projections" pair): a listing page with two product cards —
  **Annual Projections Calculator** and **Event Actuals Dashboard** — plus "Add new
  product" (routes into the designer).
- Each product page gathers what already exists: methodology pin, golden datasets,
  **Validation** (the quality page, scoped to that product), settings, and — per the
  meeting note — the future "dashboard content" configuration (users choose/reorder/
  remove dashboard cards, planned Q4 flexibility).
- Keep `/admin/data-science/quality` as a redirect/deep link so nothing breaks.
- The full designer ("Miro board + spreadsheet — two views of the same data/formulas/
  flow") is Product Studio phases 3–6. The board view seeds from the existing Data Map
  (ReactFlow); the spreadsheet view from the databases grid. **Post-launch** — but the
  Products listing + Validation regrouping is cheap and lands pre-launch.

---

## Workstream B — Funding opportunities (agreed model: informational, not wired into cost math)

Rationale recorded: grant amounts are too variable for cost math (a $10K pool splits
unpredictably); exception class = fixed municipal incentives (e.g., Boulder's $2K
reuse credit).

1. **B1 — Keep the database out of calculations** (already true; write it into the
   database description so it's policy, not accident).
2. **B2 — Link out**: the Funding database page and (later) the user-facing surface
   link to the public tracker (`upstream-compass.replit.app/tools/funding` — URL now
   lives in the workbook tab itself) with state/province filtering. The workbook's
   `state_province` + `country` columns support the filter; this is also the first
   concrete consumer of a **country toggle** (see D3).
3. **B3 — Custom funding input on projects** (the agreed UX): an optional "Funding /
   incentive" entry — amount + frequency — that shows its cost impact in the financial
   summary as an offset. Implementation: a dedicated entry type on the Additional
   Costs page (an `OtherExpense` with a `funding` category and negative-cost
   semantics, NOT a raw negative number the user has to think up). Frequency reuses
   the Purchase Frequency factors.
4. **B4 — Min/max slider**: worth considering, **deferred** until the min/max columns
   are actually populated (she added the columns; the audit didn't finish normalizing
   the data — inconsistent dates, early-bird vs late deadlines). Revisit when Miley's
   CSV lands.
5. **B5 — Funding data intake**: the new Funding_Opportunities columns (min_amount,
   max_amount, funding_range_text, tracker URLs, opportunity_link) land via the C1
   reconciliation upload; when Miley's CSV arrives it comes through the uploader too —
   funding is a dataset maintained outside the admin, so it stays on the intake path.

---

## Workstream C — The admin is her workbench; the uploader is the intake tool

Corrected framing (Derek, post-meeting): Madhavi enjoyed building the spreadsheet,
but **going forward she wants to work inside the Data Science admin** — not keep
editing the workbook and re-uploading it. The AI-powered uploader stays and matters,
but its job is *intake*: bringing new datasets, bulk data, and partner data into the
product (Miley's funding CSV, ECCC releases, future factor sets), plus the one-time
migration of anything still living only in her workbook.

That resolves the workbook's status cleanly: her Sept 18 file is the **final
specification snapshot**, not a living pipeline. Once its contents are confirmed
loaded, the versioned databases in the admin become the source of truth, and the
workbook becomes what her README tab calls it — the auditable spec the product was
verified against.

### C-a. Make the admin fully sufficient for her daily work (the priority)

Most of this exists (spreadsheet-style editing, @ formulas, save-with-reason,
changelogs, releases, change requests, validation). What "sufficient" still needs:

- **C1** A final reconciliation upload of the Sept 18 workbook — diff every tab against
  the live databases, accept what's new (funding min/max columns etc.), and record the
  release. After this, divergence between workbook and product is expected and fine.
- **C2** Close the friction she hits working in-admin during M2 beta — treat her
  first two weeks as a punch list (bulk row operations, column reorder, copy/paste
  from Excel are the likely asks). The Model Console (D1) is part of this workbench.
- **C3** Confirm with her which tabs she considers "hers to keep editing in Excel"
  (if any) vs done — so we know whether any tab still needs the re-upload path at all.

### C-b. Uploader hardening (for intake, not for her routine)

- **C4** Skip list for non-data tabs (README, Open_Questions) — see A3.
- **C5** New-field detection UX: an explicit "what changed" summary (N new fields,
  N changed values, N ambiguities) so a multi-tab intake reads as one change review.
- **C6** Ambiguity flags: renamed columns / changed row keys get an AI-suggested
  mapping with confirm/decline instead of add+delete.
- **C7** Every accepted upload cuts a changelog entry and (on request) a collection
  release — this is the mechanism ECCC onboards onto in M3, so its polish pays twice.

---

## Workstream D — New capabilities

### D1. A console for Madhavi ("play with data/code when testing/developing products")

Two phases, honest about effort:

- **Phase 1 — Model Console (JS, pre-launch, fits M2 beta)**: a page under Advanced:
  pick a project (or the golden inputs), see the full `buildModelInputs` payload as an
  editable JSON/inputs panel, run the v2 engine live, see the 17 Dashboard metrics +
  validation checks recompute, diff against the last run. Plus a formula scratchpad
  that evaluates `@{Database.column:rowkey}` expressions against live tables (the
  machinery exists in `lib/admin/formula*.ts`). This makes her beta testing (launch
  plan M2, "Madhavi is beta user #1") dramatically more effective.
- **Phase 2 — Python console (post-launch, matches her "Python-friendly" framing)**:
  in-browser Python via Pyodide with pandas, every database preloaded as a DataFrame
  (`ghg_factors`, `utility_rates`, …) and the model inputs as a dict. No server, no
  security surface beyond the browser sandbox. Scope it after she's used Phase 1 —
  Phase 1 may be enough, and the A2 "Export contract" button covers offline Python in
  the meantime.

### D2. End-of-life pathway — decision recorded: NOT building selection

Madhavi's caution stands: WARM assumes recycled content upfront; adding an end-of-life
credit on top risks double-counting and overly-positive reuse results. The consensus
need is a **"double-click" to validate methodology** — transparency, not toggles.
Actions:
- Fold into #19c (calculation transparency): the methodology stamp detail + calculation
  inspector, opened to account owners, IS the double-click.
- Update the TEA follow-up: EOL selection is declined-with-reasons; the aluminum-
  recycling story gets answered by a methodology note (and later a Studio scenario
  comparison), not a settings toggle.
- Add the double-counting rationale to `CR2-CALC-MODEL.md` so the "why not" survives.

### D3. Backlog additions (future tabs / model expansion — record now, build later)

| Item | Trigger | Notes |
|---|---|---|
| Reuse service types database | Mastercard conversation | Also TEA's "dream feature" fee structures (per-item wash, bin rental, replacement) — same table |
| Place settings / venue-business type | Meeting | Per-customer usage assumptions by restaurant/venue type — a new factor database feeding usage defaults |
| Country toggle | ECCC + funding filtering | Broader than data: currency (P0 #4), rate sets, factor sets, funding filter. Design once — utility rates, grid factors, and funding all hang off it |
| Canadianized WARM assumptions | ECCC ("flexible, but asking") | Province-level electricity-to-GHG = `feat/regional-grid-factors` (built, held — this meeting is another reason to ship it); modified WARM material assumptions = ECCC-supplied versioned release (#19a) |

---

## Sequencing against the launch plan

| When | What lands |
|---|---|
| **Now → M1 (Sept–mid Oct)** | A1 (frequency → dictionary), A3 + C4 (Open Questions/README cleanup + skip list), B1/B2 (funding policy + link-out), C1 (final reconciliation upload of the Sept 18 workbook — after this, the admin is the source of truth) |
| **M2 (mid Oct–mid Nov)** | D1 Phase 1 (Model Console — in Madhavi's hands for beta), C2 (her in-admin friction punch list, worked weekly), A4 (Products listing + Validation regroup), B3 (funding input on projects), C5/C6 (intake review UX) |
| **M3 (mid Nov–Dec 11)** | C7 exercised for real by ECCC onboarding; B4 revisited if Miley's CSV lands; D2 transparency work rides #19c |
| **Post-launch** | A4 full designer (Studio phases 3–6), D1 Phase 2 (Python console), D3 items as contracts/partners mature |

## Open decisions for Derek

1. A4 menu shape: does **Products** replace the "Advanced" group's product entries at
   the top level of Data Science, or sit inside Advanced until the designer exists?
2. B3 placement: funding entry on the Additional Costs page (recommended — it's a cost
   offset) vs a separate "Funding" page.
3. D1 Phase 1 scope check with Madhavi: JSON-editing console vs form-based inputs —
   ask her which she'd actually use before building.
