# Data Review Agenda — items needing Madhavi's sign-off

Running list of product decisions that hinge on data/methodology review. Add items here rather than shipping unvetted numbers.

## 1. Recycled materials — verify factors, then un-gate

`Recycled Stainless Steel` and `Recycled Aluminum` exist in `lib/calculator/constants/materials.ts` with real emission/water factors, but are hidden from customers by `UPSTREAM_ONLY_MATERIALS`. Berkeley (Zohe) asked for exactly this virgin-vs-recycled comparison.

**Questions for review:**
- The recycled entries are written in a different unit style than every other material (raw lbs CO2 × conversion vs pre-converted MTCO2e) — different source? Which?
- Recycled stainless shows **~31% lower carbon** than virgin (plausible) but **2.2× higher water** (14.9 vs 6.7 gal/lb). Recycled aluminum: ~13% lower carbon, 1.4× higher water. Is the water basis apples-to-apples with the virgin rows?
- If blessed: delete the `UPSTREAM_ONLY_MATERIALS` gate (one line) and note the source in the Factor Library.

## 2. New catalog product method — bless the recipe

Proposed standard for adding requested products (first case: Berkeley's 6–7" ceramic plate; catalog has only 5" and 9"):

1. Anchor to a **real purchasable listing** (restaurant supplier) for case count, case weight, price — same as every existing entry.
2. **Sanity-check** the listed weight against geometry of neighboring sizes (5" plate = 0.39 lb, 9" = 0.95 lb → a 6.5" should land ~0.55–0.65 lb).
3. Apply the standard box assumption (corrugated carton = 12.5% of gross case weight).
4. If no real listing exists, interpolate and mark the entry as estimated.

## 3. Mass / GHG / water mismatch vs source spreadsheets — DIAGNOSED

Reproduced from Madhavi's `new-cr-test.xlsx` (3 single-use items: Ketchup id 12, Clamshell id 9, 8" Pizza box id 115). Item counts and financials match because they come from user input; mass/GHG/water diverge because they come from the catalog + factor tables. Three independent causes:

### 3a. Water factors in code ≠ water factors in the source databases (biggest cause: water −33%)

Not one water factor matches. GHG factors match perfectly, which localizes this to the water column of whichever database version the code was built from:

| Material | Her database (gal/lb) | Our code (gal/lb) | Ratio |
|---|---|---|---|
| Plastic (LDPE) | 14.3271 | 6.463443895 | 2.22× |
| EPS Foam | 15.4898 | 9.274574666 | 1.67× |
| Plastic (#5 PP) | 10.79 | 3.8735 | 2.79× |
| SAN Plastic | 9.9297 | 3.198849171 | 3.10× |
| Stainless Steel | 13.86775 | 6.73664842 | 2.06× |
| Corrugated Cardboard | 3.03798 | 3.69425241538224 | 0.82× |

Ratios are not constant, so this is a different dataset, not a unit conversion. **Decision needed: which set is authoritative?** Then update `MATERIALS` / `REUSABLE_MATERIALS` in `lib/calculator/constants/materials.ts` and record the source in the Factor Library.

### 3b. Shipping-box mass ignores the user's units-per-case (mass −7%) — code bug

Projections path (`getAnnualGasEmissionChanges.ts:169–173`, `getAnnualWaterUsageChanges.ts:148–152`, `getAnnualWasteChanges.ts:89`) computes:

```
annualBoxWeight = product.boxWeight (per CATALOG case) × user's casesPurchased
```

`product.boxWeight` = catalog gross case weight × 12.5%, i.e. the box for the *catalog's* case size. The user's `unitsPerCase` never enters the formula, so the catalog's box size is paired with the user's case count. Her test used 400/case (catalog 200), 100/case (catalog 500), 100/case (catalog 50) — every row diverges:

| Item | Our box lbs | Per-item method | Ratio |
|---|---|---|---|
| Ketchup | 575 | 1,160 | 0.50× |
| Clamshell | 1,262.5 | 252 | 5.0× |
| Pizza box | 975 | 1,950 | 0.50× |

The **event/Actuals path in the same functions already does it correctly** (`boxWeightPerItem × casesPurchased × unitsPerCase`), and the catalog carries a `Box Weight per item (lbs)` column for exactly this. Proposed fix: use the per-item column on the projections path too. With that fix, mass matches her sheet on 2 of 3 rows exactly (the third is 3d below).

### 3c. GHG "matches" only by coincidence — verify before trusting

Totals: ours 62.810 vs hers 62.785 (+0.04%). Three sizeable errors nearly cancel:

1. **Ocean-freight emissions are applied to the shipping box, not the product** (+1.14 MTCO2e in ours). `getLineItemGasEmissions` adds `TRANSPORTATION_CO2_EMISSIONS_FACTOR` (0.00040467/lb) to `annualBoxWeight`, but the file's own header comment says the intent is `overseas cargo EF × product mass`. Her sheet has no transport term for single-use at all. **Decide: transport on product mass, on box, or not on single-use?**
2. **Her sheet used the LDPE factor for the ketchup's aluminum lining** (0.000915 and 14.3271 instead of 0.003755 and 8.7618) — understates her GHG by 4.57 MTCO2e. Likely a fill-down error in the spreadsheet, not a code issue.
3. Box-mass differences from 3b (−1.56 MTCO2e).

### 3d. Clamshell (id 9) cardboard per item differs between her database and our CSV

Hers 0.016833 lb/item; our CSV 0.002520 (= 1.26 lb box ÷ 500 per case). 1.2625 ÷ 75 = 0.016833, so her version appears to assume ~75 per case. Ketchup and pizza box per-item values match ours exactly. **Which case count is right for the clamshell?**

### 3e. Her "values shifted when Matt added an item" memory — a real bug, though not the cause here

`lib/inventory/getSingleUseProducts.ts` concatenates the upstream and Taco Bell catalogs. **IDs 111–118 exist in both and are different products**: 115 is an 8" Pizza box (Corrugated Cardboard, 0.1365 lb) upstream and a Chip Bag (Paper) in Taco Bell; 118 is a 16" Pizza box vs a Plastic Bag. Upstream 112–118 were added later — exactly the "added an item" event she remembers. Lookups are `products.find(...)`, so upstream wins today and her test resolved correctly. But the picker lists duplicate IDs, and a line item saved against a Taco Bell bag will silently resolve to an upstream pizza box — **wrong material and weight, while counts and costs stay correct**, which is precisely this bug's signature. Needs de-duplication (namespace IDs per catalog, or renumber).

Also: `lib/inventory/single-use-products-data.csv` (111 rows, at the repo root of `lib/inventory/`) is **orphaned** — nothing reads it; only `assets/upstream/single-use-products-data.csv` (118 rows) loads. It should be deleted; it misleads anyone auditing product data.

### Recommended follow-up

Encode this spreadsheet as a **Golden Dataset** so all three metrics become an automated regression test, then fix in order: 3b (code), 3a (data decision), 3c (methodology decision), 3e (data integrity).

## 4. Open QA items needing her input

- **Waste hauling "add-back"** — traced the math; forecast uses the user-entered forecasted monthly bill × 12, entered once, no add-back. The misleading hover explanation (claimed volume-derived, $22/cu-yd) has been fixed. Ask her to retest with her project and confirm, or send the project ID.
- **"one small error" in item counts/financials** — she mentions one remaining small financial error but didn't specify it. Need the detail.
