# Chart-Reuse 2.0 × the Combined Data & Calculation Model

*Review for Madhavi — week of 2026-08-17. How the workbook became the guide, the data, and the
ground truth for Chart-Reuse 2.0.*

Your README declares four roles for the workbook: **calculation specification, source
database, QA harness, and app-integration reference.** We took that literally. Each role is
now a shipped system in the product, with proof attached.

| Workbook role (your README) | What it became | The proof |
|---|---|---|
| Source database | 8 versioned databases, one per tab | Re-uploading your workbook reads **IDENTICAL** on every data tab |
| Calculation specification | The 2.0 engine (`combinedModel`) | Reproduces your Dashboard tab **to 8+ significant figures** |
| QA harness | Golden datasets wired into CI and the product | Your example scenario is a permanent regression test |
| App-integration reference | The workbook-upload workflow | You update the app the way you update a tab |

---

## 1 · Source database → Data Release 2.0

The Databases area now holds **one database per workbook tab, named as your tabs read**:
Single-Use Products, Reusable Products, GHG Factors, Water Factors, Transport Factors,
Purchase Frequency, Utility Rates, Dishwasher Factors. Updating a database *is* uploading the
tab it came from.

Around them, the versioning you'd expect of a serious data product (precedent: ecoinvent
releases, DEFRA annual factors):

- **Kind-aware versions** — factor tables bump on change (their values change calculations);
  product directories grow without a bump. Everything is changelogged either way: who, what
  rows, which columns, from what source.
- **Automatic methodology snapshots** — any factors change cuts an immutable record of every
  table version at that moment. "Data Release 2.0" exists as a named snapshot (your workbook,
  2026-08-14, all 8 table versions); so does "Methodology 1.0 — legacy engine" (the compiled
  factors captured verbatim), so both eras are reconstructible forever.
- **Per-project pins** — every project carries the methodology version its numbers were
  computed under (all 290 existing projects: 1.0) and shows it as a citation line on its
  dashboard: *"Calculated with Chart-Reuse Methodology v1.0."* Nothing a user cited ever
  changes silently; upgrades are explicit.

