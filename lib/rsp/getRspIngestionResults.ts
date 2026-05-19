/**
 * Real engine for the RSP Ingestion Model. Takes a single time period of usage
 * data submitted by a Reuse Service Provider plus the org profile that contextualizes
 * how those reusables are washed, transported, and what single-use baseline they
 * displace. Produces honest impact + cost numbers.
 *
 * This addresses the five gaps documented in docs/ACTUALS.md:
 *   1. Material-aware factors (per-kg via material lookup, weighted by item weight)
 *   2. Single-use baseline replaced (org-level default, per-row override)
 *   3. Item weight/size data (per-row weightLbsPerItem)
 *   4. Wash impact (per-cycle water + energy by facility/source)
 *   5. Transport impact (per-mile vehicle factor)
 */
import {
  ENERGY_GHG_KG_PER_KWH,
  MATERIAL_GHG_PER_KG,
  MATERIAL_WATER_GAL_PER_KG,
  SINGLE_USE_GHG_PER_KG,
  SINGLE_USE_WEIGHT_KG,
  TRANSPORT_GHG_KG_PER_MILE,
  WASH_FACILITY
} from './rspEngineFactors';

const LBS_PER_KG = 2.20462;

export type RspIngestionInput = {
  period: { dateMin: string; dateMax: string };
  state?: string;
  /** The Account this period belongs to — RSPs report on multiple client venues. */
  client: {
    accountId?: string | null;
    accountName: string;
    venueCategory: string;
  };
  orgProfile: {
    washFacilityType: 'commercial_dishwasher' | 'industrial' | 'manual';
    washEnergySource: 'grid_electric' | 'natural_gas' | 'solar' | 'hydro' | 'wind';
    avgTransportMilesPerDelivery: number;
    transportVehicleType: 'electric_van' | 'diesel_truck' | 'gas_van' | 'bike_courier';
    defaultSingleUseMaterial: 'polystyrene_foam' | 'paper' | 'pet' | 'pp' | 'pla';
    laborCostPerCycle: number; // $ per wash cycle
    transportCostPerMile: number; // $ per mile
  };
  usageRows: Array<{
    reusableType: string; // 'cup' | 'container' | 'bowl' | 'plate' | 'utensil' | 'tray' | ...
    materialType: string; // see MATERIAL_GHG_PER_KG keys
    weightLbsPerItem: number;
    inWarehouseEvents: number;
    outWarehouseEvents: number;
    deliveriesCount: number;
    /** Optional override of the org's default single-use baseline */
    singleUseMaterial?: string;
  }>;
};

export type RspIngestionRowResult = {
  reusableType: string;
  materialType: string;
  itemsCirculated: number;
  itemsAvoided: number;
  reusableEmbodiedKgCo2e: number;
  singleUseAvoidedKgCo2e: number;
  washKgCo2e: number;
  transportKgCo2e: number;
  netGhgKgCo2e: number;
  netWaterGallons: number;
  netWasteLbs: number;
};

export type RspIngestionResults = {
  period: { dateMin: string; dateMax: string };
  perRow: RspIngestionRowResult[];
  totals: {
    totalReusablesCirculated: number;
    totalSingleUseAvoided: number;
    netGhgKgCo2e: number;
    netGhgMtco2e: number;
    netWaterGallons: number;
    netWasteLbs: number;
  };
  costs: {
    totalLaborCost: number;
    totalTransportCost: number;
    netCostChange: number;
  };
};

function resolve<T>(map: Record<string, T>, key: string | undefined): T {
  if (key && map[key] !== undefined) return map[key];
  return map.default;
}

