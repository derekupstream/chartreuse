/**
 * Material- and wash-aware impact factors for the RSP Ingestion Model.
 * Replaces the flat per-unit factors in lib/rsp/impactFactors.ts with values that
 * vary by material, wash facility, transport mode, and single-use baseline.
 *
 * Numbers are deliberately approximate — they let the engine produce plausible
 * outputs while leaving the door open to swap in DB-backed Factor lookups in v2.
 * EPA WARM and DOE were the rough sources.
 */

// kg CO2e per kg of material produced (cradle-to-gate)
export const MATERIAL_GHG_PER_KG: Record<string, number> = {
  stainless_steel: 6.15,
  polypropylene: 1.95,
  aluminum: 11.46,
  glass: 0.85,
  melamine: 4.4,
  polycarbonate: 7.6,
  bamboo: 1.2,
  ceramic: 1.0,
  default: 4.0
};

// gallons of water consumed manufacturing 1 kg of material
export const MATERIAL_WATER_GAL_PER_KG: Record<string, number> = {
  stainless_steel: 35,
  polypropylene: 12,
  aluminum: 110,
  glass: 6,
  melamine: 28,
  polycarbonate: 50,
  bamboo: 4,
  ceramic: 3,
  default: 25
};

// Single-use baseline (kg CO2e per item-weight kg)
export const SINGLE_USE_GHG_PER_KG: Record<string, number> = {
  polystyrene_foam: 3.2,
  paper: 1.6,
  pet: 2.7,
  pp: 1.95,
  pla: 2.1,
  default: 2.5
};

// Avg single-use replacement weight in kg (approx 1 single-use replaced per reusable use)
export const SINGLE_USE_WEIGHT_KG: Record<string, number> = {
  polystyrene_foam: 0.005,
  paper: 0.012,
  pet: 0.014,
  pp: 0.009,
  pla: 0.011,
  default: 0.01
};

// Per-cycle wash impact + how many items go through one cycle
export const WASH_FACILITY: Record<
  string,
  { waterGalPerCycle: number; energyKwhPerCycle: number; itemsPerCycle: number }
> = {
  commercial_dishwasher: { waterGalPerCycle: 1.2, energyKwhPerCycle: 0.32, itemsPerCycle: 30 },
  industrial: { waterGalPerCycle: 2.4, energyKwhPerCycle: 0.55, itemsPerCycle: 80 },
  manual: { waterGalPerCycle: 0.05, energyKwhPerCycle: 0.005, itemsPerCycle: 1 }
};

// kg CO2e per kWh by energy source. Hydropower is near-zero (small ops/maintenance footprint).
export const ENERGY_GHG_KG_PER_KWH: Record<string, number> = {
  grid_electric: 0.4,
  natural_gas: 0.2,
  solar: 0.04,
  hydro: 0.02,
  wind: 0.012,
  default: 0.4
};

// Transport: kg CO2e per mile (vehicle-level — not item-level)
export const TRANSPORT_GHG_KG_PER_MILE: Record<string, number> = {
  electric_van: 0.16,
  diesel_truck: 1.05,
  gas_van: 0.55,
  bike_courier: 0.0,
  default: 0.6
};
