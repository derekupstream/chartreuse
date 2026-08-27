# Chart-Reuse 2.0 — Data Science Admin Overhaul

Branch: `feat/cr2-data-admin`. Decided 2026-08-15, prompted by Madhavi's Combined Data &
Calculation Model and the platform-architecture review.

## The organizing principle

The admin stops being a list of tools and becomes the stack it manages:

```
DATA ──────────────── Reference databases (products, factors, rates) · versioned releases
   ↓
STANDARDIZATION ───── Common data model · data dictionary · RSP terminology mappings · validation
   ↓
INTELLIGENCE ──────── Methodology · factors · calculations · models        (Upstream IP)
   ↓
DERIVED DATA ──────── Computed results: return rates, cost/use, GHG, water, waste, ROI
   ↓
PRODUCTS ──────────── Calculators (projections) · dashboards (actuals) · benchmarks · reports · API
```

Governance — lineage, quality checks, change history, permissions — runs vertically through
every layer rather than being a page of its own.

The mental model shift, verbatim from the review:
*fragmented reuse data → standardized reuse data → trusted calculations → comparable
performance → industry intelligence.* The "What if you switch to reusables?" dashboard stays
exactly what it is — one experience on top of the platform, no longer the product itself.
Target evolution for a project's views: **Projection | Actuals | Benchmark | Methodology**.

## Three kinds of data, kept explicitly separate

| Category | What | Examples | Control |
|---|---|---|---|
| **Reference / market data** | What Chart-Reuse needs to understand the world | Product directories, GHG/water factors, utility rates, dishwasher specs, transport assumptions | Upstream-maintained, versioned releases |
| **Provider / project data** | What users and organizations contribute | Line items, RSP usage periods, costs, program observations | Provider-controlled; provenance always visible ("Provided by RSP X via API on …") |
| **Derived data** | What Chart-Reuse computes from the two above | Return rate, cost/use, GHG, waste, water, ROI; later: cohort medians, benchmarks | Upstream-managed; access governed by agreement |

The emerging fourth asset, once RSP data accumulates: the **Reuse Operations Dataset** —
standardized observations across programs (sector, model, geography, size, distributions,
returns, washes, losses, costs, impacts). Reference data explains context; RSP integrations
supply observations; models determine meaning; benchmarking turns observations into knowledge.

## Data-rights framing (for counsel, not for code)

Do **not** build policy around "Upstream owns all resulting data." The defensible structure:

- Providers **retain ownership/control of source data** they contribute.
- Upstream **retains IP** in the software, methodologies, models, calculation logic,
  taxonomies, data structures, and benchmarking methodologies.
- Providers **grant defined rights** to process their data and create derived, anonymized,
  aggregated outputs for stated purposes.
- Rights to **derived and aggregated data are defined separately**.
- Counsel should define the terms: *Source Data, Derived Data, Aggregated Data, Benchmark
  Data, Upstream IP, Output Data*. (US copyright protects original selection/arrangement of a
  database, not facts; methods aren't protected merely as methods — the agreements carry the
  weight.)

The value exchange to present: a provider isn't "giving Upstream their database"; they're
allowing Chart-Reuse to process operational data, and receive standardized calculations,
reports, benchmarking and insights in return.

## Menu: 15 entries → 6

| New | Contains | Old entries absorbed |
|---|---|---|
| **Overview** | The layered stack, live counts, links | Overview (rebuilt) |
| **Databases** | Reference tables, upload/merge, **version history (new)**, AI uploader linked in-page | Databases, AI Data Uploader |
| **Methodology** | Hub: Factors, Change Requests, Snapshots, Methodology doc | Factors, Change Requests, Snapshots, Methodology |
| **Data Products** | Hub: Designer, Calculations (smart fields), Data Products, Functions | Data Product Designer, Calculations, Data Products, Functions |
| **Quality** | Hub: Test Runs + Golden Datasets, Run History (Calculation Log) | Test Runs, Run History |
| **Data Map** | System/lineage/trace views (governance made visible) | Data Map, Lineage |

