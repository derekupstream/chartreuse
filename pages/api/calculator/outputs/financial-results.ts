import { ProjectCalculatorInput } from "../models";

// all values in dollars
interface OneTimeCosts {
  additionalCosts: number;
  resuableProducts: number;
  total: number;
}

// all values in dollars
interface AnnualCosts {
  additionalCosts: number;
  resuableProductRepurchases: number;
  singleUseProducts: number;
  utilities: number;
  wasteHauling: number;
  total: number;
}

interface FinancialSummary {
  annualROIPercent: number;
  annualSavingsDollars: number;
  initialInvestmentDollars: number;
  paybackPeriodsMonths: number;
}

interface FinancialResults {
  annualCosts: AnnualCosts;
  oneTimeCosts: OneTimeCosts;
  summary: FinancialSummary;
}

export function getFinancialResults(
  project: ProjectCalculatorInput
): FinancialResults {}
