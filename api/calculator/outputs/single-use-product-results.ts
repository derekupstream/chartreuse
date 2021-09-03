import { Frequency, getAnnualOccurence } from "../constants/frequency";
import { CalculatorInput } from "../input";
import { getChangeSummaryRow } from "../utils";

interface SingleUseProductLineItem {
  title: string;
  baselineWeight: number;
  followupWeight?: number;
  wasteReductionPercent: number;
  gasReduction?: number; // MTC02e
  gasReductionPercent?: number;
  baselineCost: number;
  followupCost: number;
  costReductionPercent: number;
}

interface PurchasingSummaryRow {
  baseline: number,
  followup: number,
  change: number,
  changePercent: number
}

interface SingleUseProductResults {
  summary: {
    annualCost: PurchasingSummaryRow;
    annualUnits: PurchasingSummaryRow;
    productCount: PurchasingSummaryRow;
  };
  products: SingleUseProductLineItem[];
}

export function getSingleUseProductResults(
  project: CalculatorInput
): SingleUseProductResults {

  const summary = getSingleUseProductSummary(project);
  const products = getProductsSummary(project);

  return {
    summary,
    products
  };
}

function getProductsSummary(project: CalculatorInput) {

}

interface PurchasingSummaryColumn {
  annualCost: number;
  annualUnits: number;
  productCount: number;
}

// for each single use item, calculate difference in annual cost
export function getSingleUseProductSummary (project: CalculatorInput): SingleUseProductResults['summary'] {

  const { singleUseItems } = project;

  const baseline = singleUseItems.reduce<PurchasingSummaryColumn>((column, item) => {
    const { caseCost, casesPurchased, frequency } = item;
    const annualCost = singleUseAnnualCost({
      caseCost,
      casesPurchased,
      frequency,
    });
    const annualUnits = singleUseAnnualUnits({
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
    const annualCost = singleUseAnnualCost({
      caseCost,
      casesPurchased,
      frequency,
    });
    const annualUnits = singleUseAnnualUnits({
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
function singleUseAnnualCost(item: {
  caseCost: number;
  casesPurchased: number;
  frequency: Frequency;
}) {
  return item.caseCost * singleUseAnnualUnits(item);
}

// Detailed Results, Column M: =$J5*L5*INDEX(HIDDEN_Purchase_Frequency_Table,MATCH($I5,HIDDEN_Purchase_Frequency_Options,0),2)
function singleUseAnnualUnits(item: {
  casesPurchased: number;
  frequency: Frequency;
}) {
  const frequencyVal = getAnnualOccurence(item.frequency);
  return item.casesPurchased * frequencyVal;
}
