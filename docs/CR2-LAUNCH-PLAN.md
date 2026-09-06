# Chart-Reuse 2.0 — Positioning & Launch Plan

Target: **public launch week of January 11, 2027.** Beta and stabilization run Q4 2026.
Written 2026-09-06. Owner: Derek. Companion docs: `ROADMAP.md` (what the product is),
`BACKLOG.md` (open work), `CR2-CALC-MODEL.md` (methodology 2.0), `VERSIONING.md`
(data releases), `CR2-MADHAVI-REVIEW.md` (sign-off agenda).

---

## 1. What Chart-Reuse 2.0 is

**One sentence:** Chart-Reuse 2.0 turns the calculator into a *governed data platform* —
every number a projection shows can be traced to a named, versioned, source-attributed
database row, and the person who owns the methodology can change those numbers herself,
with a changelog, without a developer.

**The pitch, one level down:**

- **The methodology is a product, not a hardcode.** Methodology 2.0 was built directly
  from the data scientist's Combined Model workbook and is golden-tested against it —
  the app reproduces her Dashboard to the penny (17/17 scenario metrics reconcile,
  verified in CI on every commit). When she updates the model, the update ships as a
  *versioned data release*, not a code deploy.
- **Data has provenance.** Databases (factors, products, rates) live in the app as
  editable, versioned tables with source files attached, cell-level formulas, and an
  append-only changelog. Collections version together (v2.0 → v2.1 → v3) and restore
  exactly.
- **Trust is inspectable.** Every projection carries a methodology stamp saying which
  version computed it. Calculation inspection shows the math behind a number. A
  validation suite executes the workbook's own model-control checks — real formulas,
  not copied PASS/FAIL labels.
- **A governance loop closes.** Data-health notifications → change requests (with
  database-cell references) → spreadsheet edits (with reasons) → changelog entries
  (stamped with the change request ID) → the request auto-resolves. Findings become
  auditable changes.
- **Canada is real.** Provincial electricity rates from the Hydro-Québec 2025 study
  (documented value-by-value), country-aware region pickers, and provincial grid carbon
  intensity built and awaiting sign-off. The ECCC partnership supplies what remains.
- **Partners push data in.** The RSP API lets reuse service providers report actual
  usage against client accounts, with dry-run testing and payload warnings.

## 2. Who it's for

| Audience | What 2.0 gives them | Proof point |
|---|---|---|
| **The data scientist** (Madhavi) | Owns the model in-app: edits factors, cuts releases, runs validation, reviews change requests. No developer in the loop. | Her workbook *is* the golden dataset; the Scenario Dashboard project reproduces it end-to-end. |
| **Institutional users** (ECCC, TEA, Berkeley, StopWaste) | Citable numbers: methodology stamps, source attribution, versioned data they can reference in policy and funding documents. | ECCC references Chart-Reuse in five-year renewal docs; TEA's 2025 questions were all "show me the assumptions." |
| **Reuse service providers** (Sharewares, 99Bridges) | An API to report actuals; dashboards their clients trust. | RSP intake verified by a 23-check suite; beta October 2026. |
| **End organizations** (venues, restaurants, schools) | Same easy calculator, now with numbers that can answer "why?" — and Canadian presets. | Projection UX unchanged; 2.0 runs under it. |
| **Funders** | A defensible methodology with version history — the difference between "a calculator" and "an instrument." | Validation suite + golden CI + changelog. |

## 3. How it's different from Legacy 1.0

| | Legacy 1.0 (live today) | Chart-Reuse 2.0 |
|---|---|---|
| Where numbers live | Hardcoded TypeScript constants | Versioned databases with source files and changelogs |
| Changing the model | Developer edits code, deploys | Data scientist edits cells/formulas; cuts a release |
| Methodology | Implicit, undocumented drift from the source workbook | Versioned (1.0 / 2.0), stamped on every projection, golden-tested against the source workbook |
| Trust | "Trust us" | Inspect the calculation, read the source, see the version |
| Geography | US-only rates, one flat grid factor | Canadian provincial rates; regional grid intensity (built, pending sign-off) |
| Data intake | None | RSP API (partners push actuals), workbook upload with diff-and-choose, AI import |
| Governance | Chat threads and memory | Notifications → change requests → edits → changelog, all linked |
| Rollback | Git only | Data releases restore exactly (v2.0 is the first cut) |

