# Backlog

Single list of open work. Add to this rather than relying on chat history.

Detail lives in companion docs where noted:
- `docs/DATA-REVIEW-AGENDA.md` — methodology questions needing data-science sign-off
- `docs/DATA-SCIENCE-TOOLS-PLAN.md` — admin tool consolidation plan
- `docs/ROADMAP.md` — what the product is today
- `CHANGELOG.md` — what has shipped

Status key: **open** · **blocked** (waiting on someone) · **built, held** (code exists, not released)

Last updated 2026-07-21.

---

## P0 — Bugs affecting users now

| # | Item | Notes |
|---|---|---|
| 1 | **Invite code grants org-admin to anyone who uses it** | `pages/api/user/register.ts` assigns `ORG_ADMIN` on every creation path, including join-by-invite-code. Harmless when the role was cosmetic; now it gates Organizational Settings, the member list, the invite API and the product catalog. A shared code hands out admin rights. The join-*request* path correctly creates a member. **open** |
| 2 | **"Actuals" silently becomes a Projections project** | `pages/api/projects/index.ts` forces `category` to `default` when the org lacks the event feature flag (on for only 4 orgs). A normal user picks Actuals, gets Projections, sees no error. Either gate the card or surface the limitation. **open** |
| 3 | **Actuals projects can be invisible on /dashboards** | The Actuals/Projections cards set `category`, but `/dashboards` filters on `dataType`, which comes only from a URL parameter. Arriving from `/projects` and clicking Actuals produces a mismatched project the Dashboards list won't show. **open** |
| 4 | **Canadian rates are in CAD with no currency guard** | Provincial electricity rates are C$/kWh but nothing checks `Org.currency` (defaults to USD), so a Canadian project in a USD org mixes currencies in its financials. Introduced with the Hydro-Québec rates. **open** |
| 5 | **Product ID collisions 111–118** | The upstream and Taco Bell catalogs are concatenated and both define IDs 111–118 as *different products* (115 = 8" pizza box vs paper chip bag). Upstream currently wins, but a line item saved against a Taco Bell product resolves to an upstream one — wrong material and weight while counts and costs stay right. See agenda §3e. **open** |

## P1 — Calculator correctness (data science)

Full detail in `docs/DATA-REVIEW-AGENDA.md` §3. A golden dataset from Madhavi's spreadsheet exists and currently fails; the failing diff is the review artifact.

| # | Item | Notes |
|---|---|---|
| 6 | **Shipping-box mass ignores units-per-case** | Projections path uses catalog box weight per case × the user's case count. The event path already does it per item, and the catalog has a per-item column. Pure code fix, no data debate. Agenda §3b. **open** |
| 7 | **Water factors differ from the source databases** | Every material differs, 1.6–3.1×. Water is ~33% low. Needs a ruling on which set is authoritative. Agenda §3a. **blocked** — Madhavi |
| 8 | **Ocean freight applied twice** | Added to product mass *and* box mass; her spreadsheets have no freight for single-use. Drives GHG ~15% high. Agenda §3c. **blocked** — Madhavi |
| 9 | Clamshell (id 9) case count: 500 (our CSV) or ~75 (her data)? | Agenda §3d. **blocked** — Madhavi |
| 10 | Confirm ketchup aluminium lining factors | Agenda §3c. **blocked** — Madhavi |
| 11 | Catalog has two disagreeing weight columns per row | `primaryMaterialWeightPerUnit` is recomputed rather than read. Agenda §3f. **blocked** — Madhavi |
| 12 | **Golden dataset into CI** | Once green, keep it running so this can't regress. **open** |
| 13 | Waste-hauling "add-back" retest | Math traces clean; the misleading tooltip is fixed. Needs her project ID to close. **blocked** — Madhavi |
| 14 | Her "one small error" in financials | Unspecified in her notes. **blocked** — Madhavi |

## P1 — ECCC / Canada

| # | Item | Notes |
|---|---|---|
| 15 | **Regional grid carbon intensity** | EPA eGRID + CER/ECCC provincial factors replacing one flat continent-wide number. **built, held** on branch `feat/regional-grid-factors` pending sign-off. Also corrects a factor ~2× today's US average. Agenda §3. |
| 16 | Canadian gas and water rates | Still US placeholders for all provinces. **open** |
| 17 | Canadian (CAD) product pricing | A-P's ask; ECCC offered to supply the data. Extends the per-org catalog work with regional prices. **open** |
| 18 | Canadian / ECCC project template | Co-build on the call: province default, CAD, their typical foodware. **open** |
| 19 | French localisation | Official Languages requirements are likely for a federal deployment. Flag in contract scope rather than absorb. **open** |

## P2 — Berkeley (Zohe)

| # | Item | Notes |
|---|---|---|
| 20 | **6–7" ceramic plate missing from catalog** | Catalog has 5" and 9" only. Sourcing method agreed in agenda §2. ~20 minutes. **open** |
| 21 | **Un-gate recycled stainless / aluminium** | Factors exist; hidden by `UPSTREAM_ONLY_MATERIALS`. One line, but the water values look suspect (recycled shows 2.2× the water of virgin). **blocked** — Madhavi |
| 22 | Full-catalog browse in the projections picker | The Actuals picker was fixed; the advanced cascade still hides products (she never found the 16oz mug that existed). **open** |
| 23 | Per-product virgin/recycled toggle | Deeper LCA comparison than material choice alone. **open** |
| 24 | Community-level transition modelling | Not the old per-business "% takeout" field — policy scenarios ("all coffee shops shift 10%"). Maps onto Scenarios. **open** |

## P2 — Product / features

| # | Item | Notes |
|---|---|---|
| 25 | **Timeline: show all costs even without break-even** | Madhavi's request. **open** |
| 26 | **Timeline: per-OPEX/CAPEX breakdown** | So businesses can target savings and funding. **open** |
| 27 | **Factor edits reaching the engine** | Calculators read hardcoded constants; the Factor library is record-keeping only. The largest piece of real work, and it unblocks annual data refreshes without a deploy. **open** |
| 28 | Bulk factor "database" import | Madhavi wants to load whole datasets grouped as they are in Drive. **open** |
| 29 | Schools calculator as a data product | Her initiative; mostly support and unblock. **open** |
| 30 | Datasheet: event foodware rows | Covers single-use, reusables, dishwashing and costs; event foodware items aren't shown yet. **open** |
| 30a | **RSP impact factors are placeholders** | `RSP_IMPACT_FACTORS` in `lib/rsp/impactFactors.ts` is ten hardcoded per-item values with no provenance, unconnected to the Factor Library or the main engine — so every number the intake API returns to a partner, and everything downstream on their customers' dashboards, is provisional. Needs real factors and a source. Blocking before RSP results are shown to a funder. **open** |

## P3 — Admin tool consolidation

Detail in `docs/DATA-SCIENCE-TOOLS-PLAN.md`.

| # | Item | Notes |
|---|---|---|
| 31 | Link the Datasheet from Data Map and failing Test Run rows | **open** |
| 32 | Delete the Pipeline page | Superseded, already out of the menu. **open** |
| 33 | De-duplicate `LINEAGE_MAP` and fold Lineage into Factors | Two copies exist and have already diverged. **open** |
| 34 | Fix or remove the Impact Simulator | It computes nothing today — it echoes your percentage change back. Rebuild on the real engine or delete. **open** |
| 35 | Rename Run History → Calculation Log | Removes the collision with Test Runs. **open** |
| 36 | Data Products Designer as the general "see the code" surface | Needs a calculator-function node kind, engine instrumentation, and to keep the substituted-expression string the evaluator already builds and discards. **open** |
| 37 | **Finish the Data Product Designer / Calculations (Smart Fields) page** | Shipped but not right yet — parked 2026-08-05. What exists: smart-field library with search + category chips, equation pills with click-to-source, variable picker, detected requirements, and dashboard cards that open the equation behind a number. What still feels wrong is the overall shape — the split between Calculations (smart fields), Data Product Designer, and Functions is three surfaces for one job, and the builder doesn't yet let you go from an equation to a saved, engine-backed output. Revisit as a whole rather than patching pieces. **open** |

## P3 — Cleanup

| # | Item | Notes |
|---|---|---|
| 37 | Delete orphaned `lib/inventory/single-use-products-data.csv` | 111 rows, read by nothing; misleads anyone auditing product data. **open** |
| 38 | Dead Firebase auth pages | `pages/invite-member.tsx` and `pages/edit-member-profile/[id].tsx` still use `verifyIdToken`; broken since the Supabase migration. Delete or migrate. **open** |
| 39 | `pages/projects/[id]/select-template.tsx` is a stub | Renders the literal text "select a template". **open** |
| 40 | Duplicate API route | `pages/api/admin/compute-runs.ts` and `compute-runs/index.ts` both resolve to the same path (dev-server warning). **open** |
| 41 | Dishwashing step says "state average" for Canadian provinces | Copy fix. **open** |
| 42 | Import empty-state copy shown to everyone | Tells all users to "Import from Excel" but the button is Upstream-only. **open** |
| 43 | Delete the four superseded docs | Currently carrying deprecation banners. **open** |
| 44 | Rewrite `docs/user-guide.md` | 9 of 12 substantive claims are wrong (signup flow, Edit button, sharing, US-only rates, Projections-only wizard). Corrected text exists from the audit. **open** |
| 45 | Update `docs/ROADMAP.md` | Missing this week's work; add a forward-looking section. **open** |
| 46 | Local DB migration history drifted | Thinks ~70 migrations are unapplied; the catalog-settings column was applied directly. Worth an untangle session. **open** |
