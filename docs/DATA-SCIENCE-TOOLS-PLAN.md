# Data Science tools — what each is for, and a consolidation plan

Written 2026-07-21. Companion to `docs/DATA-REVIEW-AGENDA.md` (the open methodology questions).

In-app versions of these descriptions now appear as a collapsible **"What is this for?"** panel at the top of every tool (`components/admin/HowTo.tsx`).

---

## 1. What each tool is for

Grouped by the job it does, not by where it sits in the menu.

### Managing the assumptions

| Tool | Job |
|---|---|
| **Factors** | The library of every assumption — emission factors, material weights, utility rates — with value, unit, source and version history. |
| **Change Requests** | Review queue so no assumption changes without a second pair of eyes and a recorded reason. |
| **Snapshots** | Pins a set of factor versions as a named methodology version, so past results can be reproduced. |

### Managing the math

| Tool | Job |
|---|---|
| **Calculations** | Every calculation function in the engine, source code readable (and editable) in the browser. |
| **Data Products** | Visual builder for *new* calculators made of variables rather than code, with live values on the canvas. |

### Checking correctness

| Tool | Job |
|---|---|
| **Test Runs / Golden Datasets** | Regression testing: known inputs through the real engine, compared against expected answers. |
| **Data Inputs** | Scans real projects for broken inputs (no state, no line items, units-per-case of zero, repurchase > 100%). |
| **Run History** | Log of calculations the app performed, with provenance and errors. |
| **View as Datasheet** *(new, on each project)* | One project as a spreadsheet: entered values → catalog values → factors → intermediates → outputs, with a reconciliation proving the rows sum to the engine's totals. |

### Explaining the system

| Tool | Job |
|---|---|
| **Overview** | Landing page: health counts and links. |
| **Data Map** | Visual map of how data flows between entities. |
| **Lineage** | Table mapping factor → code constant → calculation → output metrics. |

### Other

| Tool | Job |
|---|---|
| **AI Data Uploader** | Bulk import of spreadsheets with assisted column mapping. |
| **Methodology** | The published, customer-facing methodology documents. |
| **Impact Simulator** | *Intended* to model "what if this factor changed" — currently does not compute anything (see below). |

---

## 2. Where the overlap is

**Three tools answer "how does this connect?"** — Data Map (visually), Lineage (as a table), Overview (as cards) — and a fourth, **Pipeline**, still exists in the codebase (`pages/admin/data-science/pipeline/index.tsx`, self-labelled `pipeline-legacy`) though it is no longer in the menu. None of them shows a real number moving through the system.

**Lineage and Calculations overlap directly.** Both map factors to functions, from two separately maintained sources. `LINEAGE_MAP` exists **twice** — `lib/admin/lineageMap.ts` (11 entries) and a private copy inlined at `pages/admin/data-science/lineage/index.tsx` (9 entries). They have already diverged: the shared copy has the two `getEnvBreakEven` entries, the inlined one does not. Two pages can therefore disagree about the same factor.

**Run History and Test Runs** sound alike but mean different things: one is calculations the app performed, the other is regression tests you trigger. A naming problem more than a design one.

**The pattern:** tools that *manage data* each earn their place. Tools that *explain the system* are where the redundancy lives, and they are mostly static diagrams that prove nothing about any specific number.

---

## 3. Things that are actively misleading

1. **Impact Simulator does not simulate.** `pages/api/admin/impact-analysis.ts:40-49` computes `hypothetical / current` once and stamps that same percentage onto every affected metric. It never loads a project or calls a calculator. Anyone using it to investigate a discrepancy gets a confident-looking non-answer.
2. **The "Inputs → Constants → Function → Outputs" chains on the Calculations page are decorative** — empty tags, no values behind them (`calculations/index.tsx:310-344`).
3. **Editing a factor does not change results.** Calculators read values compiled into the code; the Factor library mirrors them for record-keeping only. This is the single biggest gap between what the governance tooling implies and what it does.
4. **`extractConstantRefs`** (`lib/admin/calculatorScan.ts:93-119`) is written but never called — it would give per-file constant references, which is exactly what Lineage is missing.

---

## 4. Consolidation plan

### Step 1 — Make the trace the centre of the "explain" tier *(started)*

**View as Datasheet** now shows, for a real project, every stage from input to output with a reconciliation against the engine. That is what Data Map, Lineage and the Calculations chains were each gesturing at.

Next: reach the same view from the Data Map's Projections mode and from a failing Test Run row, so any investigation lands in one place.

### Step 2 — Retire and merge

| Action | Detail |
|---|---|
| **Delete Pipeline** | Superseded by Data Map; already out of the menu. |
| **Fold Lineage into Factors** | "What does this factor affect?" belongs on the factor itself, not on a separate page. Delete the duplicated `LINEAGE_MAP` in `lineage/index.tsx` first, then move the affected-metrics column onto the Factors detail view. |
| **Keep Data Map as orientation only** | Its job becomes explaining the architecture. The How-To panel already says so and points to the Datasheet for numbers. |
| **Rename Run History → Calculation Log** | Removes the collision with Test Runs. |
| **Fix or remove the Impact Simulator** | Rebuild on the real engine (take a project or golden dataset, substitute the hypothetical factor value, re-run `getProjectionsFromInventory`, show the before/after) — genuinely useful, and reuses `run-projections`. If that is not scheduled, remove it rather than leave a fake answer in the menu. |

### Step 3 — Close the factor → calculator gap

The largest piece of real work: have calculators resolve values from the published Methodology Snapshot instead of hardcoded constants. Until then, Factors, Change Requests, Snapshots and Lineage are all record-keeping around numbers the engine never reads. This also unblocks region-specific grid factors and annual data refreshes without a deploy.

### Step 4 — Data Products Designer as the "see the code" surface

The goal stated for this tool: any calculator, dashboard or model in Chart-Reuse should be inspectable there, so a data scientist can see how it works without reading TypeScript.

Today the designer only understands hand-authored variable formulas; the real engine's functions cannot be dropped in. Getting there needs:

1. A `calculator_function` node kind that invokes a registered engine function rather than a hand-built formula.
2. Instrumentation so engine functions can report their steps — the missing piece behind every "show the math" feature.
3. Keeping the substituted-expression string that `lib/dataProducts/evaluateFormula.ts:144` already builds and then discards; it is exactly the artifact a trace needs.

The Datasheet is the pragmatic first delivery of this idea: real engine, real numbers, no reimplementation. The designer version generalises it from "this project" to "any model".

---

## 5. Suggested order

1. Fix the confirmed calculator bugs (`DATA-REVIEW-AGENDA.md` §3) — correctness before tooling.
2. Link Datasheet from Data Map and Test Runs.
3. Delete Pipeline; de-duplicate `LINEAGE_MAP`; fold Lineage into Factors.
4. Decide the Impact Simulator's fate.
5. Factor → calculator runtime resolution.
6. Designer as the general "see the code" surface.