**What does NOT change at launch:** the projection-building UX end users know, existing
projects (they stay pinned to methodology 1.0 — numbers never move under anyone), and
pricing (free; tiering is post-launch, backlog #30b).

## 4. What "launch" means (January 2027)

1. `chartreuseV2` is merged and live on production.
2. **New projects default to methodology 2.0**; existing projects stay pinned to 1.0
   with an opt-in upgrade path (a project owner can re-pin and compare).
3. The Data Science admin (databases, releases, validation, change requests, Command
   Center) is production reality for Upstream staff.
4. Canadian presets are announced as a launch feature.
5. A public announcement: positioning above, aimed at institutional users and partners.

**Not in the January launch** (deliberately): Product Studio phases 3–6 (scenario
comparison — the ECCC paid-contract candidate, built after launch on 2.0's foundation),
French localisation (Official Languages scope belongs in the ECCC contract conversation,
backlog #19), paid tiers/entitlements (#30b), adjustable end-of-life pathways, and the
reuse-service project type (TEA's "dream feature" — post-launch with RSP learnings).

## 5. The plan

Four months, five milestones. The critical structural fact: **there is one production
environment and `main` auto-deploys**, so beta does not get its own server — we
dark-launch: merge early behind the gates that already exist (`Org.isUpstream` for the
admin; per-org/per-project methodology flags for 2.0), then widen access org by org.
That makes December a *stabilization* month, not a *migration* month.

### M0 — Scope lock & methodology sign-off (Sept 7 – Oct 2)

The launch is gated on Madhavi more than on code. Book her time now.

- **Madhavi sign-off session** (the standing agenda: `DATA-REVIEW-AGENDA.md` +
  `CR2-CALC-MODEL.md` feedback items #1–12). Decisions needed from her:
  - Regional grid factors (`feat/regional-grid-factors`, built + held) — ship or hold past launch.
  - Workbook fixes she owns: box-water term (#1), GHG header swap (#6), stale Dashboard
    cache (#10), $2.28/case price (#12). None block launch — the product runs her model
    workbook-faithfully and her corrections ship later as versioned data changes — but
    each needs an explicit "known, deferred" or "fix now."
  - Definitions 2.0 lacks: labor (#3), detail-table decompositions (#11), products
    120–142 + custom reusables (#7). Decide: define now, or launch with the documented
    1.0 fallback for detail views.
- **Fix P0 bugs #1–5** (`BACKLOG.md`) — all five affect beta users directly; #4
  (CAD currency guard) specifically blocks Canadian beta testing.
- **Refresh BACKLOG.md statuses** — items 7, 8, 12 predate the v2 engine (the golden
  dataset now passes in CI); stale statuses will misdirect Q4 triage.
- Add TEA quick wins (catalog items, Resource Link surfacing) so beta invitations to
  Emily land with proof, not promises.

**Exit gate:** Madhavi has signed off methodology 2.0 for beta, P0s are fixed, and the
launch scope questions above each have a written answer.

### M1 — Dark launch to production (Oct 5 – Oct 16)

- Tag `main` as a restore point (pattern: `chartreuse-legacy-v1.0`).
- Apply the **9 pending migrations** to production via the direct connection (5432)
  **before** merging — the standing rule: migration lands, then code.
- Merge `chartreuseV2` → `main`. 2.0 stays invisible: admin is `isUpstream`-gated,
  methodology 2.0 enabled only for flagged orgs.
- Run the full verification ladder against production (`REVIEW-PROTOCOL.md` layers
  A–E; the 35-check runtime suite pointed at prod).
- **RSP API beta begins** (Sharewares, 99Bridges — already scheduled for October).

**Exit gate:** production runs the merged branch for a week with no 1.0 regressions —
legacy users see nothing.

### M2 — Beta wave 1: friendlies (Oct 19 – Nov 13)

- **Madhavi is beta user #1**: she runs the full loop for real — edit a factor, cut a
  release, review a change request, check validation. Her friction list is the highest-
  value bug report we will get.
- External friendlies, flagged into 2.0: **TEA** (Emily — Canadian presets + her 2025
  requests addressed), **Berkeley** (Zohe — catalog fixes #20–22 land here).
- Structured beta ask per tester: build one real project on 2.0, compare against what
  they expect, file everything through in-app change requests (which the governance
  loop was built for — beta feedback becomes traceable work items automatically).
- Weekly triage: bug / data question / post-launch idea. Bugs fixed in the wave;
  data questions go to Madhavi's queue; ideas go to BACKLOG.

**Exit gate:** ≥3 external projects built end-to-end on 2.0 without staff intervention;
no open P0s from the wave.

### M3 — Beta wave 2: institutions (Nov 16 – Dec 11)

- **ECCC Q4 working session** ("Canadianize Chart-Reuse", with A-P) lands inside this
  window by design: co-build the Canadian template (#18), onboard ECCC as a versioned
  data supplier (#19a — their gas/water rates close backlog #16 as an *ECCC-attributed
  release*, the flow's first external proof), raise French scope for the contract (#19).
- **StopWaste** joins beta (schools back end est. complete end of 2026 — aligned).
- Minimal **#19c transparency**: institutional account owners get read access to the
  methodology stamp detail and calculation inspection for their own projects — the
  feature both ECCC and TEA independently asked for, and the launch story's spine.
- Second fix wave; anything not fixable by freeze gets triaged to post-launch or
  documented as a known limitation.

**Exit gate:** an institutional user has produced a citable projection (stamp + sources)
from their own account, and says so.

### M4 — Freeze, rehearsal, launch prep (Dec 14 – Jan 8)

- **Code freeze Dec 11.** Bug fixes only; every fix runs the full review protocol.
- Launch-readiness checklist (below) walked twice — once Dec 14–18, once Jan 4–8
  (the holiday gap is deliberate buffer; nobody ships Dec 24).
- Content: user guide updated for 2.0, the "what's new" announcement, partner-facing
  notes (RSP docs already exist), the upgrade-path explainer for existing projects.
- Decide and script the flip: new projects default to 2.0 (one config change, rehearsed
  in beta orgs first).

### Launch — week of January 11, 2027

- Flip the default. Announce. Watch the Command Center's data-health band and error
  rates daily for two weeks.
- Post-launch queue, pre-ordered: Product Studio scenario type (ECCC contract), French
  scope, EOL pathway scenarios, reuse-service project type, tiering.

## 6. Launch gates (go/no-go, checked at M4)

1. Golden dataset green in CI; validation suite green; 35-check runtime suite green
   against production.
2. Madhavi's written sign-off on methodology 2.0 (with the known-and-deferred workbook
   items listed).
3. All nine migrations applied and verified in production; restore tag exists.
4. Zero open P0s; every known limitation documented in the user guide.
5. Beta exit gates from M2 and M3 met.
6. Existing projects verified unchanged (spot-check a sample of the 291 production
   projects: 1.0 numbers identical pre/post merge).
7. Rollback rehearsed: the flip is reversible without a deploy.

## 7. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| **Madhavi's availability** — 6+ backlog items and the sign-off gate all route through her | High | M0 books the session now; workbook-faithful engine means her *fixes* never block (they ship as data releases later); triage her queue to "blocks launch" vs "blocks nothing" |
| **Single production environment** — beta users and legacy users share one deploy | Medium | Dark-launch early (M1) so merge risk is spent in October, not December; restore tag; migrations-before-code rule |
| **Beta recruitment slips** — partners are slow in Nov/Dec | Medium | Wave 1 is friendlies already asking for follow-up (TEA, Berkeley); ECCC session is already planned; RSP beta already scheduled |
| **Scope creep from beta feedback** — good ideas arriving in November | High | The change-request loop captures ideas without committing to them; freeze date is the answer to everything after Dec 11 |
| **Canadian gaps embarrass the Canada story** — gas/water still US placeholders | Medium | Say it plainly in-product (source_status already does); ECCC session targets exactly this; worst case the launch story is "Canadian electricity + more coming with ECCC" |
| **Holiday compression** — Dec is short | Certain | Freeze is Dec 11, not Dec 31; January week 1 is the second checklist pass, not new work |

## 8. Open questions for Derek (decide during M0)

1. Does the January announcement include a public marketing moment (site refresh, post,
   partner co-announcement with ECCC?) or is it a quiet default-flip + email to users?
2. Do the Single-use / Reusable detail views stay 1.0-computed at launch (current,
   documented behavior) or does #11 get defined in time?
3. Is `feat/regional-grid-factors` in the launch (needs Madhavi sign-off) — it is the
   strongest single "2.0 is more accurate" proof point.
4. Beta invitation list final call: TEA, Berkeley, ECCC, StopWaste, + Sharewares/
   99Bridges on RSP. Anyone else (Seattle? Eugene?)
