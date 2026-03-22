# Prompt: Build a Single-Use vs Reusable Foodware Savings Calculator

## Context

Build a web-based calculator that helps organizations quantify the financial and environmental impact of switching from single-use disposable foodware (cups, plates, containers, utensils) to reusable alternatives. The calculator compares a **baseline** (current single-use purchasing) against a **forecast** (after switching to reusables) across three dimensions: cost, greenhouse gas emissions, water usage, and solid waste.

## Core Calculation Architecture

The calculator uses a **baseline vs forecast** pattern for every metric:

```
BASELINE = Current state (all single-use purchasing + current utilities + waste hauling)
FORECAST = Future state (reduced single-use + reusable purchases + dishwashing costs + labor)
CHANGE   = forecast - baseline (negative values = savings/improvement)
CHANGE%  = (change / baseline) × 100
```

Every metric output should include: `{ baseline, forecast, change, changePercent }`.

---

## Required Inputs

### Organization/Project Info
- **US State** — determines utility rates (electric, gas, water)
- **Project type** — "default" (ongoing operations) or "event" (one-time event)

### Single-Use Products (line items)
Each item needs:
- Product description, category (e.g., "Cups", "Plates", "Containers"), type, size
- `caseCost` — cost per case ($)
- `casesPurchased` — number of cases purchased per period
- `unitsPerCase` — individual items per case
- `frequency` — how often purchased: Daily(×365), Weekly(×52), Monthly(×12), Quarterly(×4), Annually(×1), One-Time(×0)
- `itemWeight` — weight per item (lbs)
- `primaryMaterial` — material ID (see material factors below)
- `primaryMaterialWeightPerUnit` — material weight per item (lbs)
- `secondaryMaterial` (optional) — for items with mixed materials
- `secondaryMaterialWeightPerUnit` (optional)
- `boxWeight` — shipping box weight (lbs)
- `newCasesPurchased` — reduced quantity after switching (often 0)

### Reusable Products (line items)
Each item needs:
- Same product fields as single-use
- `annualRepurchasePercentage` — % of items replaced annually (breakage/loss)
- `returnRate` / `shrinkageRate` — what % of items are returned vs lost

### Dishwashers
- Dishwasher type (under-counter, single-tank door, multi-tank conveyor, flight)
- Temperature setting (high or low)
- EnergyStar certified (yes/no)
- Racks per day (baseline and forecast)
- Fuel type for water heating (electric or natural gas)

### Other Costs
- Labor costs (annual or one-time, with frequency)
- Other expenses (annual or one-time)
- Waste hauling (monthly baseline and forecast costs)

---

## Material Emission & Water Factors

### Single-Use Materials
| Material | MTCO2e/lb | Water (gal/lb) |
|----------|-----------|-----------------|
| Paper | 0.004685 | 3.694 |
| Plastic #1 PET | 0.0011 | 5.217 |
| Plastic #5 PP | 0.000775 | 3.396 |
| EPS Foam (Styrofoam) | 0.001265 | 9.275 |
| Aluminum | 0.003755 | 8.762 |
| Molded Fiber | 0.00172 | 3.694 |
| Wood | 0.004685 | 3.694 |
| LDPE | 0.000865 | 3.396 |
| Compostable PLA | 0.00138 | 3.396 |

### Reusable Materials
| Material | MTCO2e/lb | Water (gal/lb) |
|----------|-----------|-----------------|
| Glass | 0.00028 | 2.590 |
| Stainless Steel | 0.00119 | 6.737 |
| Aluminum | 0.003085 | 8.762 |
| Polypropylene | 0.000775 | 3.966 |
| Polycarbonate | 0.00075 | 2.932 |
| Ceramic | 0.00028 | 2.590 |
| HDPE | 0.000865 | 3.396 |
| SAN | 0.00075 | 2.932 |
| Melamine | 0.00172 | 3.694 |

### Packaging
- Corrugated Cardboard: 0.002885 MTCO2e/lb, 3.694 gal/lb water

