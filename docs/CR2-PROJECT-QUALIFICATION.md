# Project Qualification & Adaptive Tabs — Gap Analysis and Design

**Status: proposal (2026-09-25).** Nothing in this document is built yet.

This document does three things:

1. Compares what a Chart-Reuse project collects today against the **Reuse Case Studies
   Database** record structure (the "Upstream Reuse Case Studies Database.xlsx" workbook,
   156 case studies), field by field.
2. Designs the **up-front qualification questions** a user answers when creating a project —
   "are you doing reuse for onsite dining, operating a reuse system, working with an RSP?" —
   and how those answers reshape the project's tabs.
3. Specifies the two new pieces of wizard surface those answers unlock: the
   **"RSP provides the containers" toggle** on the Reusables tab, and a new **RSP Service tab**
   (cost per wash, place setting, customers per day, wash-hub distance).

The goal underneath all three: **one shared vocabulary** so that a Chart-Reuse project, a
case-study record, and an RSP API submission describe the same program the same way — and can
therefore be compared, aggregated, and published together.

---

## 1. What a Chart-Reuse project collects today

Three sources feed a project's data. Knowing exactly what each one holds is the baseline for
the gap analysis.

### 1a. At creation / in Project Settings (`ProjectForm.tsx`, `Project` model)

| Question today | Stored where |
| --- | --- |
| Actuals vs Projections (card picker) | `Project.category` (`event` / `default`) |
| Project Name | `Project.name` |
| Project Type — Cafe/Cafeteria, Kitchenette/Employee Breakroom, Event, Coffee Shop, Fast Casual Restaurant, Food Hall Stand, Other | `Project.metadata.type` (JSON) |
| Account | `Project.accountId` |
| Project Location (Places autocomplete → city/state/country/lat/lng) | `Project.location` (JSON) |
| Tags | `ProjectTagRelation` |
| Utility rates — US state / Canadian province, or custom electric/gas/water | `Project.USState` / `Project.utilityRates` |
| Event projects only: date or date range | `Project.dateType/startDate/endDate` |

The metadata type also has room for "Where food is prepared" (On-Site / Off-Site / Both) and a
dishwashing-type descriptor, and the model carries `eventGuestCount`, `budget`, and
`singleUseReductionPercentage`.

### 1b. In the wizard tabs (line items)

Single-use purchases (baseline + forecast), reusable purchases (with a Return Rate % that
drives annual repurchase), dishwashers (machine type, temperature, energy-star, racks/day,
operating days), labor costs, other expenses, waste hauling, and truck transportation
(`TruckTransportationCost.distanceInMiles` — a bare one-way mileage figure used for
reusables-delivery GHG in `getTransportationGHG.ts`).

### 1c. Computed outputs (not asked — derived)

Cost savings, one-time investment, payback / break-even, GHG reduction, water saved, waste
diverted, single-use items avoided. Under Chart-Reuse 2.0 every one of these carries a
methodology version and a factor-level provenance trail (the calculation inspector).

### 1d. RSP API ingestion (`POST /api/rsp/usage`, `docs/RSP-API.md`)

Per client per period: `reusable_type`, `out_warehouse_events` (drives impact),
`in_warehouse_events` (return-rate reporting). Returns co2/water/waste/single-use-equivalent
metrics from the (still hardcoded — backlog 30a) `RSP_IMPACT_FACTORS`.

---

## 2. Gap analysis — case-study record vs what we collect

Legend: ✅ collected · 🟡 partially / derivable · ❌ not collected.
"Proposed home" says where the field should live once we standardize.

### 2a. Metadata

| Case-study field | Today | Detail | Proposed home |
| --- | --- | --- | --- |
| Project name | ✅ | `Project.name` | as-is |
| Org / Venue name | 🟡 | Org + Account names exist, but there is no venue name distinct from the account (one account can run several venues) | optional **Venue name** on Project Settings |
| Location (City/State/Country) | ✅ | `Project.location` JSON | as-is |
| Sector (Stadium, Arena, School, University, Back of House, e-commerce…) | 🟡 | Our "Project Type" list is food-service flavored (Cafe/Cafeteria, Coffee Shop…) and lives in a JSON blob; it doesn't line up with the case-study Sector vocabulary at all | **Sector** enum column, merged vocabulary (§4) |
| Status (start date / end date / still operating) | 🟡 | Only *event* projects get dates; a Projections project has no timeline and no "went live / ended" status | **Program status** + start/end dates for every category |
| Pilot (Y/N) | ❌ | Nothing | **Pilot?** yes/no at creation |

### 2b. Program Design

