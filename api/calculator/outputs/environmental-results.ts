import { NATURAL_GAS_CO2_EMISSIONS_FACTOR, ELECTRIC_CO2_EMISSIONS_FACTOR } from "../constants/carbon-dioxide-emissions";
import { POUND_TO_TONNE } from "../constants/conversions";
import { CORRUGATED_CARDBOARD, BOX_MATERIALS } from "../constants/epa-warm-assumptions";
import { Frequency, getAnnualOccurence } from "../constants/frequency";
import { BoxMaterial } from "../constants/products";
import { getProductById } from "../database/upstream-products";
import { CalculatorInput } from "../input";
import { SingleUseLineItem } from "../types/projects";
import { getChangeSummaryRow } from "../utils";
import { dishwasherUtilityUsage } from "./financial-results";

interface EnvironmentalResults {
  annualGasEmissionChanges: AnnualGasEmissionChanges;
  annualWasteChanges: AnnualWasteResults;
}

export function getEnvironmentalResults(
  project: CalculatorInput
): EnvironmentalResults {

  const annualGasEmissionChanges = getAnnualGasEmissionChanges(project);
  const annualWasteChanges = getAnnualWasteChanges(project);

  return {
    annualGasEmissionChanges,
    annualWasteChanges
  };
}

interface LineItemWaste {
  totalGHGReductions: number;
}

// all values in MTCO2e
interface AnnualGasEmissionChanges {
  landfillWaste: number;
  dishwashing: number;
  total: number;
}

function getAnnualGasEmissionChanges (project: CalculatorInput): AnnualGasEmissionChanges {
  const lineItems: LineItemWaste[] = project.singleUseItems.map(singleUseItemGasEmissions);
  const landfillWaste = lineItems.reduce((sum, item) => sum + item.totalGHGReductions, 0);

  // calculate increased dishwasher emissions
  let dishwashing = 0;
  if (project.dishwasher) {
    const { electricUsage, gasUsage } = dishwasherUtilityUsage(project.dishwasher);
    const electricGHGEmissions = electricUsage * ELECTRIC_CO2_EMISSIONS_FACTOR;
    const gasGHGEmissions = gasUsage * NATURAL_GAS_CO2_EMISSIONS_FACTOR;
    dishwashing = POUND_TO_TONNE * (electricGHGEmissions + gasGHGEmissions);
  }

  return {
    landfillWaste,
    dishwashing,
    total: landfillWaste + dishwashing
  };
}


/**
 *
 * Calculate gas emissions from a single use item.
 * This includes the primary and secondary, and packaging materials.
 *
 * Reference: Sheet 5:Detailed Results
 *
 * */
function singleUseItemGasEmissions (item: SingleUseLineItem): LineItemWaste {

  const {
    casesPurchased,
    frequency,
    newCasesPurchased,
    singleUseProductId
  } = item;

  const annualOccurence = getAnnualOccurence(frequency);

  // TODO: allow retrieving from a database
  const product = getProductById(singleUseProductId);
  if (!product) {
    throw new Error('Could not identify product by id: ' + singleUseProductId);
  }

  // Column: AS
  const primaryGHGReduction = calculateMaterialGHGReduction(
    casesPurchased,
    newCasesPurchased,
    annualOccurence,
    product.unitsPerCase,
    product.primaryMaterial,
    product.primaryMaterialWeightPerUnit
  );

  // Column: AU: calculate secondary material emissions
  const secondaryGHGReduction = calculateMaterialGHGReduction(
    casesPurchased,
    newCasesPurchased,
    annualOccurence,
    product.unitsPerCase,
    product.secondaryMaterial,
    product.secondaryMaterialWeightPerUnit
  );

  // Column AW: calculate shipping box emissions
  let shippingBoxGHGReduction = 0;

  // Columns: X, Y
  const boxWeight = product.boxWeight;
  const annualBoxWeight = boxWeight * casesPurchased * annualOccurence;
  // Columns: AM, AN
  const followupBoxWeight = product.boxWeight;
  const followupAnnualBoxWeight = followupBoxWeight * newCasesPurchased * annualOccurence;
  // Column: AV
  const changeInShippingBoxWeight = followupAnnualBoxWeight - annualBoxWeight;

  if (changeInShippingBoxWeight !== 0) {
    shippingBoxGHGReduction = -changeInShippingBoxWeight * CORRUGATED_CARDBOARD;
  }

  // Column: AX
  const totalGHGReductions = primaryGHGReduction + secondaryGHGReduction + shippingBoxGHGReduction;

  return {
    totalGHGReductions
  };
}

