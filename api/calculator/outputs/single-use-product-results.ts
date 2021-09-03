import { CalculatorInput } from "../input";

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
    productTypeCount: PurchasingSummaryRow;
    totalCost: PurchasingSummaryRow;
    unitCount: PurchasingSummaryRow;
  };
  products: SingleUseProductLineItem[];
}

export function getSingleUseProductResults(
  project: CalculatorInput
): SingleUseProductResults {}