export function getRspIngestionResults(input: RspIngestionInput): RspIngestionResults {
  const { orgProfile, usageRows } = input;
  const wash = resolve(WASH_FACILITY, orgProfile.washFacilityType);
  const energyGhgPerKwh = resolve(ENERGY_GHG_KG_PER_KWH, orgProfile.washEnergySource);
  const transportGhgPerMile = resolve(TRANSPORT_GHG_KG_PER_MILE, orgProfile.transportVehicleType);

  const perRow: RspIngestionRowResult[] = usageRows.map(row => {
    const itemsCirculated = row.outWarehouseEvents;
    const itemWeightKg = (row.weightLbsPerItem || 0) / LBS_PER_KG;

    // Reusable embodied emissions amortized — reusables are produced once but used many
    // times. For a single time period we attribute (1 / 100) of the reusable's full
    // embodied footprint to each use. (Lifespan = 100 uses is a conservative default.)
    const reusableMaterialGhgPerKg = resolve(MATERIAL_GHG_PER_KG, row.materialType);
    const reusableEmbodiedKgCo2e = (reusableMaterialGhgPerKg * itemWeightKg * itemsCirculated) / 100;

    // Single-use baseline (what we avoided)
    const suMaterial = row.singleUseMaterial ?? orgProfile.defaultSingleUseMaterial;
    const suGhgPerKg = resolve(SINGLE_USE_GHG_PER_KG, suMaterial);
    const suWeightKg = resolve(SINGLE_USE_WEIGHT_KG, suMaterial);
    const itemsAvoided = itemsCirculated; // 1:1 replacement
    const singleUseAvoidedKgCo2e = suGhgPerKg * suWeightKg * itemsAvoided;

    // Wash overhead — N items per cycle, so cycles = items / itemsPerCycle
    const washCycles = wash.itemsPerCycle > 0 ? itemsCirculated / wash.itemsPerCycle : itemsCirculated;
    const washWaterGallons = wash.waterGalPerCycle * washCycles;
    const washEnergyKwh = wash.energyKwhPerCycle * washCycles;
    const washKgCo2e = washEnergyKwh * energyGhgPerKwh;

    // Transport (vehicle-level — total miles / deliveries, not per-item)
    const milesThisRow = row.deliveriesCount * orgProfile.avgTransportMilesPerDelivery;
    const transportKgCo2e = milesThisRow * transportGhgPerMile;

    // Water saved = avoided manufacturing water minus wash water
    const reusableWaterGalPerKg = resolve(MATERIAL_WATER_GAL_PER_KG, row.materialType);
    // Amortize the reusable manufacturing water over 100 uses, same as embodied GHG
    const reusableWaterGallons = (reusableWaterGalPerKg * itemWeightKg * itemsCirculated) / 100;
    const singleUseWaterGalPerKg = 8; // approx average for paper/plastic disposables
    const singleUseAvoidedWater = singleUseWaterGalPerKg * suWeightKg * itemsAvoided;
    const netWaterGallons = singleUseAvoidedWater - reusableWaterGallons - washWaterGallons;

    // Waste avoided (in lbs) — single-use weight × items avoided
    const netWasteLbs = suWeightKg * itemsAvoided * LBS_PER_KG;

    const netGhgKgCo2e = singleUseAvoidedKgCo2e - reusableEmbodiedKgCo2e - washKgCo2e - transportKgCo2e;

    return {
      reusableType: row.reusableType,
      materialType: row.materialType,
      itemsCirculated,
      itemsAvoided,
      reusableEmbodiedKgCo2e,
      singleUseAvoidedKgCo2e,
      washKgCo2e,
      transportKgCo2e,
      netGhgKgCo2e,
      netWaterGallons,
      netWasteLbs
    };
  });

  const totalReusablesCirculated = perRow.reduce((s, r) => s + r.itemsCirculated, 0);
  const totalSingleUseAvoided = perRow.reduce((s, r) => s + r.itemsAvoided, 0);
  const netGhgKgCo2e = perRow.reduce((s, r) => s + r.netGhgKgCo2e, 0);
  const netWaterGallons = perRow.reduce((s, r) => s + r.netWaterGallons, 0);
  const netWasteLbs = perRow.reduce((s, r) => s + r.netWasteLbs, 0);

  // Labor: cost per wash cycle × total cycles across all rows
  const totalCycles = perRow.reduce((s, r) => {
    const itemsPerCycle = wash.itemsPerCycle || 1;
    return s + r.itemsCirculated / itemsPerCycle;
  }, 0);
  const totalLaborCost = totalCycles * orgProfile.laborCostPerCycle;
  const totalDeliveries = usageRows.reduce((s, r) => s + r.deliveriesCount, 0);
  const totalMiles = totalDeliveries * orgProfile.avgTransportMilesPerDelivery;
  const totalTransportCost = totalMiles * orgProfile.transportCostPerMile;

  // Cost comparison: assume single-use unit cost ~$0.15 (industry approximation; can be configured per row in v2)
  const SINGLE_USE_COST_PER_ITEM_DEFAULT = 0.15;
  const totalSingleUseAvoidedCost = totalSingleUseAvoided * SINGLE_USE_COST_PER_ITEM_DEFAULT;
  const netCostChange = totalSingleUseAvoidedCost - totalLaborCost - totalTransportCost;

  return {
    period: input.period,
    perRow,
    totals: {
      totalReusablesCirculated,
      totalSingleUseAvoided,
      netGhgKgCo2e,
      netGhgMtco2e: netGhgKgCo2e / 1000,
      netWaterGallons,
      netWasteLbs
    },
    costs: {
      totalLaborCost,
      totalTransportCost,
      netCostChange
    }
  };
}
