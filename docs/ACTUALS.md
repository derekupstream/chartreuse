# Actuals Workflow — Gap Analysis & Recommendations

Analysis of the RSP API integration after testing 20 Sharewares API calls across 5 client venues.

---

## Critical Gaps in Current Impact Factors

### 1. Flat per-unit factors ignore material type

`RSP_IMPACT_FACTORS` uses a single `cup: { co2AvoidedKg: 0.009 }` factor regardless of whether the cup is polypropylene, aluminum, stainless steel, or glass. A 16oz stainless steel cup (0.31 lbs) replacing a polystyrene foam cup has vastly different impact than an 8oz PP cup replacing a paper cup.

**Need:** The API should capture `cup_material` or `product_id` to look up material-specific WARM emission factors.

### 2. No knowledge of what single-use item is being replaced

The API only receives `reusable_type: "cup"` — it doesn't know if each reusable cup replaces a paper cup, PS foam cup, PET cup, or nothing. The single-use item's material drives the "avoided" side of the equation.

**Need:** Either `single_use_material` field per event, or a per-client configuration of "default single-use item replaced" per reusable type.

### 3. No item weight/size data

The product CSV has detailed weights (e.g., 0.09 lbs for PP cup vs 0.31 lbs for stainless steel). Impact should scale by weight, not just unit count.

**Need:** `size` field (8oz/12oz/16oz) per event, or weight-per-unit.

### 4. No dishwashing/washing impact captured

The methodology explicitly states reusable GHG includes dishwashing energy. RSP services wash items centrally but the API captures zero washing data.

**Need:** Per-period washing data: `wash_cycles`, `water_gallons_used`, `energy_kwh` (or at minimum, facility energy source).

### 5. No transport/logistics emissions

RSP services transport reusables to/from venues — the methodology's "on-site washing" assumption breaks.

**Need:** `transport_miles` or `transport_mode` per delivery, or a per-client distance estimate.

---

## Fields Needed on Organization (RSP Profile)

| Field | Purpose |
|-------|---------|
| `washFacilityType` | `commercial_dishwasher` \| `industrial` \| `manual` — affects water/energy per cycle |
| `washEnergySource` | `grid_electric` \| `natural_gas` \| `solar` — affects CO2 per wash |
| `washWaterSource` | `municipal` \| `reclaimed` — affects water factor |
| `avgTransportMilesPerDelivery` | Average round-trip miles for delivery routes |
| `transportVehicleType` | `electric_van` \| `diesel_truck` \| `bike_courier` |
| `defaultSingleUseMaterial` | What they claim to replace (e.g., `polystyrene_foam`) |
| `reusableCatalog` | JSON mapping of their product types to materials + weights |
| `operatingState` | State for utility rate lookup (currently only on Account) |
| `certifications` | Any third-party verification of their impact claims |

---

## Fields Needed per API Call (Usage Submission)

| Field | Purpose |
|-------|---------|
| `reusable_material` | `polypropylene` \| `aluminum` \| `stainless_steel` \| etc. |
| `reusable_size` | `8oz` \| `12oz` \| `16oz` (affects weight per unit) |
| `single_use_replaced` | Material of the item being replaced |
| `wash_cycles` | Number of wash cycles in this period |
| `water_used_gallons` | Actual water consumption for washing |
| `energy_used_kwh` | Actual energy consumption for washing |
| `delivery_trips` | Number of delivery round-trips |
| `loss_count` | Units lost/broken (affects lifecycle calculation) |

---

## Fields Needed per Account (Venue/Client Data)

| Field | Purpose |
|-------|---------|
| `venueType` | `university` \| `stadium` \| `hospital` \| `corporate` \| `festival` |
| `venueState` | For state-specific utility/emission rates |
| `venueCity` | For regional energy grid factors |
| `avgDailyCovers` | Daily meal count — helps validate unit volumes |
| `previousSingleUseVendor` | Context for what's being replaced |
| `previousSingleUseMaterials` | JSON: `{ cup: "polystyrene", plate: "paper" }` |
| `contractStartDate` | When reuse service began (for timeline tracking) |
| `serviceFrequency` | `daily` \| `weekly` \| `per_event` |

---

## Questions for Sharewares / RSP Partners

1. **What single-use items are your clients replacing?** Do all your clients replace the same material (e.g., polystyrene cups), or does it vary by venue?
2. **What cup materials do you actually provide?** The API just says "cup" — we need to know if it's PP, aluminum, stainless steel, etc.
3. **Do you track washing data?** Water gallons per cycle, energy per cycle, cycles per period?
4. **What's your delivery logistics?** Average miles per route, vehicle type, frequency?
5. **What's your loss/breakage rate?** How many cups per 1000 are lost or broken per cycle?
6. **Do you have venue-level data?** Square footage, daily covers, number of service points?
7. **What's the lifespan assumption?** How many uses before a cup is retired? This is critical for amortizing the reusable's embodied carbon.

---

## Prioritized Implementation Path

### Phase 1 — Quick Wins

- Add `reusable_material` and `single_use_replaced` to the API events schema
- Add `previousSingleUseMaterials` JSON field to Account
- Use material-specific WARM factors from the existing Factor Library instead of flat per-unit estimates

### Phase 2 — Washing & Transport

- Add RSP org profile fields for wash facility + transport
- Add `wash_cycles` and `delivery_trips` to API events
- Calculate washing GHG using the existing dishwashing calculator logic

### Phase 3 — Full Lifecycle

- Per-use amortization of reusable embodied carbon (uses / lifespan)
- Regional energy grid factors by venue state
- Loss/breakage tracking for accurate lifecycle accounting
