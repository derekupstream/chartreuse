import { Dishwasher as PrismaDishwasher } from '@prisma/client'
import { dishwasherUtilityUsage, dishwasherAnnualCostBreakdown } from 'lib/calculator/outputs/financial-results'
import { DishWasher } from 'lib/calculator/types/projects'
import { getUtilityGasEmissions } from 'lib/calculator/outputs/environmental-results'
import { getUtilitiesByState, USState } from 'lib/calculator/constants/utilities'

export type DishwasherStats = {
  electricUsage: number
  electricCO2Weight: number
  electricCost: number
  gasUsage: number
  gasCO2Weight: number
  gasCost: number
  waterUsage: number
  waterCost: number
}

export function getDishwasherStats({ state, dishwasher }: { state: USState; dishwasher: PrismaDishwasher }): DishwasherStats {
  const rates = getUtilitiesByState(state)
  const usage = dishwasherUtilityUsage(dishwasher as DishWasher)
  const costs = dishwasherAnnualCostBreakdown(dishwasher as DishWasher, rates)
  const emissions = getUtilityGasEmissions(dishwasher as DishWasher)
  const stats: DishwasherStats = {
    electricUsage: usage.electricUsage,
    electricCO2Weight: emissions.electric,
    electricCost: costs.electric,
    gasUsage: usage.gasUsage,
    gasCO2Weight: emissions.gas,
    gasCost: costs.gas,
    waterUsage: usage.waterUsage,
    waterCost: costs.water,
  }
  return stats
}
