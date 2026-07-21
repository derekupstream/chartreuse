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

## 3. Open QA items needing her input

- **"All GHG is wrong"** (her CR 2.0 notes) — need the specific project + which number vs what she expected. Proposal: encode her reference spreadsheet as a Golden Dataset so GHG correctness becomes a permanent automated regression test.
- **Waste hauling "add-back"** — traced the math; forecast uses the user-entered forecasted monthly bill × 12, entered once, no add-back. The misleading hover explanation (claimed volume-derived, $22/cu-yd) has been fixed. Ask her to retest with her project and confirm, or send the project ID.
