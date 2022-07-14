import { Frequency, getannualOccurrence } from '../constants/frequency'
import { ANNUAL_DISHWASHER_CONSUMPTION, BUILDING_WATER_HEATER, BOOSTER_WATER_HEATER } from '../constants/dishwashers'
import { DishWasherStatic, DishWasherOptions, ProjectInput } from '../types/projects'
import { getSingleUseProductSummary } from './single-use-product-results'
import { getChangeSummaryRowRounded, round } from '../utils'

interface FinancialResults {
  annualCostChanges: AnnualCostChanges
  oneTimeCosts: OneTimeCosts
  summary: FinancialSummary
}

export function getFinancialResults(project: ProjectInput): FinancialResults {
  const annualCostChanges = calculateAnnualCostChanges(project)
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
  otherExpenses: number
  laborCosts: number
  reusableProductCosts: number
  singleUseProductChange: number
  utilities: number
  wasteHauling: number
  baseline: number
  followup: number
  change: number // E46
  changePercent: number
}

function calculateAnnualCostChanges(project: ProjectInput): AnnualCostChanges {
  const otherExpensesCostTotal = project.otherExpenses.reduce((sum, item) => {
    if (item.frequency === 'One Time') {
      return sum
    }
    const annualCost = item.cost * getannualOccurrence(item.frequency)
    return sum + annualCost
  }, 0)

  const laborCostsTotal = project.laborCosts.reduce((sum, item) => {
    if (item.frequency === 'One Time') {
      return sum
    }
    const annualCost = item.cost * getannualOccurrence(item.frequency)
    return sum + annualCost
  }, 0)

  const additionalCostsTotal = otherExpensesCostTotal + laborCostsTotal

  const reusableProductCosts = project.reusableItems.reduce((sum, item) => {
    const oneTimeCost = item.caseCost * item.casesPurchased
    return sum + oneTimeCost * item.annualRepurchasePercentage
  }, 0)

  const singleUseProductSummary = getSingleUseProductSummary(project.singleUseItems)

  const singleUseProductChange = singleUseProductSummary.annualCost.change

  let utilitiesBaseline = 0
  let utilitiesFollowup = 0
  for (const dishwasher of project.dishwashers) {
    utilitiesBaseline += dishwasherAnnualCost(dishwasher, { operatingDays: dishwasher.operatingDays, racksPerDay: dishwasher.racksPerDay }, project.utilityRates)
    utilitiesFollowup += dishwasherAnnualCost(dishwasher, { operatingDays: dishwasher.newOperatingDays, racksPerDay: dishwasher.newRacksPerDay }, project.utilityRates)
  }
  const utilitiesChange = utilitiesFollowup - utilitiesBaseline

  const wasteHaulingBaseline = getBaselineWasteHaulingAnnualCost(project)
  const wasteHaulingForecast = getForecastWasteHaulingAnnualCost(project)
  const wasteHaulingChange = wasteHaulingForecast - wasteHaulingBaseline

  const baseline = singleUseProductSummary.annualCost.baseline + utilitiesBaseline + wasteHaulingBaseline
  const followup = additionalCostsTotal + reusableProductCosts + singleUseProductSummary.annualCost.followup + utilitiesFollowup + wasteHaulingForecast

  return {
    additionalCosts: additionalCostsTotal,
    otherExpenses: otherExpensesCostTotal,
    laborCosts: laborCostsTotal,
    reusableProductCosts,
    singleUseProductChange,
    utilities: round(utilitiesChange, 2),
    wasteHauling: round(wasteHaulingChange, 2),
    ...getChangeSummaryRowRounded(baseline, followup),
  }
}

function getAdditionalCosts({ otherExpenses, laborCosts }: ProjectInput) {
  return otherExpenses.map(({ cost, frequency }) => ({ cost, frequency })).concat(laborCosts)
}

export function dishwasherAnnualCostBreakdown(dishwasher: DishWasherStatic, options: DishWasherOptions, rates: ProjectInput['utilityRates']) {
  const { electricUsage, gasUsage, waterUsage } = dishwasherUtilityUsage(dishwasher, options)

  const electric = electricUsage * rates.electric
  const gas = gasUsage * rates.gas
  const water = (waterUsage * rates.water) / 1000

  return { electric, gas, water }
}

function dishwasherAnnualCost(dishwasher: DishWasherStatic, options: DishWasherOptions, rates: ProjectInput['utilityRates']) {
  const { electric, gas, water } = dishwasherAnnualCostBreakdown(dishwasher, options, rates)
  return round(electric + gas + water, 2)
}

// Hidden: dishwasher calulcations: C85, C86
export function dishwasherUtilityUsage(dishwasher: DishWasherStatic, options: DishWasherOptions) {
  const washerProfile = ANNUAL_DISHWASHER_CONSUMPTION.find(conf => {
    return dishwasher.temperature === conf.temperature && dishwasher.type === conf.type && dishwasher.energyStarCertified === conf.energyStar
  })

  if (!washerProfile) {
    throw new Error('Unidentified dishwasher configuration')
  }

  const operatingDaysPerYear = options.operatingDays * 52
  const waterUsage = washerProfile.values.waterUsePerRack * options.racksPerDay * operatingDaysPerYear // gallons per year

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

function getBaselineWasteHaulingAnnualCost(project: ProjectInput) {
  return project.wasteHauling.reduce((sum, item) => sum + item.monthlyCost, 0) * 12
}

function getForecastWasteHaulingAnnualCost(project: ProjectInput) {
  return project.wasteHauling.reduce((sum, item) => sum + item.newMonthlyCost, 0) * 12
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
  const additionalCosts = getAdditionalCosts(project)
    .filter(cost => cost.frequency === 'One Time')
    .reduce((sum, item) => sum + item.cost, 0)

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
  const annualCost = calculateAnnualCostChanges(project).change
  const oneTimeCost = calculateOneTimeCosts(project).total

  // =IF(E31<0,ROUND((E38/-E46)*12,1),"--")
  let paybackPeriodsMonths: number = 0 // Ask Sam: what should UI look like if payback period is -1?
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
