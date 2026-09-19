# Canadian Utility Rates — Source Reference

Chart-Reuse carries Canadian rates for all three utilities: **electricity** (per province,
Hydro-Québec 2025 comparison), **natural gas** (per province, Statistics Canada), and
**water** (one national commercial figure). Electricity is documented first; gas and water
follow. Companion guidance data (wages, tipping fees): `docs/CANADIAN-REFERENCE-DATA.md`.

The Canadian provincial electricity rates in Chart-Reuse come from:

> **Hydro-Québec, *Comparison of Electricity Prices in Major North American Cities* — 2025 edition**
> Rates in effect **April 1, 2025**, excluding taxes. ISBN 978-2-555-02337-6 (PDF, English).
> Published at hydroquebec.com/documents-data/official-publications
> (local file: `comparaison-prix-2025-en.pdf`)

## Which table we used

The study surveys several customer profiles. Chart-Reuse projects are small commercial
foodware operations, so we use the **Small-Power Customers** profile at
**40 kW power demand / 10,000 kWh per month / 35% load factor** — the middle column of:

- **"Average Prices on April 1, 2025 (in ¢/kWh)"** — Detailed Tables, Small-Power
  Customers, **printed page 30 (PDF page 31)**. This is the table every rate below
  comes from.

Supporting tables from the same section (not used directly, useful for checking):

- Monthly Bills (C$) — printed page 29 (PDF page 30)
- Comparative Index (Hydro-Québec = 100) — printed page 31 (PDF page 32)
- Figure 2 highlight chart — printed page 10 (PDF page 11)

The study prices **cities**, not provinces. Where a province has one surveyed city we
use it directly; where it has two (Alberta, Ontario) we average them. Prices are
converted from ¢/kWh to **C$/kWh** and rounded to 3 decimals.

## The rates

| Region | Rate (C$/kWh) | Source city / cities (¢/kWh) | Derivation |
|---|---|---|---|
| British Columbia | 0.127 | Vancouver 12.70 | direct |
| Alberta | 0.177 | Calgary 14.42, Edmonton 20.99 | average = 17.705 |
| Saskatchewan | 0.154 | Regina 15.43 | direct |
| Manitoba | 0.097 | Winnipeg 9.69 | direct |
| Ontario | 0.148 | Ottawa 14.14, Toronto¹ 15.50 | average = 14.82 |
| Quebec | 0.121 | Montréal 12.08 | direct |
| New Brunswick | 0.180 | Moncton 17.98 | direct |
| Nova Scotia | 0.192 | Halifax 19.19 | direct |
| Prince Edward Island | 0.204 | Charlottetown¹ 20.44 | direct |
| Newfoundland and Labrador | 0.146 | St. John's² 14.59 | direct |
| Yukon | 0.14 | — not in the study | estimate, retained from earlier work |
| Northwest Territories | 0.30 | — not in the study | estimate, retained from earlier work |
| Nunavut | 0.29 | — not in the study | estimate, retained from earlier work |

All city figures are the 40 kW / 10,000 kWh / 35% load-factor column of the Average
Prices table (printed page 30 / PDF page 31).

¹ Toronto and Charlottetown bills were *estimated by Hydro-Québec* and may differ from
actual bills (table footnote 2).
² St. John's uses Newfoundland Power rates (table footnote 3).

The three territories do not appear in the study (it covers 12 Canadian and 10 US
cities); their values are estimates carried over from the original Canadian-rates work
and should be replaced when a citable source is found.

## Natural gas rates (September 2026)

> **Statistics Canada, Table 25-10-0086-01 "Natural gas supply and disposition, monthly"**
> Commercial consumption **value (C$) ÷ energy (GJ)**, averaged over the 12 months ending
> June 2026 (latest release 2026-08-24) to remove seasonality. Per StatCan's survey guide
> (record 5215), the dollar value is the cost to the customer **excluding sales taxes**,
> with rebates deducted — commodity + delivery, exactly the delivered price the calculator
> wants. Converted to C$/therm at 1 therm = 0.105506 GJ.