// given a product and change in cases, determine how much gas emissions are reduced
/*
  Example calculations:

  // Column: N, V
  const annualUnits = casesPurchased * product.unitsPerCase * annualOccurence;
  const annualSecondaryWeight = secondaryMaterialWeightPerUnit * annualUnits;
  // Column: AC, AK
  const followupAnnualUnits = newCasesPurchased * product.unitsPerCase * annualOccurence;
  const followupAnnualSecondaryWeight = secondaryMaterialWeightPerUnit * followupAnnualUnits;
  // Column: AT
  const changeInSecondaryWeight = followupAnnualSecondaryWeight - annualSecondaryWeight;
  if (epaWARMAssumption && changeInSecondaryWeight > 0) {
    secondaryGHGReduction = -1 * changeInSecondaryWeight * epaWARMAssumption.mtco2ePerLb;
  }
*/
function calculateMaterialGHGReduction (casesPurchased: number, newCasesPurchased: number, annualOccurence: number, unitsPerCase: number, material: BoxMaterial, weightPerUnit: number): number {
  const epaWARMAssumption = BOX_MATERIALS.find(m => m.name === material);
  if (!epaWARMAssumption) {
    throw new Error('Could not find EPA Warm assumption for material: ' + material);
  }
  const annualUnits = casesPurchased * unitsPerCase * annualOccurence;
  const annualWeight = annualUnits * weightPerUnit;
  const followupAnnualUnits = newCasesPurchased * unitsPerCase * annualOccurence;
  const followupAnnualSecondaryWeight = followupAnnualUnits * weightPerUnit;
  const changeInWeight = followupAnnualSecondaryWeight - annualWeight;
  let GHGReduction = 0;
  if (changeInWeight > 0) {
    GHGReduction = -1 * changeInWeight * epaWARMAssumption.mtco2ePerLb;
  }
  return GHGReduction;
}

function calculateAnnualWeight (casesPurchased: number, annualOccurence: number, unitsPerCase: number, weightPerUnit: number) {
  const annualUnits = casesPurchased * unitsPerCase * annualOccurence;
  return annualUnits * weightPerUnit;
}

// all values in pounds
interface AnnualWasteSummaryRow {
  baseline: number,
  followup: number,
  change: number,
  changePercent: number
}

interface AnnualWasteResults {
  disposableProductWeight: AnnualWasteSummaryRow;
  disposableShippingBoxWeight: AnnualWasteSummaryRow;
  total: AnnualWasteSummaryRow;
}

function getAnnualWasteChanges (project: CalculatorInput): AnnualWasteResults {

  const baselineItems = project.singleUseItems.map(item => ({
    casesPurchased: item.casesPurchased,
    singleUseProductId: item.singleUseProductId,
    frequency: item.frequency
  }));
  const baseline = getAnnualWaste(baselineItems);

  const followupItems = project.singleUseItems.map(item => ({
    casesPurchased: item.newCasesPurchased,
    singleUseProductId: item.singleUseProductId,
    frequency: item.frequency
  }));
  const followup = getAnnualWaste(followupItems);

  const disposableProductWeight = getChangeSummaryRow(baseline.productWeight, followup.productWeight);
  const disposableShippingBoxWeight = getChangeSummaryRow(baseline.shippingBoxWeight, followup.shippingBoxWeight);
  const total = getChangeSummaryRow(
    baseline.productWeight + baseline.shippingBoxWeight,
    followup.productWeight + followup.shippingBoxWeight
  );

  return {
    disposableProductWeight,
    disposableShippingBoxWeight,
    total
  };
}

interface AnnualWaste {
  productWeight: number;
  shippingBoxWeight: number;
}

function getAnnualWaste (lineItems: { casesPurchased: number, frequency: Frequency, singleUseProductId: number }[]): AnnualWaste {

  return lineItems.reduce<AnnualWaste>((sums, lineItem) => {
    const annualOccurence = getAnnualOccurence(lineItem.frequency);
    const product = getProductById(lineItem.singleUseProductId);
    if (!product) {
      throw new Error('Could not identify product by id: ' + lineItem.singleUseProductId);
    }
    const annualWeight = calculateAnnualWeight(lineItem.casesPurchased, annualOccurence, product.unitsPerCase, product.itemWeight);
    const boxAnnualWeight = lineItem.casesPurchased * product.boxWeight * annualOccurence;
    return {
      productWeight: sums.productWeight + annualWeight,
      shippingBoxWeight: sums.shippingBoxWeight + boxAnnualWeight
    };
  }, { productWeight: 0, shippingBoxWeight: 0 });
}