### Transportation
- Shipping distance: 19,270 nautical miles (average global supply chain)
- Transportation CO2 factor: 0.000000021 MTCO2e per nautical mile per lb
- Combined factor: ~0.000406 MTCO2e/lb

---

## Calculation Formulas

### 1. Financial Calculations

**Annual Cost Change:**
```
singleUseCost_baseline = Σ(caseCost × casesPurchased × annualOccurrence)
singleUseCost_forecast = Σ(caseCost × newCasesPurchased × annualOccurrence)

reusableCost = Σ(caseCost × casesPurchased)  // one-time purchase
reusableAnnualRepurchase = Σ(caseCost × casesPurchased × repurchasePercentage)

utilityCost = dishwasherElectric + dishwasherGas + dishwasherWater  // see dishwasher section

laborCost = Σ(cost × annualOccurrence)  // only items with recurring frequency
otherExpenses = Σ(cost × annualOccurrence)

wasteHauling_baseline = monthlyBaseline × 12
wasteHauling_forecast = monthlyForecast × 12

annualBaseline = singleUseCost_baseline + utilityCost_baseline + wasteHauling_baseline
annualForecast = singleUseCost_forecast + reusableAnnualRepurchase + laborCost + otherExpenses + utilityCost_forecast + wasteHauling_forecast
annualChange = annualForecast - annualBaseline
```

**One-Time Costs:**
```
oneTimeCosts = reusableCost + oneTimeLaborCosts + oneTimeOtherExpenses
```

**ROI & Payback:**
```
annualROI% = (|annualSavings| / oneTimeCosts) × 100
paybackMonths = ceil(|oneTimeCosts / annualSavings| × 12)
```

### 2. GHG Emissions (MTCO2e)

**Per line item (single-use or reusable):**
```
annualWeight = itemWeight × unitsPerCase × casesPurchased × annualOccurrence
materialGHG = primaryMaterialWeight × mtco2ePerLb
            + secondaryMaterialWeight × mtco2ePerLb  (if applicable)
transportGHG = totalWeight × TRANSPORTATION_CO2_FACTOR
shippingBoxGHG = boxWeight × CORRUGATED_CARDBOARD_GAS + boxWeight × TRANSPORTATION_CO2_FACTOR
totalItemGHG = materialGHG + transportGHG + shippingBoxGHG
```

**Dishwasher GHG:**
```
waterHeaterEfficiency = 0.98 (electric) or 0.80 (gas)
co2Factor = 1.6 lbs CO2/therm (electric) or 11.7 lbs CO2/therm (gas)

heatEnergy = (tempRise°F × 1.0 BTU/lb/°F × 8.2 lb/gal × gallonsUsed) / efficiency
ghg = heatEnergy × co2Factor / 2204.62  // convert lbs to MTCO2e
```

**Total GHG by source:**
```
landfillWaste = Σ(material + transport CO2 for all items)
dishwashing = dishwasher GHG
shippingBox = Σ(box CO2 for all items)
total = landfillWaste + dishwashing + shippingBox
```

### 3. Water Usage (gallons)

**Per line item:**
```
annualWeight = materialWeightPerUnit × unitsPerCase × casesPurchased × annualOccurrence
waterUsage = annualWeight × waterUsageGalPerLb  // by material type
```

**Dishwasher water:** varies by type (see dishwasher profiles below)

**Total water = landfill water (manufacturing) + dishwashing water**

### 4. Solid Waste (lbs)

```
waste_baseline = Σ(itemWeight × unitsPerCase × casesPurchased × annualOccurrence)
waste_forecast = Σ(itemWeight × unitsPerCase × newCasesPurchased × annualOccurrence)
              + Σ(reusableItemWeight × casesPurchased × repurchasePercentage)  // replacements
```

### 5. Environmental Break-Even

How many months until the environmental cost of manufacturing reusables is offset by savings:

