# Chart-Reuse 2.0 — Data Science UX Spec: Command Center + Studio

Derek's product vision, recorded 2026-08-15 (his words lightly structured). This supersedes
backlog #37's "revisit as a whole" note — this IS the design to build toward. Direction:
**Option A + C combined** — an Operations Command Center as the main experience, with a
dual-workspace / split-view builder inside the Product Designer.

## The three product types

| Type | Serves | Project kind |
|---|---|---|
| **Calculator** | "What would happen?" | Projection projects |
| **Dashboard** | "What actually happened?" | Actuals projects |
| **Scenario** | "Which policy wins?" — comparing interventions (e.g. coffee shops only vs coffee shops + schools) | Policy projects |

Scenario products additionally define: comparison unit, intervention types, geography, time
horizon.

## Two AI features, deliberately separate

- **AI Uploader** (data ops): turn workbooks into core data/calculation updates. Flow: upload →
  identify tabs/variables/formulas/factors → propose mappings → review (new / changed /
  suspected errors) → approve/reject/edit → save as factor update, dataset update, golden
  dataset update, or methodology revision. *The deterministic multi-sheet diff shipped on this
  branch is the review backbone; the AI layer proposes mappings for unrecognized shapes.*
- **AI Designer** (product creation, lives inside the Product Designer): prompt → page
  structure, components, metric cards, chart choices, required inputs, UX copy scaffold.
  E.g. "Create a dashboard for school actuals focused on cost, waste and student participation."

## Every product has a golden dataset

Each calculator/dashboard/scenario links a `GoldenDataset` serving as test case, validation
case, demo case, regression check, and preview case. Product cards show: linked golden
dataset, validation status, last run, output diff from previous version. When a factor or
formula changes, the system can say **"this change altered 3 published products."**
*(Shipped on this branch: `DataProductDefinition.goldenDatasetId`, and the Annual
Projections 2.0 bench's scenario stored as a real GoldenDataset.)*

## 1 · Command Center (the Data Science home)

Health + action first, not impact totals. *(First cut shipped on this branch.)*

- **Row 1 — system cards:** products live · golden datasets healthy X/Y · alerts requiring
  review · AI uploads pending · recently changed data (7d) · pending change requests.
- **Row 2 — quick actions:** Upload workbook · Create Calculator / Dashboard / Scenario ·
  Open Product Designer · Review Alerts · Validate Golden Datasets · Data Map.
- **Row 3 — three columns:** Data Health (stale/broken/missing/outdated) · Change Alerts
  (factor updates, version diffs, changed outputs) · AI Upload Queue (pending, confidence).
- **Row 4 — products** in tabs (Calculators / Dashboards / Scenarios): status, golden
  dataset, last updated, health.
- **Row 5 — activity feed:** "Madhavi updated emissions factors", "AI uploader proposed 12
  mappings", "School Dashboard published", "Venue Calculator failed validation".
- **Row 6 — pinned tools:** Traceability, version history, databases, designer, formula editor.

## 2 · Product Studio (the Designer, rebuilt as a multi-layer workflow)

**Header:** name · type · status (Draft/Validated/Published) · Guided/Advanced toggle ·
Logic/Experience/Split view toggle · linked golden dataset · version · Publish.

**Stages (tabs):**
1. **Define** — name, description, type, audience, use case, template, project type, golden
   dataset. Scenario extras: comparison unit, interventions, geography, horizon.
2. **Data** — sources, required inputs, factors/constants, variable mappings, source tables,
   golden dataset config, defaults, AI-uploader suggestions. Form-based in Guided; tabular in
   Advanced.
3. **Logic** *(Madhavi's workspace)* — formulas, assumptions, dependencies, units, calculation
   modules, metric definitions, version comparison, traceability, formula testing.
4. **Experience** *(Derek's workspace)* — layout, components, cards/charts/tables, labels,
   tooltips, storytelling, flow, sections, CTA, simple-vs-advanced display.
5. **Validate** — preview WITH the golden dataset, expected vs actual, checks, missing fields,
   changed metrics, AI-suggested issues.
6. **Publish** — notes, version, visibility, audience, share settings, rollback.

**Split view is the key pattern:** logic/data on the left, live product preview on the right;
clicking a metric in the preview highlights its variables, formulas, and sources. This bridges
the math workspace and the design workspace in one shared product object.

**Layout blueprint:** top bar (name | type | Guided/Advanced | status | golden | Run
Validation | Publish) · left sidebar (Structure, Inputs, Outputs, Logic, Data Sources,
Components, Pages, AI Designer) · center canvas (preview/builder) · right sidebar
(context properties) · bottom panel (Data / Formula / Traceability).

## Guided vs Advanced mode

One product, two densities — never two products.

| | Guided | Advanced |
|---|---|---|
| For | stakeholders, product creators | Madhavi, data team |
| Labels | "Annual GHG Reduction" | `environmentalResults.annualGasEmissionChanges.total` |
| Controls | strong defaults, wizard flows, progressive disclosure | full variable tables, formula editor, mappings, version selectors, dependency graphs |

## Build phases

1. ✅ Command Center first cut (this branch) — real counts, quick actions, health/changes/AI
   columns, products by type, activity feed.
2. ✅ Golden linkage (this branch) — `goldenDatasetId` on products; bench scenario as a real
   GoldenDataset.
3. Studio shell: product header + stage tabs over the existing designer/smart-fields pieces;
   Validate stage = the golden bench generalized to any product.
4. Split view + click-through highlighting (extends the existing calculation inspector).
5. AI Designer prompt → scaffold inside the Studio; AI mapping proposals inside the Uploader.
6. Guided/Advanced toggle across Studio surfaces; "changes altered N products" impact analysis
   wired to FactorDatabaseChange.