| Case-study field | Today | Detail | Proposed home |
| --- | --- | --- | --- |
| Reuse model (on-site / closed loop / open loop / hybrid) | ❌ | The single most defining fact about a program, and we never ask it | **The lead qualification question** (§4) |
| Operator type (business, city, nonprofit) | ❌ | `Org.orgType` only distinguishes reuse-service-provider | **Operator type** enum on the Org (asked once, not per project) |
| Funders / grant source(s) | ❌ | A Funding Opportunities database exists in the 2.0 data release but is not linked to any project | optional **Funding sources** multi-select on Project Settings |
| Service provider (RSP) | 🟡 | `Account.rspOrgId`/`rspClientId` links exist but are created by Upstream admins in RSP Hub, invisible at project creation | **"Working with an RSP?"** question + RSP picker (§4) |
| Material + # uses before end of life | 🟡 | Material is derivable from the chosen reusable products; uses-before-EOL lives in catalog assumptions, never surfaced or overridable | surface both on the Reusables tab as read-only-with-override |
| Financial model (deposit-return, fee-per-use, rental, subscription, free) | ❌ | Nothing — we model costs, never the revenue/charging model | **Financial model** enum at creation (§4) |

### 2c. Impact Data

| Case-study field | Today | Detail | Proposed home |
| --- | --- | --- | --- |
| Return rate % | 🟡 | Reusables forecast asks a Return Rate (default 95%) to size repurchases; the RSP API measures it from in/out events. Two sources, never reconciled | keep both; when an RSP link exists, show measured-vs-assumed side by side |
| # disposables avoided | ✅ | computed | export mapping only |
| Waste diversion (tons) | ✅ | computed (lbs — convert on export) | export mapping only |
| GHG reduction (tons CO₂e) | ✅ | computed | export mapping only |
| Assumptions & methodologies | ✅ | This is Chart-Reuse 2.0's whole thesis: `methodologyVersion` + the calculation inspector's factor provenance. Far stronger than the free-text field in the workbook | export as "Chart-Reuse v{X}" citation (backlog 19c contract) |

### 2d. Economic Data

| Case-study field | Today | Detail | Proposed home |
| --- | --- | --- | --- |
| Cost savings | ✅ | computed | export mapping only |
| Upfront costs | ✅ | one-time costs across tabs | export mapping only |
| Recurring operating costs | ✅ | labor, expenses, hauling, utilities | export mapping only |
| Income generated | ❌ | No revenue concept anywhere — deposits kept, per-use fees, rental income | optional **Income** line items (pairs naturally with Financial model) |
| Jobs created | ❌ | Labor *costs* exist; headcount doesn't | optional **Jobs created** number on Project Settings |
| Other costs | ✅ | Additional Costs tab | as-is |
| ROI / break-even | ✅ | computed payback | export mapping only |

### 2e. Extra fields on the Case Studies sheet (beyond the four-section structure)

| Field | Today | Note |
| --- | --- | --- |
| Venue size / annual attendees | 🟡 | `eventGuestCount` exists for event projects only → generalize into the "customers per day" answer (§7) |
| Frequency of use | ✅ | purchase frequencies (Daily/Weekly/Monthly/Annually) |
| Dishwashing model (on-site / RSP / hybrid) | 🟡 | metadata has a dishwashing-type string, but "the RSP washes everything" is not expressible — the exact gap the qualification flow fixes |
| Tracking method (QR, RFID, app, honor system) | ❌ | optional field on the RSP Service tab |
| Single-use cost elimination, cost/reuse, avg cost/single-use item | 🟡 | all computable from data we already have; add to export mapping |

**Summary of the genuinely missing questions:** reuse model, sector (in a shared vocabulary),
pilot flag, program status/dates for non-event projects, operator type, financial model,
RSP relationship (user-visible), funders, income generated, jobs created, tracking method.
Everything else we either already ask or already compute.

---

## 3. Where the new answers should live

Recommendation: **real columns, not the metadata JSON blob.** The entire point is
standardization and comparison — querying "all closed-loop stadium pilots" must be a `WHERE`
clause, not a JSON crawl. Concretely, on `Project`:

```
reuseModel      ReuseModel?      // onsite_dining | closed_loop | open_loop | hybrid
sector          Sector?          // shared vocabulary, §4
isPilot         Boolean          @default(false)
programStatus   ProgramStatus?   // planning | operating | ended
financialModel  FinancialModel?  // deposit_return | fee_per_use | rental | subscription | free
rspOrgId        String?          // the RSP serving THIS project (account-level link stays for API routing)
rspServiceJson  Json?            // the RSP Service tab answers (§7)
```

plus `operatorType` on `Org` (business | government | nonprofit | education), asked once.
All nullable — every existing project stays valid, and the creation flow fills them for new
ones. `startDate`/`endDate` already exist and simply stop being event-only.

