import { CalculatorInput } from "../input";
import { getEnvironmentalResults } from "./environmental-results";
import { getFinancialResults } from "./financial-results";
import { getSingleUseProductResults } from "./single-use-product-results";

interface AnnualSummary {
  dollarCost: number; // dollars
  singleUseProducts: number; // count
  greenhouseGasEmissions: number; // MTCO2e
  wasteWeight: number; // pounds
}

export function getAnnualSummary(project: CalculatorInput): AnnualSummary {

  const financeResults = getFinancialResults(project);
  const environmentalResults = getEnvironmentalResults(project);
  const singleUseProductResults = getSingleUseProductResults(project);

  return {
    dollarCost: financeResults.annualCostChanges.total,
    singleUseProducts: singleUseProductResults.summary.unitCount.change,
    greenhouseGasEmissions: environmentalResults.annualGasEmissionChanges.total,
    wasteWeight: environmentalResults.annualWasteChanges.total.change
  }
}
