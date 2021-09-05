import { NATURAL_GAS_CO2_EMISSIONS_FACTOR, ELECTRIC_CO2_EMISSIONS_FACTOR } from "../constants/carbon-dioxide-emissions";
import { POUND_TO_TONNE } from "../constants/conversions";
import { CORRUGATED_CARDBOARD, MATERIALS } from "../constants/materials";
import { Frequency, getAnnualOccurence } from "../constants/frequency";
import { MaterialName } from '../constants/materials';
import { SingleUseLineItem, ProjectInput, SingleUseLineItemPopulated } from "../types/projects";
import { ChangeSummary, getChangeSummaryRow } from "../utils";
import { dishwasherUtilityUsage } from "./financial-results";
import { annualSingleUseWeight, getSingleUseProductResults } from "./single-use-product-results";
import { SingleUseProduct } from "../types/products";

interface EnvironmentalResults {
  annualGasEmissionChanges: AnnualGasEmissionChanges;
  annualWasteChanges: AnnualWasteResults;
}

export function getEnvironmentalResults(
  project: ProjectInput
): EnvironmentalResults {

  const annualGasEmissionChanges = getAnnualGasEmissionChanges(project);
  const annualWasteChanges = getAnnualWasteChanges(project);

  return {
    annualGasEmissionChanges,
    annualWasteChanges
  };
}

interface LineItemWaste {
  totalGasReductions: number;
}

// all values in MTCO2e
interface AnnualGasEmissionChanges {
  landfillWaste: number;
  dishwashing: number;
  total: number;
}

function getAnnualGasEmissionChanges (project: ProjectInput): AnnualGasEmissionChanges {
  const lineItems: LineItemWaste[] = project.singleUseItems.map(singleUseItemGasEmissions);
  const landfillWaste = lineItems.reduce((sum, item) => sum + item.totalGasReductions, 0);

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
export function singleUseItemGasEmissions (item: SingleUseLineItemPopulated): LineItemWaste {

  const {
    casesPurchased,
    frequency,
    newCasesPurchased,
    product
  } = item;

  const annualOccurence = getAnnualOccurence(frequency);

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
    shippingBoxGHGReduction = -1 * changeInShippingBoxWeight * CORRUGATED_CARDBOARD;
  }

  // Column: AX
  const totalGasReductions = primaryGHGReduction + secondaryGHGReduction + shippingBoxGHGReduction;

  return {
    totalGasReductions
  };
}

/**
  Given a product and change in cases, determine how much gas emissions are reduced

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
function calculateMaterialGHGReduction (casesPurchased: number, newCasesPurchased: number, annualOccurence: number, unitsPerCase: number, material: number, weightPerUnit: number): number {
  const epaWARMAssumption = MATERIALS.find(m => m.id === material);
  if (!epaWARMAssumption) {
    throw new Error('Could not find EPA Warm assumption for material: ' + material);
  }
  const annualWeight = annualSingleUseWeight(casesPurchased, annualOccurence, unitsPerCase, weightPerUnit);
  const followupAnnualSecondaryWeight = annualSingleUseWeight(newCasesPurchased, annualOccurence, unitsPerCase, weightPerUnit);
  const changeInWeight = followupAnnualSecondaryWeight - annualWeight;
  let GHGReduction = 0;
  if (changeInWeight > 0) {
    GHGReduction = -1 * changeInWeight * epaWARMAssumption.mtco2ePerLb;
  }
  return GHGReduction;
}


// all values in pounds
interface AnnualWasteResults {
  disposableProductWeight: ChangeSummary;
  disposableShippingBoxWeight: ChangeSummary;
  total: ChangeSummary;
}

function getAnnualWasteChanges (project: ProjectInput): AnnualWasteResults {

  const baselineItems = project.singleUseItems.map(item => ({
    casesPurchased: item.casesPurchased,
    product: item.product,
    frequency: item.frequency
  }));
  const baseline = getAnnualWaste(baselineItems);

  const followupItems = project.singleUseItems.map(item => ({
    casesPurchased: item.newCasesPurchased,
    product: item.product,
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

function getAnnualWaste (lineItems: { casesPurchased: number, frequency: Frequency, product: SingleUseProduct }[]): AnnualWaste {

  return lineItems.reduce<AnnualWaste>((sums, lineItem) => {
    const annualOccurence = getAnnualOccurence(lineItem.frequency);
    const product = lineItem.product;
    const annualWeight = annualSingleUseWeight(lineItem.casesPurchased, annualOccurence, product.unitsPerCase, product.itemWeight);
    const boxAnnualWeight = lineItem.casesPurchased * product.boxWeight * annualOccurence;
    return {
      productWeight: sums.productWeight + annualWeight,
      shippingBoxWeight: sums.shippingBoxWeight + boxAnnualWeight
    };
  }, { productWeight: 0, shippingBoxWeight: 0 });
}
