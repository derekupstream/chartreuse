import { BOX_MATERIALS } from "../constants/epa-warm-assumptions";
import { Frequency, getAnnualOccurence } from "../constants/frequency";
import { PRODUCT_CATEGORIES } from "../constants/product-categories";
import { PRODUCT_TYPES } from "../constants/product-types";
import { getProductById } from "../constants/single-use-products";
import { ProjectInput } from "../project-input";
import { SingleUseProduct } from "../types/products";
import { ChangeSummary, getChangeSummaryRow } from "../utils";
import { singleUseItemGasEmissions } from "./environmental-results";

interface PurchasingSummaryColumn {
  annualCost: number;
  annualUnits: number;
  productCount: number;
}

interface SingleUseProductResults {
  summary: {
    annualCost: ChangeSummary;
    annualUnits: ChangeSummary;
    productCount: ChangeSummary;
  };
  resultsByType: {
    material: {
      rows: CombinedLineItemResultsWithTitle[],
      totals: CombinedLineItemResults
    },
    productType: {
      rows: CombinedLineItemResultsWithTitle[],
      totals: CombinedLineItemResults
    },
    productCategory: {
      rows: CombinedLineItemResultsWithTitle[],
      totals: CombinedLineItemResults
    }
  };
}

export function getSingleUseProductResults(
  project: ProjectInput
): SingleUseProductResults {

  const summary = getSingleUseProductSummary(project.singleUseItems);
  const resultsByType = getResultsByType(project.singleUseItems);

  return {
    summary,
    resultsByType
  };
}

// for each single use item, calculate difference in annual cost
export function getSingleUseProductSummary (singleUseItems: ProjectInput['singleUseItems']): SingleUseProductResults['summary'] {

  const baseline = singleUseItems.reduce<PurchasingSummaryColumn>((column, item) => {
    const { caseCost, casesPurchased, frequency } = item;
    const annualCost = annualSingleUseCost({
      caseCost,
      casesPurchased,
      frequency,
    });
    const annualUnits = annualSingleUseCount({
      casesPurchased,
      frequency,
    });
    return {
      annualUnits: column.annualUnits + annualUnits,
      annualCost: column.annualCost + annualCost,
      productCount: annualUnits > 0 ? column.productCount + 1 : column.productCount
    };
  }, { annualCost: 0, annualUnits: 0, productCount: 0 });

  const followup = singleUseItems.reduce<PurchasingSummaryColumn>((column, item) => {
    const { newCaseCost: caseCost, newCasesPurchased: casesPurchased, frequency } = item;
    const annualCost = annualSingleUseCost({
      caseCost,
      casesPurchased,
      frequency,
    });
    const annualUnits = annualSingleUseCount({
      casesPurchased,
      frequency,
    });
    return {
      annualUnits: column.annualUnits + annualUnits,
      annualCost: column.annualCost + annualCost,
      productCount: annualUnits > 0 ? column.productCount + 1 : column.productCount
    };
  }, { annualCost: 0, annualUnits: 0, productCount: 0 });

  return {
    annualCost: getChangeSummaryRow(baseline.annualCost, followup.annualCost),
    annualUnits: getChangeSummaryRow(baseline.annualUnits, followup.annualUnits),
    productCount: getChangeSummaryRow(baseline.productCount, followup.productCount)
  };
}

// Detailed Results, Column M: =$J5*L5*INDEX(HIDDEN_Purchase_Frequency_Table,MATCH($I5,HIDDEN_Purchase_Frequency_Options,0),2)
function annualSingleUseCost(item: {
  caseCost: number;
  casesPurchased: number;
  frequency: Frequency;
}) {
  return item.caseCost * annualSingleUseCount(item);
}

// Detailed Results, Column N
function annualSingleUseCount(item: {
  casesPurchased: number;
  frequency: Frequency;
}) {
  const frequencyVal = getAnnualOccurence(item.frequency);
  return item.casesPurchased * frequencyVal;
}

export function annualSingleUseWeight (casesPurchased: number, annualOccurence: number, unitsPerCase: number, weightPerUnit: number) {
  const annualUnits = casesPurchased * unitsPerCase * annualOccurence;
  return annualUnits * weightPerUnit;
}

// See Sheet 5: Detailed Results
interface SingleUseDetailedResult {
  annualCost: number;
  annualWeight: number;
  category: SingleUseProduct['category'];
  gasEmissionsReduction: number;
  type: SingleUseProduct['type'];
  followupAnnualCost: number;
  followupAnnualWeight: number;
  primaryMaterial: SingleUseProduct['primaryMaterial'];
}

function getDetailedLineItemResults (singleUseItems: ProjectInput['singleUseItems']): SingleUseDetailedResult[] {
  return singleUseItems.map(lineItem => {
    const annualCost = annualSingleUseCost({
      caseCost: lineItem.caseCost,
      casesPurchased: lineItem.casesPurchased,
      frequency: lineItem.frequency
    });
    const followupAnnualCost = annualSingleUseCost({
      caseCost: lineItem.caseCost,
      casesPurchased: lineItem.newCasesPurchased,
      frequency: lineItem.frequency
    });
    const annualOccurence = getAnnualOccurence(lineItem.frequency);
    const product = getProductById(lineItem.singleUseProductId);
    if (!product) {
      throw new Error('Could not identify product by id: ' + lineItem.singleUseProductId);
    }
    const annualWeight = annualSingleUseWeight(lineItem.casesPurchased, annualOccurence, product.unitsPerCase, product.itemWeight);
    const followupAnnualWeight = annualSingleUseWeight(lineItem.newCasesPurchased, annualOccurence, product.unitsPerCase, product.itemWeight);

    const { totalGasReductions } = singleUseItemGasEmissions(lineItem);

    const detailedResult: SingleUseDetailedResult = {
      annualCost,
      annualWeight,
      category: product.category,
      followupAnnualCost,
      followupAnnualWeight,
      gasEmissionsReduction: totalGasReductions,
      primaryMaterial: product.primaryMaterial,
      type: product.type
    }
    return detailedResult;
  });
}

