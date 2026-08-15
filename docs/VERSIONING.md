# Chart-Reuse Versioning — Definitions

How methodology and data are versioned, what bumps what, and how projects pin to versions.
Precedent: ecoinvent's annual releases (3.9, 3.10) with change reports, DEFRA's yearly GHG
conversion factor editions with changelogs, EPA WARM (v15, v16). The common contract: **data
ships as named releases, changes between releases are documented, and every result records
the release that produced it.** That last clause is what makes a number citable years later.

## The version number: MAJOR.MINOR.PATCH

One version describes the **methodology + data pair** a calculation runs under.

| Segment | Bumps when | Example | Who decides |
|---|---|---|---|
| **MAJOR** | The calculation method changes — formulas, boundaries, what's included. Results are *expected* to differ. | 1.0 → 2.0: Combined Model (freight once on full shipped mass, CTGT water, scoped factors, waste includes boxes + reusables) | Data science sign-off (Madhavi) + product |
| **MINOR** | Factor *values* change within the same method — annual rate refreshes, a corrected emission factor, a new data source for an existing factor. | 2.0 → 2.1: EIA publishes new utility rates | Data science; auto-proposed by a factors-table upload |
| **PATCH** | A correction that shouldn't change intent — fixing a transcription error, a mislabeled unit, one bad cell. | 2.1 → 2.1.1: the box-water double-count fix | Whoever uploads, recorded in the changelog |

What does **not** bump anything: reference data growing. Adding products to the directories,
new states/provinces in context tables, new dishwasher models — `kind: 'reference'` tables
change without moving the version, though every upload still writes a changelog entry.

## How it's enforced in the product (all shipped on `feat/cr2-data-admin`)

- **Per-table changelog** (`FactorDatabaseChange`): every upload — who, what rows, which
  columns, from what source. Append-only.
- **Kind-aware bumping**: `kind: 'factors'` tables auto-bump on change; `kind: 'reference'`
  don't. An explicit version on an upload always wins (that's how a named release is cut).
- **Automatic methodology snapshots**: any factors-table change cuts a `MethodologySnapshot`
  capturing *every* database's version at that moment (`databaseVersionsJson`). Snapshots are
  the branches: a complete, immutable record of what "2.0" or "2.1" meant, forever.
- **Per-project pin** (`Project.methodologyVersion`): every project carries the version its
  numbers were computed under. It does not move until the owner (or Upstream) upgrades it —
  a cited number never changes silently. Back-versioning a project = re-pinning it to an
  older snapshot and recomputing (the v2 engine reads tables, so this is mechanical).
- **The visible stamp**: project dashboards and public share pages carry the citation line —
  *"Calculated with Chart-Reuse Methodology v1.0"* — the same way an LCA study cites
  "ecoinvent 3.10".

## Upgrade policy (agreed 2026-08-14)

New projects start on the current version. Existing projects keep their pinned version and
results until explicitly upgraded, with a before/after diff shown at upgrade time. The golden
dataset for each MAJOR version (2.0's comes from the Combined Model workbook and is enforced
in CI) is what makes an upgrade trustworthy: the new engine provably implements the new
methodology before any project moves onto it.

## Current state

- **Methodology 1.0** — the running engine, compiled factors. All existing projects are
  pinned here, and it is a real branch: the "Methodology 1.0 — legacy engine" snapshot
  captures its 24 material factor sets, engine constants, and known characteristics verbatim
  (cut by `scripts/snapshot-methodology-1.ts`), so 1.0 is reconstructible without git
  archaeology.
- **Data Release 2.0** — Madhavi's Combined Model tables, loaded and snapshotted; the 2.0
  calculation model implemented and verified against her workbook exactly. Awaiting: her
  fixes (box-water scoping, directory gaps), the labor/hauling definition, and the v2 engine
  wiring before any project pins to 2.0.
