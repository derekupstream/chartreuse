import { ProjectInput } from "../types/projects";
import { getEnvironmentalResults } from "./environmental-results";
import { getFinancialResults } from "./financial-results";
import { getSingleUseProductResults } from "./single-use-product-results";

interface AnnualSummary {
  dollarCost: number; // dollars
  singleUseProductCount: number;
  greenhouseGasEmissions: number; // MTCO2e
  wasteWeight: number; // pounds
}

export function getAnnualSummary(project: ProjectInput): AnnualSummary {

  const financeResults = getFinancialResults(project);
  const environmentalResults = getEnvironmentalResults(project);
  const singleUseProductResults = getSingleUseProductResults(project);

  return {
    dollarCost: financeResults.annualCostChanges.total,
    singleUseProductCount: singleUseProductResults.summary.annualUnits.change,
    greenhouseGasEmissions: environmentalResults.annualGasEmissionChanges.total,
    wasteWeight: environmentalResults.annualWasteChanges.total.change
  }
}