// see HIDDEN: Output Calculations
interface CombinedLineItemResults {
  weight: ChangeSummary & {
    shareOfReduction: number;
  };
  gasEmissions: {
    reduction: number;
    shareOfReduction: number;
  };
  cost: ChangeSummary & {
    shareOfReduction: number;
  };
}

interface CombinedLineItemResultsWithTitle extends CombinedLineItemResults {
  title: string;
}

function getResultsByType(singleUseItems: ProjectInput['singleUseItems']): SingleUseProductResults['resultsByType'] {

  const detailedResults = getDetailedLineItemResults(singleUseItems);

  const itemsByCategory = PRODUCT_CATEGORIES.map(category => {
    const items = detailedResults.filter(item => item.category === category.id);
    return { title: category.name, items };
  });

  const itemsByType = PRODUCT_TYPES.map(type => {
    const items = detailedResults.filter(item => item.type === type.id);
    return { title: type.name, items };
  });

  const materialRows = BOX_MATERIALS.map(material => {
    const items = detailedResults.filter(item => item.primaryMaterial === material.name);
    return { title: material.name, items };
  });

  return {
    productCategory: combineResultsByCategory(itemsByCategory),
    material: combineResultsByCategory(materialRows),
    productType: combineResultsByCategory(itemsByType)
  };
}

const emptyCombinedResults: CombinedLineItemResults = {
  weight: {
    baseline: 0,
    followup: 0,
    change: 0,
    changePercent: 0,
    shareOfReduction: 0
  },
  gasEmissions: {
    reduction: 0,
    shareOfReduction: 0
  },
  cost: {
    baseline: 0,
    followup: 0,
    change: 0,
    changePercent: 0,
    shareOfReduction: 0
  }
}

// combine the results of a group of line items
function combineLineItemResults (title: string, items: SingleUseDetailedResult[]): CombinedLineItemResultsWithTitle {
  return items.reduce((result, item) => {
    const baselineWeight = result.weight.baseline + item.annualWeight;
    const followupWeight = result.weight.followup + item.followupAnnualWeight;
    const weight = getChangeSummaryRow(baselineWeight, followupWeight);
    const baselineCost = result.cost.baseline + item.annualCost;
    const followupCost = result.cost.followup + item.followupAnnualCost;
    const cost = getChangeSummaryRow(baselineCost, followupCost);
    return {
      title,
      weight: {
        ...weight,
        shareOfReduction: 0 // to be calculated later
      },
      gasEmissions: {
        reduction: result.gasEmissions.reduction + item.gasEmissionsReduction,
        shareOfReduction: 0
      },
      cost: {
        ...cost,
        shareOfReduction: 0
      }
    };
  }, {
    title,
    ...emptyCombinedResults
  });
}

function combineResultsByCategory (items: { title: string, items: SingleUseDetailedResult[] }[]): { totals: CombinedLineItemResults, rows: CombinedLineItemResultsWithTitle[] } {

  const rows = items.map(item => combineLineItemResults(item.title, item.items));

  const totals = rows.reduce((totals, row) => {
    const baselineWeight = totals.weight.baseline + row.weight.baseline;
    const followupWeight = totals.weight.followup + row.weight.followup;
    const weight = getChangeSummaryRow(baselineWeight, followupWeight);
    const baselineCost = totals.cost.baseline + row.cost.baseline;
    const followupCost = totals.cost.followup + row.cost.followup;
    const cost = getChangeSummaryRow(baselineCost, followupCost);
    return {
      weight: {
        ...weight,
        shareOfReduction: 100
      },
      gasEmissions: {
        reduction: totals.gasEmissions.reduction + row.gasEmissions.reduction,
        shareOfReduction: 100
      },
      cost: {
        ...cost,
        shareOfReduction: 100
      }
    };
  }, emptyCombinedResults);

  // calculate shares of reduction, only count against other line items that had negative reduction
  const totalGasReduction = rows.reduce((total, row) => {
    if (row.gasEmissions.reduction < 0) {
      return total + row.gasEmissions.reduction;
    }
    return total;
  }, 0);
  const totalCostReduction = rows.reduce((total, row) => {
    if (row.cost.change < 0) {
      return total + row.cost.change;
    }
    return total;
  }, 0);
  const totalWeightReduction = rows.reduce((total, row) => {
    if (row.weight.change < 0) {
      return total + row.weight.change;
    }
    return total;
  }, 0);
  rows.forEach(row => {
    if (row.gasEmissions.reduction < 0) {
      row.gasEmissions.shareOfReduction = row.gasEmissions.reduction / totalGasReduction;
    }
    if (row.cost.change < 0) {
      row.cost.shareOfReduction = row.gasEmissions.reduction / totalCostReduction;
    }
    if (row.weight.change < 0) {
      row.weight.shareOfReduction = row.gasEmissions.reduction / totalWeightReduction;
    }
  });

  return {
    rows,
    totals
  };
}
