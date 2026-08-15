# Chart-Reuse 2.0 — Combined Data & Calculation Model

Working notes on Madhavi's workbook *"Chart Reuse — Combined Data & Calculation Model (Draft)"*
(received 2026-08-14). The workbook is the calculation specification for the 2.0 engine; this
document records what it says, how it differs from the engine running today, the review feedback
sent back, and the plan for transferring it into the product.

**The workbook is authoritative for methodology. This document is not** — when they disagree,
the workbook (and her methodology doc) wins.

---

## What the workbook is

19 sheets in four roles, per its own README:

| Role | Sheets |
|---|---|
| Calculation spec | `Calc_SU`, `Calc_Reuse`, `Dishwashing`, `Additional_Costs`, `Dashboard` |
| Source databases | `Single_Use_Products` (118), `Reusable_Products` (80), `GHG_Factors`, `Water_Factors`, `Transport_Factors`, `Purchase_Frequency`, `Utility_Rates`, `Dishwasher_Factors` |
| QA harness | `Validation` (9 checks, all PASS), `Open_Questions` (10 items, 7 resolved) |
| App contract | `Data_Dictionary` (machine-readable field names, units, authority, requirement) |

Inputs mirror the app: SU lines carry *baseline and forecast* purchasing side by side;
reusable lines carry initial inventory + annual repurchase %; dishwashing is a separate
calculator; additional costs are generic frequency-annualized lines plus waste-hauling
monthly bills.

## What it settles — her own open QA items, now resolved by design

Every unresolved item from `docs/DATA-REVIEW-AGENDA.md` §3 has a ruling in this workbook:

- **Water factors (3a):** normalized to the CTGT boundary, per-material, scoped SU vs reusable.
  Dishwashing water is a separate operational term (Q-006).
- **Freight double-application (3c):** transport is applied **once**, to *full shipped mass*
  (product material + corrugated box), single mode: waterborne, `2.1e-8 MTCO₂e/lb-mile × 19,270 mi`.
  Marked "Approved by user 2026-08-07".
- **Box mass ignoring units-per-case (3b):** box mass is now data: `box_weight_pct_of_gross`
  per product, giving box weight per case and per item.
- **Two disagreeing weight columns (3f):** `item_weight_lbs` is *derived*: net case weight ÷ case count.
- **Product ID collisions (3e):** single directory with stable keys; duplicate-ID checks PASS.
- **Aluminium factor conflict** (found by our extraction tool): resolved by **scoping factors** —
  aluminium is `0.003755` as single-use and `0.003085` as reusable. Same pattern for all materials.
- **Gas utility rates (Q-001, her "Critical"):** state-specific EIA 2019 commercial rates converted
  to $/therm (`source × 100 ÷ 10.37`). **The engine today ships a flat `gas: 0.92` for every
  state** — her table ranges $0.70–$1.14 by state.

## The calculation model, compressed

```
SU line:      annual cases = cases/freq × frequency factor (Daily 365 / Weekly 52 / Monthly 12 / Annually 1)
              mass split:   primary = units × item_wt × (1 − secondary_%)
                            secondary = units × item_wt × secondary_%
                            box = cases × box_wt_per_case
              GHG  = Σ(mass_i × ghg_factor[scope, material_i]) + shipped_mass × transport
              water= Σ(mass_i × water_factor[scope, material_i])
              waste= shipped mass (product + box), baseline and forecast
              cost = cases × user cost/case          (DB prices are reference-only)

Reuse line:   initial units = cases × units/case;   recurring = initial × repurchase_%
              repurchase % scales EVERYTHING recurring: units, masses, transport, impacts, cost (Q-008)
              same GHG/water/transport structure, reusable-scoped factors

Dishwashing:  rack-attributable heater energy only (building + booster on High temp);
              whole-machine idle electricity EXCLUDED (Q-002, kept from legacy, flagged)
              GHG from electricity only at 1.56 lb CO₂e/kWh (Q-007); water $/1000 gal

Reporting:    ANNUAL   = recurring forecast only
              FIRST YEAR = annual + initial reusable purchase + one-time costs (Q-004)
              Dashboard sign convention: Baseline − Forecast; positive = reduction/savings
```