| Region | C$/GJ | C$/therm | Note |
|---|---|---|---|
| British Columbia | 10.05 | 1.060 | matches FortisBC Rate 2 total ($10.03/GJ) almost exactly |
| Alberta | 2.25 | 0.237 | see caveat below |
| Saskatchewan | 5.89 | 0.621 | consistent with SaskEnergy small commercial |
| Manitoba | 5.27 | 0.556 | consistent with Manitoba Hydro small general service |
| Ontario | 6.85 | 0.723 | consistent with Enbridge Rate 6 |
| Quebec | 11.53 | 1.216 | includes cap-and-trade allowance costs (billed as gas cost) |
| New Brunswick | 8.70 | 0.918 | weakest match — Liberty's posted totals run higher |
| Nova Scotia | 18.70 | 1.973 | consistent with Eastward Energy general service |
| Northwest Territories | 35.60 | 3.756 | real data but a tiny market (~22 TJ/yr) |
| PEI, Newfoundland, Yukon, Nunavut | 6.61 | 0.697 | **no piped gas distribution** — Canadian commercial average as a stand-in |

**Caveat — averages vs. small-business bills**: the StatCan figure is average revenue across
*all* commercial customers. Cross-checks against posted small-commercial utility rates match
well everywhere except **Alberta**, where cheap commodity plus large customers pulls the
average ($2.25/GJ) below what a small shop pays delivered (~$5–8/GJ). If a partner supplies
a better small-commercial series, replace Alberta first.

Citation string: *"Statistics Canada, Table 25-10-0086-01, Natural gas supply and
disposition, monthly — commercial consumption value ÷ energy, 12 months ending June 2026."*
Refresh annually from the same table.

## Water rate (September 2026)

> **C$4.65/m³ ≈ C$17.60 per 1,000 US gallons** — combined commercial water + wastewater,
> the average of seven major cities' published 2025–26 rate schedules.

There is no current national water-price survey (Environment Canada's Municipal Water
Pricing Report ended with 2009 rates), and water pricing is **municipal**, so per-province
values are not defensible — one national commercial figure is the honest constant, mirroring
how the US side uses one national average ($6.98/1,000 gal).

Derivation (combined small-commercial volumetric rate, C$/m³, fixed meter charges excluded):
Toronto 4.86 (2026 Block 1, combined) · Vancouver 4.44 (seasonal midpoint, water + sewer) ·
Calgary 3.98 (water + wastewater at 90% of volume) · Edmonton 4.26 (EPCOR, Apr 2026) ·
Ottawa 3.99 (Tier 3 combined) · Winnipeg 6.70 (2026 volume rates — the high outlier) ·
Halifax 4.31 (Apr 2026). Average **4.65**, × 3.78541 = **17.60 per 1,000 US gal**.
Montréal is excluded: its water service is mostly property-tax funded (first 1,000 m³ free),
so it is not comparable to metered rates. Each figure is from the utility's own published
schedule. Refresh annually; Winnipeg has already published 2027 increases.

## Where these live in the app

- **Compiled constants**: `lib/calculator/constants/utilities.ts` — the `STATES` array's
  Canadian block (electric, gas, and water per province, with citations in the comment),
  plus `CANADIAN_REGIONS` / `isCanadianRegion()` for country-aware pickers. The v1 engine
  reads these via `getProjectUtilities()`.
- **Utility Rates database** (Data Science → Databases): the 2.0 engine reads rates from
  here, so the 13 Canadian rows carry the same values with a source_status citing this
  document. `scripts/update-canadian-utility-rates.ts` syncs the rows from the compiled
  constants (run once per rate refresh, then cut a release — the Canadian gas/water values
  landed as **release v2.2**). The release loader (`scripts/load-cr2-data-release.ts`,
  `provinceRows()`) preserves these rows across reloads — the workbook's own Utility_Rates
  tab is US-only.

## Caveats

- **Currency**: all Canadian values are **C$** (Canadian orgs run in CAD). The project
  form now warns when a Canadian province is selected in an org that displays another
  currency (`docs/BACKLOG.md` item 4).
- **Taxes**: all three utilities exclude sales taxes, matching their sources.
- **Vintage**: electricity April 1, 2025 (Hydro-Québec publishes annually); gas 12 months
  ending June 2026 (StatCan updates monthly); water 2025–26 schedules. Refresh all three
  annually, then re-run `scripts/update-canadian-utility-rates.ts` and cut a release.
