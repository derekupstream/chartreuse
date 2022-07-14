import { NATURAL_GAS_CO2_EMISSIONS_FACTOR, ELECTRIC_CO2_EMISSIONS_FACTOR } from '../constants/carbon-dioxide-emissions'
import { POUND_TO_TONNE } from '../constants/conversions'
import { CORRUGATED_CARDBOARD, MATERIALS } from '../constants/materials'
import { Frequency, getannualOccurrence } from '../constants/frequency'
import { DishWasherStatic, DishWasherOptions, ProjectInput, SingleUseLineItemPopulated } from '../types/projects'
import { ChangeSummary, getChangeSummaryRow, getChangeSummaryRowRounded, round } from '../utils'
import { dishwasherUtilityUsage } from './financial-results'
import { annualSingleUseWeight } from './single-use-product-results'
import { SingleUseProduct } from '../types/products'

interface EnvironmentalResults {
  annualGasEmissionChanges: AnnualGasEmissionChanges
  annualWasteChanges: AnnualWasteResults
}

export function getEnvironmentalResults(project: ProjectInput): EnvironmentalResults {
  const annualGasEmissionChanges = getAnnualGasEmissionChanges(project)
  const annualWasteChanges = getAnnualWasteChanges(project)

  return {
    annualGasEmissionChanges,
    annualWasteChanges,
  }
}

// all values in MTCO2e
interface AnnualGasEmissionChanges {
  landfillWaste: ChangeSummary
  dishwashing: ChangeSummary
  total: ChangeSummary
}

export function getUtilityGasEmissions(dishwasher: DishWasherStatic, options: DishWasherOptions): { gas: number; electric: number } {
  const { electricUsage, gasUsage } = dishwasherUtilityUsage(dishwasher, options)
  const electric = electricUsage * ELECTRIC_CO2_EMISSIONS_FACTOR
  const gas = gasUsage * NATURAL_GAS_CO2_EMISSIONS_FACTOR
  return { gas, electric }
}

function getAnnualGasEmissionChanges(project: ProjectInput): AnnualGasEmissionChanges {
  const lineItems = project.singleUseItems.map(singleUseItemGasEmissions)
  const landfillWaste = lineItems.reduce((sum, item) => {
    return getChangeSummaryRow(sum.baseline + item.total.baseline, sum.followup + item.total.followup)
  }, getChangeSummaryRow(0, 0))

  // calculate increased dishwasher emissions
  let ghgBaseline = 0
  let ghgFollowup = 0
  for (const dishwasher of project.dishwashers) {
    const baseline = getUtilityGasEmissions(dishwasher, { operatingDays: dishwasher.operatingDays, racksPerDay: dishwasher.racksPerDay })
    ghgBaseline += POUND_TO_TONNE * (baseline.electric + baseline.gas)
    const followup = getUtilityGasEmissions(dishwasher, { operatingDays: dishwasher.newOperatingDays, racksPerDay: dishwasher.newRacksPerDay })
    ghgFollowup += POUND_TO_TONNE * (followup.electric + followup.gas)
  }
  const dishwashing = getChangeSummaryRowRounded(ghgBaseline, ghgFollowup, 2)

  return {
    landfillWaste: getChangeSummaryRowRounded(landfillWaste.baseline, landfillWaste.followup, 2),
    dishwashing,
    total: getChangeSummaryRowRounded(landfillWaste.baseline + dishwashing.baseline, landfillWaste.followup + dishwashing.followup, 2),
  }
}

/**
 *
 * Calculate gas emissions from a single use item.
 * This includes the primary and secondary, and packaging materials.
 *
 * Reference: Sheet 5:Detailed Results
 *
 * */
export function singleUseItemGasEmissions(item: SingleUseLineItemPopulated) {
  const { casesPurchased, frequency, newCasesPurchased, unitsPerCase, product } = item

  const annualOccurrence = getannualOccurrence(frequency)

  // Column: AS
  const primaryGas = calculateMaterialGas(casesPurchased, newCasesPurchased, annualOccurrence, unitsPerCase, product.primaryMaterial, product.primaryMaterialWeightPerUnit)

  // Column: AU: calculate secondary material emissions
  const secondaryGas = calculateMaterialGas(casesPurchased, newCasesPurchased, annualOccurrence, unitsPerCase, product.secondaryMaterial, product.secondaryMaterialWeightPerUnit)

  // Columns: X, Y
  const boxWeight = product.boxWeight
  const annualBoxWeight = boxWeight * casesPurchased * annualOccurrence
  // Columns: AM, AN
  const followupBoxWeight = product.boxWeight
  const followupAnnualBoxWeight = followupBoxWeight * newCasesPurchased * annualOccurrence

  // Column AW: shipping box emissions
  const shippingBoxGas = getChangeSummaryRow(annualBoxWeight * CORRUGATED_CARDBOARD, followupAnnualBoxWeight * CORRUGATED_CARDBOARD)

  // Column: AX
  const total = getChangeSummaryRow(primaryGas.baseline + secondaryGas.baseline + shippingBoxGas.baseline, primaryGas.followup + secondaryGas.followup + shippingBoxGas.followup)

  return {
    primaryGas,
    secondaryGas,
    shippingBoxGas,
    total,
  }
}