Structural differences from today's engine worth naming:

1. **Displacement is explicit, not derived.** The user enters forecast SU purchasing per line;
   SU reduction = baseline − forecast units. (Q-005 decided a `Replaced_SU_Product_ID` linkage
   for transport — see feedback below; the column isn't in the sheet yet.)
2. **Waste is "purchased mass"** and includes box mass — and reusables' recurring (and
   first-year initial) mass counts as waste too. Today reusables contribute 0.
3. **Annual vs first-year are separate outputs.** Today's engine mixes one-time and annual
   in places; 2.0 reports both explicitly.
4. **Secondary material is a % split of item weight**, not an independent weight column.
5. **Factors are scoped** (`Single-Use` vs `Reusable`) — same material name can carry two values.
6. **Costs are user inputs everywhere**; catalog prices are reference-only.

## Review feedback (sent to Madhavi)

1. **Bug — reusable box water factor is double-counted.** In `Calc_Reuse` water
   (`AF5`/`AG5`), the primary and secondary terms filter by scope
   (`application_scope = "Reusable"`), but the **box term does not**:
   `V5*SUMIFS(Water_Factors!$C,Water_Factors!$B,F5)`. `Water_Factors` carries corrugated
   cardboard **twice** — once under Single-Use, once under Reusable — and SUMIFS matches
   case-insensitively, so the box term sums both rows: `3.694 + 3.694 = 7.389 gal/lb`, double
   the intended factor. GHG happens to be right only because cardboard appears once in
   `GHG_Factors`. Fix: scope all three terms in every impact formula (the same unscoped box
   term exists in `Calc_Reuse` GHG `Z5`/`AA5`, currently benign but fragile).
2. **Q-005's decision isn't implemented.** The ruling says "Use `Replaced_SU_Product_ID` in
   `Scenario_Reuse`," but the sheet has no such column. Either add it or revise the ruling —
   as drafted, the workbook can't express which SU item a reusable displaces.
3. **Where does labor go?** Today's app has explicit labor costs. The workbook's
   `Additional_Costs` category column could carry a `Labor` value, but the category vocabulary
   isn't defined anywhere. Define the enum (Labor / Hauling / Equipment / Rebate / Other?) in
   the Data_Dictionary so the app can map existing data.
4. **Baseline hauling asymmetry.** `Dashboard!B5` (baseline cost) is SU purchasing only, while
   forecast cost `B6` carries `12 × (forecast hauling − baseline hauling)` as a delta. Savings
   math comes out right, but "Forecast annual operating cost" isn't a true operating cost and
   the baseline hides hauling entirely. Confirm intended, or move baseline hauling into `B5`.
5. **Stray artifacts:** `Water_Factors` has a dangling `CTGT` cell (row 28) inside the lookup
   range, and the reusable cardboard row is lowercase ("Corrugated cardboard") — harmless once
   #1 is fixed, but worth tidying since these tables become database uploads.
6. **GHG_Factors header row is mislabeled.** The headers read `material | scope` but the data
   columns are `scope | material` (column A holds "Single-Use"/"Reusable"; her own SUMIFS
   treat A as the scope). Water_Factors has it right. Cosmetic in the workbook, but it bit
   the transfer: an export trusting the headers swaps the keys. Swap the two header cells.
7. **Products in live use are missing from the directory.** Real projects reference single-use
   ids 120–142 and custom reusables with no id. Extend the directory or define the intake
   path for custom products (this blocks migrating those projects to 2.0).
8. **Scope statement.** Not in the workbook (fine, but should be said in the methodology doc):
   bottle stations, event/actuals projects, per-location multipliers, environmental break-even.
   Break-even is derivable from the Initial vs Recurring columns, so no change needed — just
   naming what 2.0's first cut covers.

## Golden scenario (from the workbook's own example)

The workbook ships worked examples: 3 SU lines (products 17, 7, 3), 1 reusable line
(product 100, 10 cases × 12 @ $2.28, 10% repurchase), CA dishwashing (Stationary Single Tank
Door, High, Energy Star, electric/electric, 365 days × 80 racks). Expected outputs:

