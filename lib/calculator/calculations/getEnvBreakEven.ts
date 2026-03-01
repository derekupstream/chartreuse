/**
 * Environmental Break-Even Calculation
 *
 * Parallel to the financial paybackPeriodsMonths. Answers: "How many months until the
 * one-time manufacturing footprint of all reusables purchased is offset by the annual
 * avoided environmental impact?"
 *
 * Formula (CO2 example):
 *   embodiedCO2_mtco2e = Σ reusableItems (with product):
 *     (casesPurchased × unitsPerCase × primaryMaterialWeightPerUnit × MATERIAL_MAP[primaryMaterial].mtco2ePerLb)
 *     + (casesPurchased × boxWeight × CORRUGATED_CARDBOARD_GAS)        — shipping box carbon
 *     + (casesPurchased × unitsPerCase × primaryMaterialWeightPerUnit × TRANSPORTATION_CO2_EMISSIONS_FACTOR)
 *
 *   annualCO2savings_mtco2e = |annualGasEmissionChanges.total.change|
 *
 *   co2BreakEvenMonths = annualCO2savings > 0
 *     ? Math.ceil((embodiedCO2 / annualCO2savings) * 12)
 *     : null
 *
 * Same pattern applies for water (gallons) and waste (lbs).
 *
 * Data science notes:
 *   - Material embodied carbon factors: MATERIAL_MAP[id].mtco2ePerLb (lib/calculator/constants/materials.ts)
 *   - Material embodied water factors:  MATERIAL_MAP[id].waterUsageGalPerLb
 *   - Shipping box factor: CORRUGATED_CARDBOARD_GAS = 0.002885 MTCO2e/lb
 *   - Transportation factor: TRANSPORTATION_CO2_EMISSIONS_FACTOR (overseas cargo, 19,270 nautical miles)
 *   - Embodied waste is approximated as total reusable material mass (eventual end-of-life weight)
 *   - This calculation does NOT yet account for reusable product lifespan (number of uses before
 *     replacement), as durability data is not yet in the product catalog. When durability data is
 *     added, embodied values should be amortized over expected use count.
 */

import type { ProjectInventory } from 'lib/inventory/types/projects';
import { CORRUGATED_CARDBOARD_GAS, MATERIAL_MAP, NO_MATERIAL_ID } from '../constants/materials';
import { TRANSPORTATION_CO2_EMISSIONS_FACTOR } from '../constants/carbon-dioxide-emissions';
import { getAnnualGasEmissionChanges } from './ghg/getAnnualGasEmissionChanges';
import { getAnnualWaterUsageChanges } from './water/getAnnualWaterUsageChanges';
import { getAnnualWasteChanges } from './waste/getAnnualWasteChanges';

export interface EnvBreakEven {
  /** Months until reusable manufacturing CO2 footprint is offset. Null if no annual savings. */
  co2BreakEvenMonths: number | null;
  /** Months until reusable manufacturing water footprint is offset. Null if no annual savings. */
  waterBreakEvenMonths: number | null;
  /** Months until reusable end-of-life waste is offset by diverted single-use waste. Null if no savings. */
  wasteBreakEvenMonths: number | null;
  /** Total upfront manufacturing CO2 footprint of reusables purchased (MTCO2e) */
  embodiedCO2Mtco2e: number;
  /** Annual avoided CO2 emissions (MTCO2e) — denominator */
  annualCO2SavingsMtco2e: number;
  /** Total upfront manufacturing water footprint of reusables purchased (gallons) */
  embodiedWaterGallons: number;
  /** Annual avoided water usage (gallons) — denominator */
  annualWaterSavingsGallons: number;
}

export function getEnvBreakEven(inventory: ProjectInventory): EnvBreakEven {
  let embodiedCO2 = 0;
  let embodiedWater = 0;
  let embodiedWaste = 0;

  for (const item of inventory.reusableItems) {
    if (!item.product) continue;
    const { product, casesPurchased, unitsPerCase } = item;
    if (product.primaryMaterial === NO_MATERIAL_ID) continue;

    const material = MATERIAL_MAP[product.primaryMaterial];
    if (!material) continue;

    const totalUnits = casesPurchased * unitsPerCase;
    const totalMassLbs = totalUnits * product.primaryMaterialWeightPerUnit;

    // CO2: material embodied carbon + transportation
    embodiedCO2 +=
      totalMassLbs * material.mtco2ePerLb +
      totalMassLbs * TRANSPORTATION_CO2_EMISSIONS_FACTOR +
      casesPurchased * product.boxWeight * CORRUGATED_CARDBOARD_GAS;

    // Water: material embodied water
    if (material.waterUsageGalPerLb != null) {
      embodiedWater += totalMassLbs * material.waterUsageGalPerLb;
    }

    // Waste: eventual end-of-life mass of all reusables purchased (proxy for lifecycle waste)
    embodiedWaste += totalMassLbs;
  }

  const annualGHG = getAnnualGasEmissionChanges(inventory);
  const annualWater = getAnnualWaterUsageChanges(inventory);
  const annualWaste = getAnnualWasteChanges(inventory);

  // change = forecast - baseline; for savings, this is negative → abs() gives magnitude of savings
  const annualCO2Savings = Math.abs(Math.min(annualGHG.total.change, 0));
  const annualWaterSavings = Math.abs(Math.min(annualWater.total.change, 0));
  const annualWasteSavings = Math.abs(
    Math.min(annualWaste.disposableProductWeight.change + annualWaste.disposableShippingBoxWeight.change, 0)
  );

  return {
    co2BreakEvenMonths: annualCO2Savings > 0 ? Math.ceil((embodiedCO2 / annualCO2Savings) * 12) : null,
    waterBreakEvenMonths: annualWaterSavings > 0 ? Math.ceil((embodiedWater / annualWaterSavings) * 12) : null,
    wasteBreakEvenMonths: annualWasteSavings > 0 ? Math.ceil((embodiedWaste / annualWasteSavings) * 12) : null,
    embodiedCO2Mtco2e: embodiedCO2,
    annualCO2SavingsMtco2e: annualCO2Savings,
    embodiedWaterGallons: embodiedWater,
    annualWaterSavingsGallons: annualWaterSavings
  };
}