**Proof it's faithful:** parsing your actual workbook file through the upload pipeline and
diffing against the loaded databases reads *identical* — 0 added, 0 changed — on all five data
tabs, with one auto-repair (see finding #6 below).

## 2 · Calculation specification → the 2.0 engine

`lib/calculator/v2/combinedModel.ts` implements Calc_SU, Calc_Reuse, Dishwashing,
Additional_Costs, and Dashboard **column-for-column**, as pure functions over the Data Release
tables — your calculation flow, your sign convention, your units rules, verbatim.

**Golden reproduction** (in CI, runs on every commit): your example scenario computes to your
Dashboard tab's values at 8+ significant figures — baseline cost $85,800; savings $66,166.89255;
GHG 104.9831739 baseline / 22.77655856 forecast; water 213,305.5011 / 95,161.94939; first-year
columns included.

**"Comparable but not the same," quantified.** Real projects run through both engines:

- On projects with no dishwasher/labor (*Total GCSR foodware*, 211 SU lines): savings and units
  match v1 to **0.0%** — proving the stored inputs translate faithfully. GHG avoided drops
  ~5–17% (your freight rule: once, on full shipped mass), water shifts with the CTGT factors,
  waste moves because 2.0 counts boxes and reusable mass. Every delta traces to a change you
  documented.
- In the app, **Chart-Reuse 2.0 mode now computes headline numbers under your model** (stamped
  v2.0), while legacy mode stays on 1.0 — the two methodologies visible side by side on the
  same project.

## 3 · QA harness → golden datasets in the product

Your example scenario is now a first-class **GoldenDataset** record (inputs + expected outputs,
tolerance 1e-6) enforced two ways:

- **In CI** — the golden spec fails the build if the engine or the data drifts from your
  Dashboard.
- **In the product** — the *Annual Projections (Methodology 2.0)* test bench: your scenario
  pre-loaded and editable, outputs recomputing live, every metric badged PASS against your
  expected values, and a **Reset to golden dataset** button. Change anything to explore;
  reset to re-verify.

And structurally: **every data product now links a golden dataset** — it's a schema field, and
the Command Center flags any product without one in red. Your validation-first instinct is now
policy.

## 4 · App-integration reference → your workflow

**Databases → Upload workbook (multi-sheet):** drop the whole spreadsheet. Every sheet matches
its database, gets a deterministic diff — *n new rows, n changed (each shown before → after),
n new columns, n rows kept* — and nothing applies until you choose which sheets and which
columns. Applying writes the changelog, bumps versions per the rules, and cuts snapshots
automatically. When you send the revised workbook, that screen is where its changes land.

---

## What the transfer surfaced in the workbook (your fix list)

Full detail in `docs/CR2-CALC-MODEL.md`. In priority order:

1. **Box-water double-count (bug).** Calc_Reuse's water formulas scope primary/secondary to
   "Reusable" but the **box term is unscoped**, and Water_Factors carries cardboard under both
   scopes — SUMIFS sums both rows: 7.389 gal/lb instead of 3.694 on reusable box mass. (GHG
   survives only because cardboard appears once there.) Our engine replicates this exactly to
   match your Dashboard, and pins the corrected delta in a test — fix the workbook, we flip one
   flag and regenerate the golden values.
2. **The 2.0 directory is missing products in live use** — real projects reference single-use
   ids 120–142 and free-text custom reusables; those lines drop out of 2.0 entirely. Extend the
   directory or define the custom-product path (this blocks migrating those projects).
3. **Where does labor go?** Additional_Costs has no category vocabulary; today's app has
   explicit labor. Projects with labor/hauling swing hard between engines until this is defined.
4. **Q-005's decision isn't implemented** — `Replaced_SU_Product_ID` is ruled but absent from
   Scenario_Reuse.
5. **Baseline hauling asymmetry** — Dashboard B5 excludes hauling while B6 carries the delta;
   savings come out right but "forecast operating cost" isn't a true operating cost.
6. **GHG_Factors header row is mislabeled** (says material|scope; data is scope|material). Our
   upload auto-repairs it with a visible tag, but swap the two header cells.
7. **Stray artifacts** — the dangling CTGT cell in Water_Factors; lowercase "Corrugated
   cardboard" row.
8. **Scope statement** for the methodology doc: bottle stations, event/actuals, per-location
   multipliers, break-even (derivable from your Initial/Recurring columns — no change needed,
   just say it).

## Decisions we'd like from this meeting

1. Box-water fix + revised workbook → we regenerate goldens the same day.
2. **Regional grid carbon intensity sign-off** (built and waiting on a branch) — the single most
   Canada-critical fix ahead of the ECCC Q4 session.
3. Water-factor authority ruling (the July question — your CTGT normalization appears to *be*
   the ruling; confirm).
4. Labor / hauling / other-expenses definition in the 2.0 model.
5. Custom products and ids 119–142: extend the directory, or define intake.
6. Methodology doc v2.0 timing — the app's stamps and snapshots are ready to reference it.

## Suggested live demo (10 minutes, in this order)

1. **Command Center** — the change-alerts feed reads as your workbook's arrival: eight tables,
   named releases, your name as the source.
2. **Databases** — open GHG Factors → Version history: `1 → 2.0`, rows, columns, source.
3. **Workbook upload** — drop her file live: every tab reads *identical*, GHG shows the
   header-repair tag. Then the punchline: when you send the fixed workbook, this same screen
   shows exactly what changed, and you choose what applies.
4. **Annual Projections 2.0 bench** — all PASS at golden; change a repurchase rate; reset.
5. **A real project** — Chart-Reuse 2.0 mode (your numbers, v2.0 stamp) vs legacy (v1.0 stamp):
   "comparable but not the same," on screen.
