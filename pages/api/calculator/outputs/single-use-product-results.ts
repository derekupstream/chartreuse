import { ProjectCalculatorInput } from "../models";

interface AnnualSingleUseProductSummary {
  productTypeCount: number;
  totalCost: number;
  unitCount: number;
}

interface AnnualSingleUseProductResults {
  baseline: AnnualSingleUseProductSummary;
  followup?: AnnualSingleUseProductSummary;
}

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

interface SingleUseProductResults {
  summary: AnnualSingleUseProductResults;
  products: SingleUseProductLineItem[];
}

export async function getSingleUseProductResults(
  project: ProjectCalculatorInput
): Promise<SingleUseProductResults> {}