/**
  Given a product and change in cases, determine how much gas emissions are reduced

  Example calculations:

  // Column: N, V
  const annualUnits = casesPurchased * product.unitsPerCase * annualOccurrence;
  const annualSecondaryWeight = secondaryMaterialWeightPerUnit * annualUnits;
  // Column: AC, AK
  const followupAnnualUnits = newCasesPurchased * product.unitsPerCase * annualOccurrence;
  const followupAnnualSecondaryWeight = secondaryMaterialWeightPerUnit * followupAnnualUnits;
  // Column: AT
  const changeInSecondaryWeight = followupAnnualSecondaryWeight - annualSecondaryWeight;
  if (epaWARMAssumption && changeInSecondaryWeight > 0) {
    secondaryGHGReduction = -1 * changeInSecondaryWeight * epaWARMAssumption.mtco2ePerLb;
  }
*/
function calculateMaterialGas(casesPurchased: number, newCasesPurchased: number, annualOccurrence: number, unitsPerCase: number, material: number, weightPerUnit: number): ChangeSummary {
  const epaWARMAssumption = MATERIALS.find(m => m.id === material)
  if (!epaWARMAssumption) {
    throw new Error('Could not find EPA Warm assumption for material: ' + material)
  }
  const annualWeight = annualSingleUseWeight(casesPurchased, annualOccurrence, unitsPerCase, weightPerUnit)
  const followupAnnualWeight = annualSingleUseWeight(newCasesPurchased, annualOccurrence, unitsPerCase, weightPerUnit)
  // const changeInWeight = followupAnnualWeight - annualWeight
  // let gasReduction = 0
  // if (changeInWeight !== 0) {
  //   gasReduction = -1 * changeInWeight * epaWARMAssumption.mtco2ePerLb
  // }
  return getChangeSummaryRow(annualWeight * epaWARMAssumption.mtco2ePerLb, followupAnnualWeight * epaWARMAssumption.mtco2ePerLb)
}

// all values in pounds
interface AnnualWasteResults {
  disposableProductWeight: ChangeSummary
  disposableShippingBoxWeight: ChangeSummary
  total: ChangeSummary
}

function getAnnualWasteChanges(project: ProjectInput): AnnualWasteResults {
  const baselineItems = project.singleUseItems.map(item => ({
    casesPurchased: item.casesPurchased,
    product: item.product,
    frequency: item.frequency,
  }))
  const baseline = getAnnualWaste(baselineItems)

  const followupItems = project.singleUseItems.map(item => ({
    casesPurchased: item.newCasesPurchased,
    product: item.product,
    frequency: item.frequency,
  }))
  const followup = getAnnualWaste(followupItems)

  const disposableProductWeight = getChangeSummaryRowRounded(baseline.productWeight, followup.productWeight)
  const disposableShippingBoxWeight = getChangeSummaryRowRounded(baseline.shippingBoxWeight, followup.shippingBoxWeight)
  const total = getChangeSummaryRowRounded(baseline.productWeight + baseline.shippingBoxWeight, followup.productWeight + followup.shippingBoxWeight)

  return {
    disposableProductWeight,
    disposableShippingBoxWeight,
    total,
  }
}

interface AnnualWaste {
  productWeight: number
  shippingBoxWeight: number
}

function getAnnualWaste(lineItems: { casesPurchased: number; frequency: Frequency; product: SingleUseProduct }[]): AnnualWaste {
  return lineItems.reduce<AnnualWaste>(
    (sums, lineItem) => {
      const annualOccurrence = getannualOccurrence(lineItem.frequency)
      const product = lineItem.product
      const annualWeight = annualSingleUseWeight(lineItem.casesPurchased, annualOccurrence, product.unitsPerCase, product.itemWeight)
      const boxAnnualWeight = lineItem.casesPurchased * product.boxWeight * annualOccurrence
      return {
        productWeight: sums.productWeight + annualWeight,
        shippingBoxWeight: sums.shippingBoxWeight + boxAnnualWeight,
      }
    },
    { productWeight: 0, shippingBoxWeight: 0 }
  )
}