Removed outright: **Inputs** (superseded by Data Map + project datasheet), **Lineage** (folded
into Data Map; duplicate `LINEAGE_MAP` cleanup remains backlog #33), **Impact Simulator**
(deleted — computed nothing; backlog #34 closed by deletion).

Old routes remain reachable — hubs link to them; nothing 404s. Deletion of the page files
themselves (vs. de-listing) happens only for the Impact Simulator on this branch.

## Workbook-tab navigation mapping (decided 2026-08-16; revised 2026-08-27)

The Data Science nav follows the Combined Model workbook, one button per **working surface**
(Derek's second-pass correction: tabs group into surfaces rather than each becoming a button):

| Workbook tab | Where it lives | Manifestation |
|---|---|---|
| README | Dashboard (how-to panel) | Collapsible on the Command Center |
| Dashboard (+ Scenario_SU, Scenario_Reuse, Dishwashing, Additional_Costs) | Annual Projections | The Annual Projections 2.0 product/bench — those tabs ARE its input panels |
| Calc_SU, Calc_Reuse | (inside Annual Projections) | `lib/calculator/v2/combinedModel.ts` — the computed columns behind the bench |
| Single_Use_Products, Reusable_Products | **Databases → Products group** | Full-page editable spreadsheets (`databases/[id]`): compact grid, always-visible horizontal scroll, color-coded columns, cell inspector showing the Data Dictionary meaning + the exact model math, batch edits that changelog and version themselves |
| GHG/Water/Transport/Dishwasher Factors, Utility_Rates, Purchase_Frequency | **Databases → Factors group** | Same spreadsheet surface; factor edits auto-bump the data version and cut a methodology snapshot |
| Funding_Opportunities | **Databases → Other group** | 121 municipal funding rows (2026-08-16 revision) — a database, not a menu item; future frontend filtering + funding calculations |
| Data_Dictionary | **Data Dictionary page** | A readable reference page (not a spreadsheet, not a popup), rendered from the loaded database — searchable, authority-tagged |
| Validation | **Validation tool** | `quality.tsx`: her 9 Validation-tab checks *executed* against live tables (duplicate keys, factor sanity, reconciliation identities) + the 15 Dashboard metrics recomputed vs the workbook. Verdicts are computed, never stored; same checks pinned in CI (`validationChecks.spec.ts`) |
| Open_Questions | (removed from nav) | Derek is clarifying its purpose with Madhavi; data preserved, reachable via Advanced → All Databases |

**Methodology** is literal versions: 1.0 (legacy engine, production, projects pinned) and 2.0
(Combined Model) side by side, each with its database versions, plus the append-only change
log and auto-cut snapshots (`methodology-hub.tsx`).

**Advanced dropdown** — app features with no workbook counterpart, each annotated:

| Tool | Verdict |
|---|---|
| Data Products & Designer | **Future roadmap** — the Studio (calculators/dashboards/scenarios) is the product platform; Annual Projections is its first instance |
| All Databases | Convenience view (`?all=true` — everything stored, incl. page-backed tables) |
| Smart Fields | **Future** — feeds the Studio's Logic stage; parked (backlog #37 → Studio spec) |
| Functions | **Useful** — lowest-level engine view; keep for audits |
| Data Map | **Useful** — lineage/traceability, governance visual |
| AI Data Uploader | **Useful** — the AI mapping layer over the workbook-upload flow (Studio spec: AI Uploader) |
| Snapshots | **Useful** — methodology versioning backbone (auto-cut; rarely visited directly) |
| Calculation Log | **Useful** — run audit trail |
| Inputs, Lineage, Pipeline (unlisted) | **Redundant** — superseded by Datasheet/Data Map; candidates for deletion after 2.0 ships |

## Database versioning (the "builds for data" piece)

Precedent: ecoinvent 3.x, DEFRA annual factor editions, EPA WARM versions — named releases,
documented changes, results stamped with the release that produced them.

This branch ships the foundation:

- `FactorDatabaseChange` — append-only changelog per database: action, version before/after,
  rows added/updated/removed, columns touched, source description, actor, timestamp.
- Every upload/merge **auto-bumps** `FactorDatabase.version` and writes a change row. The merge
  engine already computes this diff; now it's kept.
- Database detail page grows a **History** panel.

Later phases (not this branch): named cross-database releases ("Data Release 2026.08") built on
`MethodologySnapshot`, release stamps on live projection dashboards, per-project methodology
version + consent-based upgrade flow (see `docs/CR2-CALC-MODEL.md`, transfer plan).

## Sequence on this branch

1. This document.
2. `FactorDatabaseChange` migration + auto-bump + history panel.
3. Menu restructure + Methodology/Quality/Data Products hub pages + delete Impact Simulator.
4. New layered Overview page.
5. Type-check, tests, screenshot review, then PR back to `main`.