```
embodiedCO2 = Σ for each reusable item:
    totalMass × materialMtco2ePerLb
  + totalMass × TRANSPORTATION_FACTOR
  + boxWeight × CORRUGATED_CARDBOARD_GAS

annualCO2Savings = |min(totalGHGChange, 0)|  // only if there are savings

breakEvenMonths = ceil((embodiedCO2 / annualCO2Savings) × 12)
```

Same formula applies for water break-even and waste break-even using respective units.

---

## Dishwasher Water Consumption Profiles

Water usage in gallons per rack, by dishwasher type × temperature × EnergyStar:

| Type | Temp | EnergyStar | Gal/Rack |
|------|------|------------|----------|
| Under Counter | Low | No | 1.73 |
| Under Counter | Low | Yes | 1.39 |
| Under Counter | High | No | 1.73 |
| Under Counter | High | Yes | 0.86 |
| Single Tank Door | Low | No | 2.84 |
| Single Tank Door | Low | Yes | 1.19 |
| Single Tank Door | High | No | 2.84 |
| Single Tank Door | High | Yes | 0.89 |
| Multi Tank Conveyor | Low | No | 4.0 |
| Multi Tank Conveyor | Low | Yes | 3.0 |
| Multi Tank Conveyor | High | No | 4.0 |
| Multi Tank Conveyor | High | Yes | 2.975 |

Temperature rise for water heating:
- Building water heater: 70°F
- Booster heater: 40°F (high temp only)

---

## Utility Rates by US State

Use state-level utility rates. Sample values:
- **Electric**: ranges from $0.07/kWh (Louisiana) to $0.35/kWh (Hawaii), national average ~$0.13/kWh
- **Natural Gas**: $0.92/therm (uniform default)
- **Water**: $6.98 per 1,000 gallons (national average)

---

## Output Structure

The calculator should produce these result groups:

### Annual Summary
- Total cost change ($)
- Total GHG change (MTCO2e)
- Total waste change (lbs)
- Product count changes

### Financial Results
- Annual cost breakdown (baseline, forecast, change, change%)
- One-time costs (reusable product purchases + setup)
- ROI percentage
- Payback period (months)

### Environmental Results
- GHG emissions by source (landfill waste, dishwashing, shipping boxes)
- Water usage by source (manufacturing, dishwashing)
- Solid waste (product weight, shipping box weight)
- Environmental break-even (months for CO2, water, waste)

### Single-Use Product Results
- Cost, GHG, water, units — all with baseline/forecast/change
- Breakdowns by material, product type, and product category

### Reusable Product Results
- Same metrics as single-use
- Return rate / shrinkage tracking
- Dishwashing impact (water, energy, cost)

### Bottle/Water Station Results (optional)
```
bottlesSaved = totalWaterGallons / 0.132 gallons per bottle
```

---

## Event Project Variations

For one-time event projects, the calculation differs:
- No frequency multiplier (everything is one-time)
- Foodware items link a single-use product to its reusable replacement
- Return percentage determines loss rate: `lossRate = 1 - (returnPercentage / 100)`
- Truck transportation GHG: `(totalWeight/2000) × 0.37037616 MTCO2e/ton/mile × distance`
- Racks calculated from items: `totalRacks = Σ(units / reusableItemCountPerRack)`

---

## Standards Alignment

This methodology aligns with:
- **GHG Protocol** — transparency guidance for scope 3 emissions accounting
- **W3C PROV** — data provenance standards for traceability
- **DAMA Data Governance** — principles for factor management and versioning
- **EPA emission factors** — source for CO2 emission constants

---

## Implementation Notes

- All weights are in **pounds (lbs)**
- All GHG values are in **metric tons of CO2 equivalent (MTCO2e)**
- Water in **gallons**
- Currency in **USD**
- Payback period uses **ceiling** function (round up to whole months)
- Financial values to 2 decimal places, environmental to 2 decimal places
- Negative change values indicate savings/improvement
- The frequency multiplier converts any purchase period to annual: Daily=365, Weekly=52, Monthly=12, Quarterly=4, Annually=1, One-Time=0