| Metric | Baseline | Forecast annual | Reduction | First-year forecast |
|---|---|---|---|---|
| Single-use units | 1,924,000 | 780,000 | 1,144,000 (59.5%) | 780,000 |
| Waste / purchased mass (lb) | 33,644 | 8,690.75 | 24,953.25 (74.2%) | 8,758.25 |
| GHG (MTCO₂e) | 104.9832 | 22.7766 | 82.2066 (78.3%) | 22.8448 |
| Water (gal) | 213,305.50 | 95,161.95 | 118,143.55 (55.4%) | 95,377.25 |
| Cost | $85,800 | $19,633.11 | $66,166.89 savings | — |
| One-time startup | — | — | — | $22.80 |

These become the 2.0 golden dataset the moment the engine exists. (Note: the water figures
inherit bug #1 above — regenerate them from the corrected workbook before freezing the fixture.)

## Verification results (2026-08-15)

The workbook's formulas are implemented in `lib/calculator/v2/combinedModel.ts`, and the
golden spec (`lib/calculator/v2/__tests__/combinedModel.golden.spec.ts`) reproduces her
Dashboard tab **exactly — all metrics to 8+ significant figures** — when replicating the
unscoped box-water lookup, and pins the corrected behaviour's delta (precisely one duplicate
cardboard factor on recurring box mass).

Real projects through both engines (`scripts/compare-v2-projects.ts`):

- **Input mapping is faithful.** On projects with no dishwasher/labor (Total GCSR foodware),
  annual savings and SU units match v1 to 0.0% — the stored line items translate cleanly
  into the 2.0 input shape.
- **Environmental deltas match the documented changes.** GHG avoided drops ~5–17% (the
  freight double-application removed), water shifts with the CTGT factors, waste moves
  because 2.0 counts boxes and reusable mass.
- **Dishwasher and labor projects swing hard** (savings +418% to −96%): the 2.0 model has no
  labor/other-expense terms yet (feedback #3) and its dishwashing method (heater-only, $/1000
  gal water) differs from v1's. Expected, but it means financial comparisons are only
  apples-to-apples once feedback #3 is resolved.
- **NEW GAP — the 2.0 product directory is missing products in live use.** Real projects
  reference SU product ids 120–142 (the range beyond her 118-row directory: Taco Bell/custom
  products) and free-text custom reusables with no product_id at all. Those lines drop out of
  the 2.0 model entirely. She needs to either extend the directory or define how custom
  products enter it. Raised as feedback #8.

## Transfer plan

**Phase A — data first (no engine changes).** Load her factor tables through the Databases
feature as versioned reference tables: `GHG_Factors`, `Water_Factors`, `Transport_Factors`,
`Utility_Rates`, `Dishwasher_Factors`, `Purchase_Frequency`. Load the two product directories
as the 2.0 catalogs (they're keyed by the same `product_id` space, with the derived-weight
convention). This exercises exactly the machinery we built for it — selective updates,
conflict detection, provenance.

**Phase B — a v2 engine beside v1, not instead of it.** `lib/calculator/v2/` implementing
`Calc_SU` / `Calc_Reuse` / `Dishwashing` / `Additional_Costs` / `Dashboard` column-for-column,
reading factors from the loaded databases (not hardcoded constants — this finishes backlog #27
for the v2 path by construction). The workbook's column names become the trace vocabulary, so
the datasheet and calculation-inspector views map 1:1 to what she reviews.

**Phase C — golden test.** Encode the scenario above as a jest fixture (regenerated after her
bug fix) and run it in CI. Add her Validation sheet's reconciliation checks as assertions
(SU GHG = material + transport, dashboard reconciles, etc.).

**Phase D — side-by-side, then flip.** An admin toggle to compute any project under v1 and v2
and diff the dashboards ("comparable but not the same," as she says — the diffs should be
explainable by the documented changes). When she signs off, v2 becomes the default for
2.0-flagged orgs; v1 remains for legacy comparison.

**Prerequisite decision for her + Derek:** the input shape changes (explicit forecast SU
purchasing per line; secondary-% mass model; user-entered costs everywhere). Existing projects
need a migration mapping or a "recompute under v2" consent step — that's a product decision,
not a code one.