---

## 4. The qualification flow at project creation

Today creation asks Actuals-vs-Projections, then name/type/account/location. The proposal
inserts **one screen of program questions** between the category picker and the details —
five questions, each a card or radio row, none free-text, ~30 seconds to answer.

**Q1. What kind of reuse program is this?** *(the user's framing: "reuse for onsite dining,
operating a reuse system, working with an RSP")*

| Choice | Maps to `reuseModel` | Plain-language card text |
| --- | --- | --- |
| Reuse for onsite dining | `onsite_dining` | "We serve food and drinks in reusables that stay on our premises — we buy them and wash them." |
| Operating a reuse system | `closed_loop` or `open_loop` (follow-up radio: containers come back to *us* vs *shared network*) | "We run a returnable container program — items go out and come back." |
| Working with a reuse service provider | sets `rspOrgId` + follow-up (Q1b) | "A service provider supplies, collects, and/or washes our containers." |
| A mix / something else | `hybrid` | "Some of each — we'll ask what the provider covers." |

**Q1b. If an RSP is involved — what does the provider cover?** (checkboxes)
☐ Provides the containers ☐ Collects and washes them ☐ Delivers them back.
These three checkboxes are what drive the adaptive tabs (§5). The RSP itself is picked from
orgs with `orgType = 'reuse-service-provider'`, with "My provider isn't listed" storing a
free-text name (and giving sales an RSP lead list for free).

**Q2. What kind of venue?** — the `sector` vocabulary, merging our current list with the
case-study database's: Cafe/Cafeteria · Coffee Shop · Fast Casual Restaurant · Food Hall
Stand · Kitchenette/Breakroom · **School · University · Stadium · Arena · Hospital ·
Office/Corporate Campus · Event/Festival · E-commerce · Back of House** · Other. (The current
"Project Type" answers migrate 1:1 into this list — ours is a strict subset.)

**Q3. Is this a pilot?** Yes/No, plus program status: Planning / Operating since ⟨date⟩ /
Ended ⟨date⟩. Projections projects default to Planning; Actuals to Operating.

**Q4. How do customers pay for reusables?** (skippable) — deposit-return · fee per use ·
rental · subscription · free to customer. This is the case-study "Financial Model" field and
later the hook for modeling income.

**Q5. Anyone funding this?** (skippable) — multi-select over the Funding Opportunities
database + free text.

Only Q1 gates anything; Q3–Q5 exist purely for the standardized record and can be answered
later in Project Settings. Existing projects see the questions as an optional banner
("Tell us about your program") — never a forced migration.

---

## 5. How the answers shape the tabs

Today `lib/projects/steps.ts` picks tabs by category alone (advanced: Dashboard / Single-Use /
Reusables / Dishwashing / Additional Costs). The proposal makes the RSP checkboxes from Q1b
the second input:

| Q1b answers | Single-Use | Reusables | Dishwashing | **RSP Service** | Additional Costs |
| --- | --- | --- | --- | --- | --- |
| No RSP (onsite dining / self-operated) | ✔ | ✔ | ✔ | — | ✔ |
| RSP provides containers only | ✔ | ✔ *(toggle ON — §6)* | ✔ | ✔ | ✔ |
| RSP washes only | ✔ | ✔ | — | ✔ | ✔ |
| RSP provides **and** washes (full service) | ✔ | ✔ *(toggle ON)* | — | ✔ | ✔ |

Two principles:

- **Single-Use never disappears** — the baseline you're moving away from is the whole
  comparison.
- **Tabs are hidden, never deleted.** The checkboxes flip flags; unchecking "RSP washes"
  brings the Dishwashing tab back with any old data intact. Changing your mind must never
  destroy line items.

The Reusables toggle and the RSP checkbox stay in sync: they are the same fact
("RSP provides containers") shown in two places.

---

## 6. Reusables tab — "RSP provides the containers" toggle

A switch at the top of the Reusables tab: **"Our service provider supplies the containers."**

When ON, per the user's spec — *environmental calculations, no purchasing cost*:

- Product selection stays exactly as it is (category → product → material → size). We still
  need to know *what* containers are in use — material and weight drive every environmental
  number, and product matching is the load-bearing sales story (backlog 30a).
- Quantity stays (how many circulate / how many uses per year) — but **case cost, repurchase
  %, and one-time purchase cost fields hide**, and the financial engine receives zero
  purchasing cost from this tab. The cost of having containers moves to the RSP Service tab's
  cost-per-wash (that's what the service fee buys).
- Environmental accounting keeps running: displaced single-use manufacturing, washing, and
  end-of-life all still compute from the selected products.

**Open methodology question for Madhavi:** when the RSP owns the fleet, do we still attribute
container-manufacturing emissions to this project (amortized per use, as now), or does that
burden belong to the RSP's own ledger? Recommendation: keep attributing it (conservative,
honest, avoids double-zero accounting across our own RSP dashboards), and note it in the
calculation inspector — but this is a versioned-methodology decision, not a UI one.

---

## 7. The RSP Service tab

New wizard tab, shown whenever Q1b has any box checked. Four questions:

**1. Cost of service — cost per wash** (user-entered dollars).
`annual service cost = cost per wash × washes per year`, where
`washes per year = containers per day × operating days per year` and
`containers per day = customers per day × place setting`.

**2. Customer place setting** — "How many containers does one customer use per visit?"
(e.g. tray + plate + bowl + cup = 4). One number with a helper illustration.

**3. Customers per day — with a venue-aware label** driven by the Q2 sector:

| Sector | The question reads |
| --- | --- |
| School / University | "How many **students** are served per day?" |
| Stadium / Arena / Event | "How many **attendees** per event?" + "events per year" (replaces operating days) |
| Hospital | "How many **patients and staff** are served per day?" |
| Office / Corporate Campus | "How many **employees** are served per day?" |
| everything else | "How many **customers** are served per day?" |

Same variable underneath (`customersPerDay`); only the label and, for event venues, the
per-event framing changes. Plus "operating days per year" (defaulted by sector: school ≈ 180,
office ≈ 250, restaurant ≈ 360).

**4. Wash-hub distance** — "How far away is your provider's wash hub?" (miles, one-way) and
"deliveries per week."

```
annual round-trip miles = distance × 2 × deliveries/week × 52
transport GHG           = mass moved (tons) × truck factor × annual miles
```

This slots straight into the existing truck-transportation machinery:
`getTransportationGHG.ts` already computes `massInTons × cargoTruckCO2PerMile ×
distanceInMiles` from `TruckTransportationCost` rows — today with a hardcoded
`cargoTruckCO2PerMile = 0.37037616` and a single static mileage. The RSP version supplies a
*recurring* mileage (deliveries happen weekly, not once) and, under 2.0, reads the truck
factor from the **Transport Factors database** so it carries provenance in the calculation
inspector like every other 2.0 factor.

Optional fifth field: **tracking method** (QR / RFID / app / honor system / none) — asked for
the case-study record only; no math.

**Cross-check with RSP actuals:** when the project's account is API-linked to the same RSP,
the dashboard can show *assumed* washes per year (from this tab) next to *measured* outbound
events (from `POST /api/rsp/usage`) — the same assumed-vs-measured pattern as return rate.
That's the moment the three data sources stop being parallel and start correcting each other.

---

## 8. Standardization across the three data sources

With the fields above, one program can be described three ways and the descriptions line up:

| Concept | Chart-Reuse project | Case-study record | RSP API |
| --- | --- | --- | --- |
| Who/where | name, venue, `sector`, location | Project/Org/Location/Sector | `client_id` → linked account |
| Program shape | `reuseModel`, `financialModel`, `isPilot`, status/dates, RSP link | Reuse Model, Financial Model, Pilot, Status, Service Provider | implied `closed_loop`/`open_loop` via the RSP |
| Return rate | assumed (Reusables tab) | reported % | **measured** (in/out events) |
| Impact | computed w/ versioned methodology | reported, methodology free-text | computed from per-type factors |
| Economics | computed savings/costs/payback | reported savings/costs/ROI | service pricing (RSP Service tab) |

Two follow-on wins this unlocks, both deliberately out of scope here:

- **"Publish as case study"**: a project export that emits exactly the workbook's column
  structure — every ✅/🟡 row in §2 already has a source. Impact numbers go out citing
  "Chart-Reuse v{methodologyVersion}" per the public-citation contract (backlog 19c).
- **Case-study import**: the 156 existing workbook rows loaded as reference records for
  benchmarking ("programs like yours saw 73–90% return rates" — real numbers from the sheet).

---

## 9. Suggested build order

1. **Schema + Settings** — the §3 columns, editable in Project Settings, creation flow
   unchanged. (Small migration; unlocks everything else.)
2. **Qualification screen** at creation (§4) writing those columns.
3. **Adaptive tabs + Reusables toggle** (§5–6) — `steps.ts` reads the flags; financial
   zeroing behind the toggle.
4. **RSP Service tab** (§7) — inputs + service cost + wash-hub transportation, factors from
   the Transport Factors DB under 2.0.
5. **Assumed-vs-measured** dashboard strip for RSP-linked accounts; then export/import (§8).

Steps 1–2 are pure data collection with no calculator changes and could ship first alone;
3–4 touch the engine and need Madhavi's sign-off on the §6 methodology question.
