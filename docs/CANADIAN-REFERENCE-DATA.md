# Canadian Reference Data — Sources

## Canadianization checklist — data & assumptions in the Projections Calculator

Status of every US-specific data point or assumption we identified, September 19, 2026.
Each done item links the source that informed the values.

### Done

- [x] **Provincial electricity rates** (replaces per-state EIA rates for Canadian regions).
  Source: [Hydro-Québec, *Comparison of Electricity Prices in Major North American Cities*,
  2025 edition](https://www.hydroquebec.com/documents-data/official-publications/) — Small-Power
  Customers table (40 kW / 10,000 kWh / 35% load factor), printed p. 30. Shipped July 2026;
  derivation per province in `docs/CANADIAN-UTILITY-RATES.md`.
- [x] **Provincial natural gas rates** (replaces the flat US$0.92/therm placeholder).
  Source: [Statistics Canada, Table 25-10-0086-01 — Natural gas supply and disposition,
  monthly](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=2510008601): commercial
  consumption value ÷ energy, 12 months ending June 2026; value definition per the
  [Monthly Natural Gas Distribution Survey guide](https://www.statcan.gc.ca/en/statistical-programs/document/5215_D1_V11)
  (cost to customer excluding sales taxes). Cross-checked against posted utility rates:
  [FortisBC](https://www.cdn.fortisbc.com/libraries/docs/default-source/about-us-documents/regulatory-affairs-documents/gas-utility/feionepageratesummary.pdf),
  [Enbridge Rate 6](https://www.enbridgegas.com/-/media/Extranet-Pages/ontario/business-and-industrial/Business/Rates/EGD---Rate-6---System-Notice.pdf) /
  [OEB](https://www.oeb.ca/consumer-information-and-protection/natural-gas-rates),
  [SaskEnergy](https://www.saskenergy.com/manage-account/rates/business-rates),
  [Manitoba Hydro](https://www.hydro.mb.ca/account/rates/commercial/),
  [Énergir](https://energir.com/en/business/customer-centre/billing-and-pricing/pricing),
  [Eastward Energy](https://eastwardenergy.com/for-business/rates/),
  [Liberty NB](https://naturalgasnb.com/en/for-home/accounts-billing/gas-price-update/),
  [DERS Alberta](https://www.globenewswire.com/news-release/2026/08/31/3353595/0/en/direct-energy-regulated-services-announces-natural-gas-rates-for-september-2026.html).
- [x] **Canadian water rate** (replaces the US$6.98/1,000 gal national average for Canadian
  regions): C$4.65/m³ ≈ C$17.60/1,000 gal, average of seven cities' 2025–26 commercial
  water + wastewater schedules —
  [Toronto](https://www.toronto.ca/legdocs/mmis/2025/ex/bgrd/backgroundfile-260472.pdf),
  [Vancouver](https://vancouver.ca/home-property-development/metered-rates.aspx),
  [Calgary](https://www.calgary.ca/for-business/operations/water-rates-billing.html),
  [Edmonton (EPCOR)](https://www.epcor.com/ca/en/ab/edmonton/account/rates/business/commercial-and-multi-residential-water-and-wastewater-rates.html),
  [Ottawa](https://ottawa.ca/en/living-ottawa/water-utility-bills/rates-and-fees/water-billing-rate-increase-2026),
  [Winnipeg](https://dmis.winnipeg.ca/DownloadMeetingDocument/786158/1.%202026%20and%202027%20Water%20and%20Sewer%20Volume%20Rates.pdf),
  [Halifax Water](https://www.halifaxwater.ca/rates). Montréal excluded (tax-funded, first
  1,000 m³ free — [source](https://montreal.ca/en/articles/non-residential-buildings-volume-based-pricing-water-consumption-40288)).
- [x] **Labour rate guidance** (Add Labor drawer, Canadian projects): provincial minimum
  wages from each government's employment-standards page (e.g.
  [Ontario](https://www.ontario.ca/document/your-guide-employment-standards-act-0/minimum-wage),
  [BC](https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/wages/minimum-wage),
  [Alberta](https://www.alberta.ca/minimum-wage),
  [Nova Scotia](https://novascotia.ca/lae/employmentrights/minimumwage.asp),
  [federal](https://www.canada.ca/en/employment-social-development/news/2026/03/government-of-canada-raises-the-federal-minimum-wage.html)),
  cross-checked via [Littler's 2026 summary](https://www.littler.com/news-analysis/asap/canada-minimum-wage-increases-2026);
  dishwashing/kitchen-staff medians from [Job Bank, NOC 65201](https://www.jobbank.gc.ca/marketreport/wages-occupation/17215/ca).
- [x] **Waste hauling guidance** (Add Waste Hauling drawer, Canadian projects): 2025–26
  landfill tipping fees from published municipal schedules —
  [Metro Vancouver](https://metrovancouver.org/services/solid-waste/Documents/sws-tipping-fee-updates-2026.pdf),
  [Toronto](https://www.toronto.ca/legdocs/mmis/2026/mpb/bgrd/backgroundfile-284291.pdf),
  [Ottawa](https://ottawa.ca/en/garbage-and-recycling/waste-facility-landfills/rates-trail-waste-facility-landfill),
  [Calgary](https://www.calgary.ca/for-business/operations/landfill-commercial-rates.html),
  [Edmonton](https://www.edmonton.ca/programs_services/garbage_waste/disposal-rates),
  [Winnipeg](https://www.winnipeg.ca/services-programs/recycling-garbage/garbage-disposal/landfill-brady-road-resource-management-facility),
  [Halifax](https://www.halifax.ca/home-property/garbage-recycling-green-cart/waste-management-businesses),
  [Kelowna](https://www.kelowna.ca/our-community/news-events/news/landfill-tipping-fee-changes-coming-2026).
- [x] **Exchange rate for USD-sourced conversions**: Bank of Canada 2025 annual average
  (1.3978) — [bankofcanada.ca annual average rates](https://www.bankofcanada.ca/rates/exchange/annual-average-exchange-rates/).
- [x] **CAD currency display with USD/CAD codes** after amounts site-wide, plus a
  country/currency mismatch warning in the project form.
- [x] **Metric display** (kg / litres) via the org's Measurement System setting
  (pre-existing), applied automatically on the public calculator's Canada view.
- [x] **Country-aware entry points**: org settings Country select (Canadian orgs' new
  projects default to provinces); public calculator Country dropdown with shareable
  `?country=canada|us` URLs backed by `CANADA_AVERAGE_RATES`.
- [x] **Copy fix**: dishwashing step says "provincial average" for Canadian regions.

### Not done (and why)

- [ ] **Canadian product prices** — the calculator never surfaces catalog prices (every
  case cost is user-entered), so there is no US default to swap; real Canadian pricing is
  data **ECCC offered to supply** (backlog #17), best delivered through the versioned
  data-release flow (#19a). The BoC rate above is the documented interim conversion.
- [ ] **Labour rate *defaults*** (prefilled values, not guidance) — `LaborCost` stores a
  flat cost per frequency, not hours × rate, so a defensible prefill needs a definition of
  hours; the wage guidance was the honest first step.
- [ ] **Monthly waste-hauling cost defaults** — only
  [Toronto publishes a commercial collection price schedule](https://www.toronto.ca/services-payments/recycling-organics-garbage/non-residential/fees-set-out-for-businesses/)
  (~C$54–216/month per bin); everywhere else private haulers price by contract. No current
  national survey exists (the CCME/Giroux report is 2014). **ECCC data ask.**
- [ ] **Regional grid carbon intensity** — built July 2026 on branch
  `feat/regional-grid-factors` ([EPA eGRID2023](https://www.epa.gov/system/files/documents/2025-06/summary_tables_rev2.pdf)
  for US states, [CER provincial profiles](https://www.cer-rec.gc.ca/en/data-analysis/energy-markets/province-territory-energy-profiles/)
  / ECCC National Inventory Report for provinces); **held on data-science sign-off**.
  Until it ships, dishwashing GHG uses the flat continental factor even in Canada.
- [ ] **Canadian material/WARM emission factors** — methodology-level; arrives as an
  ECCC-supplied versioned data release (backlog #19a), not hardcoded constants.
- [ ] **Territory electricity rates** — Yukon/NWT/Nunavut are estimates carried from
  earlier work (not in the Hydro-Québec study); replace when a citable source is found.
- [ ] **Alberta small-commercial gas** — the StatCan all-commercial average (C$2.25/GJ)
  understates a small shop's delivered cost (~C$5–8/GJ with delivery); replace first when
  a better small-commercial series lands.
- [ ] **Share page Assumptions popup** — still shows the template's US assumptions on the
  Canada view.
- [ ] **Canadian / ECCC project template** (backlog #18) — co-build at the Q4 session.

Guidance values shown on Canadian projects (province selected in the Utility Rates picker).
None of these numbers enter a calculation — labor and waste hauling costs are always
user-entered — they help a Canadian user pick realistic numbers instead of guessing from
US figures. Compiled September 2026. Code: `lib/calculator/constants/canadian-reference.ts`.

Companion docs: `docs/CANADIAN-UTILITY-RATES.md` (electricity, gas, water — those DO enter
calculations).

## Wages (Labor step guidance)

Shown in the Add Labor drawer for Canadian projects.

- **Minimum wages**: general adult rates in effect September 2026, from each
  provincial/territorial government's employment-standards page and the federal
  announcement (canada.ca). Five already-legislated October 1, 2026 increases are
  included (ON $17.95, NS $17.00, PEI $17.30, MB $16.40, SK $15.70).
  Cross-checked against the Littler 2026 Canada minimum-wage summary and Job Bank
  wage floors.
- **Dishwashing / kitchen staff median wages**: Government of Canada Job Bank,
  NOC 65201 "food counter attendants, kitchen helpers and related support occupations"
  (jobbank.gc.ca/marketreport/wages-occupation/17215/ca, Labour Force Survey 2023–2024,
  updated November 2025). National median C$16.55/hr. In 9 of 13 jurisdictions the
  median equals the minimum wage — kitchen-helper jobs typically pay at the legal floor;
  only BC and the territories run meaningfully above it.

| Jurisdiction | Min. wage (C$/hr) | Effective | Announced next | Kitchen median |
|---|---|---|---|---|
| British Columbia | 18.25 | Jun 2026 | — | 18.25 |
| Alberta | 15.00 | Oct 2018 | — | 16.00 |
| Saskatchewan | 15.35 | Oct 2025 | $15.70 Oct 1, 2026 | 15.35 |
| Manitoba | 16.00 | Oct 2025 | $16.40 Oct 1, 2026 | 16.00 |
| Ontario | 17.60 | Oct 2025 | $17.95 Oct 1, 2026 | 17.60 |
| Quebec | 16.60 | May 2026 | — | 16.60 |
| New Brunswick | 15.90 | Apr 2026 | — | 15.90 |
| Nova Scotia | 16.75 | Apr 2026 | $17.00 Oct 1, 2026 | 16.75 |
| Prince Edward Island | 17.00 | Apr 2026 | $17.30 Oct 1, 2026 | 17.00 |
| Newfoundland and Labrador | 16.35 | Apr 2026 | — | 16.35 |
| Yukon | 18.51 | Apr 2026 | — | 20.00 |
| Northwest Territories | 17.20 | Sep 2026 | — | 20.00 |
| Nunavut | 20.17 | Sep 2026 | — | 25.90 |

Refresh cadence: most jurisdictions index annually (April, June, or October). Refresh
this table each October, when the largest batch lands.

## Waste hauling (Additional Costs step guidance)

Shown in the Add Waste Hauling drawer for Canadian projects. There is **no current
national tipping-fee survey** (the CCME/Giroux *State of Waste Management in Canada*
report is 2014 — background only, do not cite its prices), so these are city-level
references from published 2025–2026 municipal fee schedules:

| City | Garbage tipping fee (C$/tonne) | Source | Vintage |
|---|---|---|---|
| Metro Vancouver | 182 (loads < 1 t; tiers down for larger loads) | Tipping Fee Bylaw 400 | Jul 2026 |
| Kelowna | 106 | city fee schedule | 2026 |
| Calgary | 113 | calgary.ca commercial landfill rates | 2026 |
| Edmonton | 102 | EWMC disposal rates / 2026 rate filing | 2026 |
| Winnipeg | 99 | Brady Road facility rates | Jan 2026 |
| Toronto | 189.86 | Municipal Code Ch. 441, Appendix A | 2026 |
| Ottawa | 172.70 | Trail Waste Facility rates | 2026 |
| Halifax | 135.50 + HST | Otter Lake (halifax.ca) | 2025–26 |

Range used when a province has no surveyed city: **C$99–190/tonne**.

Monthly bin/cart collection pricing is a **data gap**: Toronto is the only major city
publishing a complete commercial collection schedule (95-gal garbage bin ≈ C$54–216/month
depending on frequency; bag tag $6.81). Vancouver, Halifax and most others leave
businesses to private haulers whose contract prices are unpublished. **This is an ECCC
data ask** (see `docs/BACKLOG.md` #17/#19a): a partner-supplied dataset of typical
commercial hauling costs would upgrade this guidance to real defaults.

## Exchange rate

`USD_TO_CAD_ANNUAL_AVERAGE_2025 = 1.3978` — Bank of Canada annual average exchange rate
for 2025, series FXAUSDCAD (bankofcanada.ca/rates/exchange/annual-average-exchange-rates).
For converting USD-sourced figures with a documented, citable rate. Refresh when the
Bank posts each new annual average (January).

## Product catalogs — Canada-accuracy analysis (2026-09-19)

What the two catalogs actually contain, and what is or isn't US-specific:

**Single-use catalog** (`lib/inventory/single-use-products-data.csv`, 111 products):
carries **no prices at all** — only physical data (case counts, item/case weights,
materials, box assumptions). Sourced from US retail listings (91 Amazon, 6
WebstaurantStore, plus Innopak/GP Pro), with Amazon links dating **2014–2016**. The
physical data is **country-neutral** — an 8 oz foam cup weighs the same in Canada — so
this catalog needs no Canadianization. Its real risk is vintage, which affects both
countries equally.

**Reusables catalog** (`lib/inventory/assets/reusables/reusable-products-data.csv`,
80 products): 79 rows carry a `Case Price ($)` in USD (WebstaurantStore, Amazon, Alibaba
wholesale, Ahimsa, Buoy…), but **the app never parses or displays these prices** — the
CSV reader skips the price columns and every case cost is user-entered. The price data is
dead today, mixes wholesale and retail, and has known QA issues (candidate feedback #12:
prices that look per-unit sitting in the per-case field). Weights/materials are
country-neutral, same as single-use.

**Impact factors** (the real US-specific layer): per-material GHG and water factors come
from the **EPA WARM model** (v1 constants from "Hidden: EPA WARM Model Assumptions";
2.0's GHG/Water Factors databases carry the same lineage via the Combined Model
directory). WARM embeds **US end-of-life assumptions** — US recycling rates, US landfill
gas capture, US production energy mix — which is where Canadian numbers genuinely differ.
Ocean freight (`TRANSPORTATION_CO2_EMISSIONS_FACTOR`) is origin-driven (Asia) and barely
differs by destination country; its known double-count (backlog #8) dwarfs any Canada
delta.

**Guidance, ranked by impact per effort:**

1. **Don't fork the catalogs.** Physical product data is country-neutral; one catalog
   serves both countries.
2. **Ship the regional grid factors** (`feat/regional-grid-factors`, held on sign-off) —
   the largest per-region impact correction available, already built.
3. **Canadianize the WARM-lineage material factors via ECCC** — this is the substance of
   "Canadianized WARM assumptions" (2026-09-18 review, workstream D3): ask ECCC for
   Canadian per-material end-of-life factors (or provincial diversion rates + landfill
   gas-capture assumptions) and land them as a **versioned GHG/Water Factors release**
   ("Source: ECCC, 2026") through the diff-and-choose flow, so Canadian projects can pin
   a Canadian methodology while US projects keep WARM.
4. **Prices: decide "live" before deciding "Canadian."** Catalog prices are currently
   dead data. If prices should ever prefill case costs, build one **Product Prices
   versioned database** (columns: product id, `price_usd`, `price_cad`, source URL,
   vintage) — ECCC supplies the CAD column (#17), Bank of Canada 1.3978 is the documented
   interim conversion, and the 2014–2016 US prices need re-verification anyway. If prices
   stay user-entered, there is nothing to Canadianize — and that is a legitimate answer.
5. **Fix freight's double-count (#8) before worrying about Canadian freight** — the
   methodology error is ~15% of GHG; the country difference is noise.

## The other factor databases — Canada sensitivity (2026-09-19)

Assessment of every remaining versioned database and hardcoded factor group:

| Database / factor | Country-sensitive? | Verdict |
|---|---|---|
| **Utility Rates** (65 rows) | Yes | **Done** — provincial electric/gas/water, release v2.2 |
| **GHG / Water Factors** (22 + 24 rows) | Yes — WARM embeds US end-of-life | **The ECCC factors ask** (see catalog analysis above) |
| **Dishwasher Factors** (9 rows) | Machine specs: no. Water-heating assumption: **yes** | Specs are ENERGY STAR CFS data — the same specification NRCan administers in Canada, so racks/gallons/kW are country-neutral. But the building water heater assumes a **70 °F temperature rise** (≈50 °F inlet → 120 °F), and Canadian municipal inlet water runs colder — seasonally much colder — so heating energy per gallon is understated for Canada. A region-aware inlet temperature (or a Canadian tempIncrease) is a defensible, physics-backed refinement. Needs a citable inlet-temperature source (municipal utilities / NRCan) and data-science sign-off. |
| **Transport Factors** (1 row: waterborne, 0.000000021 MTCO₂e/lb-mile × 19,270 mi) | Barely | Ship emission intensity is geography-neutral; the standard shipment distance could become destination-aware (Vancouver is a *shorter* Asia route than US East Coast), but the known freight double-count (backlog #8) is ~15% of GHG and dwarfs any Canada delta — fix that first. Note: the **truck factor (0.37 CO₂/ton-mile)** is hardcoded in `getTransportationGHG.ts`, not in this database — a lineage gap worth closing regardless of country; the diesel emission factor itself is effectively identical in ECCC's inventory. Truck distance is user-entered and already converts miles/km with the metric setting. |
| **Funding Opportunities** (121 rows, 17 Canadian) | Yes | Grow Canadian coverage (ECCC can supply federal/provincial reuse programs — a very natural ask) and wire the planned country filter to the `country` column the rows already carry. |
| **Grid carbon intensity** (flat constant today) | Yes | Built with provincial factors on `feat/regional-grid-factors`; held on sign-off. |
| **Natural gas combustion factor** (11.7 lb CO₂/therm) | No | Combustion chemistry; ECCC's inventory value is effectively the same. |
| **Purchase Frequency, Data Dictionary, Validation, product catalogs** | No | Dictionaries, meta-tables, and physical product data — country-neutral. |

**Ranked Canada opportunities from this pass:** (1) ship the grid factors; (2) the ECCC
end-of-life factors release; (3) Canadian inlet-water temperature for dishwashing —
new finding, physics-backed, touches every Canadian project with a dishwasher; (4) grow
Canadian funding rows via ECCC + the country filter; (5) move the truck factor into the
Transport Factors database for lineage (not a Canada fix, but found during this audit).

## Canadianization to-do list

The consolidated next steps, in priority order:

- [ ] **1. Ship regional grid carbon intensity** — built on `feat/regional-grid-factors`
  (EPA eGRID2023 + CER/ECCC provincial factors); needs only data-science sign-off. The
  single largest Canada-accuracy correction available.
- [ ] **2. ECCC end-of-life factors release** — Canadian per-material GHG/water factors
  (or provincial diversion rates + landfill assumptions) replacing WARM's US end-of-life,
  landed as a versioned GHG/Water Factors release ("Source: ECCC, 2026") via the
  diff-and-choose flow. Reframes backlog #17: the priority ECCC dataset is factors, not
  prices.
- [ ] **3. Flag SUPPR-prohibited products for Canadian projects** — Canada's Single-Use
  Plastics Prohibition Regulations are fully in force (Federal Court of Appeal upheld the
  underlying order Jan 30, 2026 — [2026 FCA 17](https://mcmillan.ca/insights/publications/plan-for-the-ban-federal-court-of-appeal-upholds-order-underlying-canadas-single-use-plastics-prohibition-regulations/)).
  Catalog items a Canadian business can no longer buy: the six **EPS foam cups**, both
  **plastic straws**, both **plastic stir sticks**, and the non-compostable **plastic
  cutlery**. These stay valid as *baseline* (what they used to buy) but should be marked
  "prohibited in Canada" in the picker for Canadian projects — a strong nudge toward
  reuse that also keeps forecasts legally plausible.
- [ ] **4. Canadian inlet-water temperature for dishwashing** — the model's 70 °F
  building-heater rise assumes US inlet temps; Canadian inlet water is colder, so heating
  energy is understated. Needs a citable source + sign-off.
- [ ] **5. Canadian product additions** (see the gap list below) — follow the blessed
  new-product recipe in `docs/DATA-REVIEW-AGENDA.md` §2 (real purchasable listing,
  weight sanity-check, standard box assumption).
- [ ] **6. Grow Canadian Funding Opportunities rows + country filter** — ECCC supplies
  federal/provincial reuse programs; the `country` column already exists.
- [ ] **7. Decide whether catalog prices go live** — if yes, a Product Prices versioned
  database with `price_usd` / `price_cad` columns (ECCC fills CAD; BoC 1.3978 interim).
- [ ] **8. Monthly waste-hauling cost data** — ECCC data ask (only Toronto publishes).
- [ ] **9. Smaller items** — replace territory electricity estimates with citable
  sources; better Alberta small-commercial gas; Canada view for the share page's
  Assumptions popup; move the truck factor into the Transport Factors database (lineage);
  ECCC project template (#18, Q4 co-build); French (#19, contract scope).

## Product catalog gaps for Canadian users (2026-09-19)

**Status: analysis only — parked by Derek 2026-09-19, no additions planned yet.** The
catalogs' physical data is country-neutral, but Canadian foodservice has vessels and
condiments the catalogs don't cover; this list is the menu to draw from if product work
joins the Canadianization scope (each item ≈ 20 min via the `docs/DATA-REVIEW-AGENDA.md`
§2 recipe):

**Single-use additions worth making:**

- [ ] **Large round paper food containers + lids, 24 oz and 32 oz** — the poutine vessel
  (also rice/noodle bowls). Gravy demands a leak-resistant round container; the catalog's
  paper soup cups stop at 16 oz and the kraft food trays are dry-food only. This is the
  most Canadian gap in the catalog.
- [ ] **Malt vinegar portion packets** — the fries condiment in Canada; the condiment
  packet list (ketchup, mustard, mayo, soy, creamer, salt, pepper, sugar) doesn't have it.
- [ ] **Aluminum foil takeout containers + board lids, and foil wrap sheets** — the
  shawarma/curry/rotisserie takeout format, common across Canadian independents. Also the
  catalog's only wrap is one wax-paper sheet.
- [ ] **Bakery / donut boxes (half-dozen and dozen)** — coffee-and-donut culture; the
  closing food boxes (#4, #8) don't cover flat dozen boxes.
- [ ] **24 oz (XL) hot cup + lid** — Canadian coffee chains sell an XL; hot cups stop at
  20 oz.
- [ ] **Single-use pizza box** — a gap for both countries: the base catalog has none,
  while the reusables catalog carries PP pizza boxes with nothing single-use to displace.

**Reusable additions worth making:**

- [ ] **16 oz reusable hot cup** — PP hot cups stop at 12 oz; the XL coffee tier has no
  reusable counterpart.
- [ ] Poutine is already served: the 9" PP/ceramic/stainless bowls work as reusable
  poutine vessels, and 2 oz ramekins cover gravy sides. No gap.

**Sizing note:** keep oz/inch sizing — Canadian foodservice buys in the same imperial
sizes (a 12 oz cup is a 12 oz cup in both countries); the metric display setting already
handles presentation.
