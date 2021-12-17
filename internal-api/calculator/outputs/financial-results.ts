import { getAnnualOccurence } from '../constants/frequency'
import { ANNUAL_DISHWASHER_CONSUMPTION, BUILDING_WATER_HEATER, BOOSTER_WATER_HEATER } from '../constants/dishwashers'
import { DishWasher, ProjectInput } from '../types/projects'
import { getSingleUseProductSummary } from './single-use-product-results'
import { round } from '../utils'

interface FinancialResults {
  annualCostChanges: AnnualCostChanges
  oneTimeCosts: OneTimeCosts
  summary: FinancialSummary
}

export function getFinancialResults(project: ProjectInput): FinancialResults {
  const annualCostChanges = calculateAnnualCosts(project)
  const oneTimeCosts = calculateOneTimeCosts(project)
  const summary = calculateSummary(project)

  return {
    annualCostChanges,
    oneTimeCosts,
    summary,
  }
}

/**
 * Annual Cost Changes: Calculate the difference in costs by the end of the first year
 */

// all values in dollars
interface AnnualCostChanges {
  additionalCosts: number
  reusableProductCosts: number
  singleUseProductChange: number
  utilities: number
  wasteHauling: number
  total: number // E46
}

function calculateAnnualCosts(project: ProjectInput): AnnualCostChanges {

  const additionalCosts = project.additionalCosts.reduce((sum, item) => {
    if (item.frequency === 'One Time') {
      return sum
    }
    const annualCost = item.cost * getAnnualOccurence(item.frequency)
    return sum + annualCost
  }, 0)

  const reusableProductCosts = project.reusableItems.reduce((sum, item) => {
    const oneTimeCost = item.caseCost * item.casesPurchased
    return sum + oneTimeCost * item.annualRepurchasePercentage
  }, 0)

  const singleUseProductSummary = getSingleUseProductSummary(project.singleUseItems)

  const singleUseProductChange = singleUseProductSummary.annualCost.change

  const utilities = project.dishwasher ? dishwasherAnnualCost(project.dishwasher, project.utilityRates) : 0

  const wasteHauling = wasteHaulingAnnualCost(project)

  const total = additionalCosts + reusableProductCosts + singleUseProductChange + utilities + wasteHauling

  return {
    additionalCosts,
    reusableProductCosts,
    singleUseProductChange,
    utilities,
    wasteHauling,
    total: round(total, 2),
  }
}

export function dishwasherAnnualCostBreakdown(dishwasher: DishWasher, rates: ProjectInput['utilityRates']) {
  const { electricUsage, gasUsage, waterUsage } = dishwasherUtilityUsage(dishwasher)

  const electric = electricUsage * rates.electric
  const gas = gasUsage * rates.gas
  const water = (waterUsage * rates.water) / 1000

  return { electric, gas, water }
}

function dishwasherAnnualCost(dishwasher: DishWasher, rates: ProjectInput['utilityRates']) {
  const { electric, gas, water } = dishwasherAnnualCostBreakdown(dishwasher, rates)
  return round(electric + gas + water, 2)
}

// Hidden: dishwasher calulcations: C85, C86
export function dishwasherUtilityUsage(dishwasher: DishWasher) {
  const washerProfile = ANNUAL_DISHWASHER_CONSUMPTION.find(conf => {
    return dishwasher.temperature === conf.temperature && dishwasher.type === conf.type && dishwasher.energyStarCertified === conf.energyStar
  })

  if (!washerProfile) {
    throw new Error('Unidentified dishwasher configuration')
  }

  const operatingDaysPerYear = dishwasher.operatingDays * 52
  const waterUsage = washerProfile.values.waterUsePerRack * dishwasher.additionalRacksPerDay * operatingDaysPerYear // gallons per year

  // Hidden: dishwasher calulcations: C85, C86
  let electricUsage = 0
  let gasUsage = 0

  if (dishwasher.buildingWaterHeaterFuelType === 'Electric') {
    electricUsage = waterUsage * BUILDING_WATER_HEATER.electricEnergyUsage // kWh per year
    // add booster energy, if applicable
    if (dishwasher.temperature === 'High') {
      const boosterConsumption = waterUsage * BOOSTER_WATER_HEATER.electricEnergyUsage
      electricUsage += boosterConsumption
    }
  } else if (dishwasher.buildingWaterHeaterFuelType === 'Gas') {
    gasUsage = waterUsage * BUILDING_WATER_HEATER.gasEnergyUsage // therm per year
    // add booster energy, if applicable
    if (dishwasher.temperature === 'High') {
      const boosterConsumption = waterUsage * BOOSTER_WATER_HEATER.gasEnergyUsage
      gasUsage += boosterConsumption
    }
  }

  return { electricUsage, gasUsage, waterUsage }
}

function wasteHaulingAnnualCost(project: ProjectInput) {
  const baseWasteHaulingCost = project.wasteHauling.reduce((sum, item) => sum + item.monthlyCost, 0)
  const newWasteHaulingCost = project.wasteHauling.reduce((sum, item) => sum + item.newMonthlyCost, 0)
  return 12 * (newWasteHaulingCost - baseWasteHaulingCost)
}

/**
 * One time costs
 */

// all values in dollars
interface OneTimeCosts {
  additionalCosts: number
  reusableProductCosts: number
  total: number // E38
}

function calculateOneTimeCosts(project: ProjectInput): OneTimeCosts {
  const additionalCosts = project.additionalCosts.filter(cost => cost.frequency === 'One Time').reduce((sum, item) => sum + item.cost, 0)

  const reusableProductCosts = project.reusableItems.reduce((sum, item) => {
    return sum + item.caseCost * item.casesPurchased
  }, 0)

  return {
    additionalCosts,
    reusableProductCosts,
    total: additionalCosts + reusableProductCosts,
  }
}

/**
 * Financial Summary
 */

interface FinancialSummary {
  annualCost: number
  annualROIPercent: number
  oneTimeCost: number
  paybackPeriodsMonths: number
}

function calculateSummary(project: ProjectInput): FinancialSummary {
  const annualCost = calculateAnnualCosts(project).total
  const oneTimeCost = calculateOneTimeCosts(project).total

  // =IF(E31<0,ROUND((E38/-E46)*12,1),"--")
  let paybackPeriodsMonths: number = -1 // Ask Sam: what should UI look like if payback period is -1?
  if (annualCost < 0) {
    paybackPeriodsMonths = Math.ceil(-1 * (oneTimeCost / annualCost) * 12)
  }

  // =IF(E38<>0,IF(E38+E46>0,"0%",(-E46-E38)/E38),"0%")
  let annualROIPercent: number
  if (oneTimeCost !== 0) {
    if (oneTimeCost + annualCost > 0) {
      annualROIPercent = 0
    } else {
      annualROIPercent = round((100 * (-1 * annualCost - oneTimeCost)) / oneTimeCost, 2)
    }
  } else {
    annualROIPercent = 0
  }
  return {
    annualCost,
    annualROIPercent,
    oneTimeCost,
    paybackPeriodsMonths,
  }
}
