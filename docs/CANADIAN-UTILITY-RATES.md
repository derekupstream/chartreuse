# Canadian Utility Rates — Source Reference

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

## Where these live in the app

- **Compiled constants**: `lib/calculator/constants/utilities.ts` — the `STATES` array's
  Canadian block (with this same citation in the comment), plus `CANADIAN_REGIONS` /
  `isCanadianRegion()` for country-aware pickers.
- **Utility Rates database** (Data Science → Databases): Canadian rows carry
  `source_status: "Hydro-Québec 2025 comparison (electric, C$/kWh); gas and water are US
  placeholders pending a 2.0 Canadian set"`. The v2.0 release loader
  (`scripts/load-cr2-data-release.ts`, `provinceRows()`) preserves these rows across
  reloads — the workbook's own Utility_Rates tab is US-only.

## Caveats

- **Currency**: values are **C$/kWh** (Canadian orgs run in CAD). Nothing yet guards
  against a Canadian project inside a USD org — `docs/BACKLOG.md` item 4.
- **Gas and water**: Canadian rows still use the **US placeholder values**
  (gas $0.92/therm, water $11.00/1,000 gal). Only electricity is Canada-accurate.
- **Taxes**: the study's figures exclude taxes; so do ours.
- **Vintage**: rates are as of April 1, 2025. Hydro-Québec publishes this comparison
  annually — refresh from the new edition's same table when it appears.
