import { getAnnualSummary } from "./outputs/annual-summary";
import { getEnvironmentalResults } from "./outputs/environmental-results";
import { getFinancialResults } from "./outputs/financial-results";
import { getSingleUseProductResults } from "./outputs/single-use-product-results";
import { CalculatorInput } from "./input";
import { UTILITY_RATE_SELECTION } from "./constants/utilities";

export async function getProjections(projectId: string) {
  const project = await getCalculatorInput(projectId);

  const annualSummary = getAnnualSummary(project);
  const environmentalResults = getEnvironmentalResults(project);
  const financialResults = getFinancialResults(project);
  const singleUseProductResults = getSingleUseProductResults(project);

  return {
    annualSummary,
    environmentalResults,
    financialResults,
    singleUseProductResults,
  };
}

// TODO: retrieve project data from database
async function getCalculatorInput(projectId: string): Promise<CalculatorInput> {
  return {
    additionalCosts: [],
    reusableItems: [],
    singleUseItems: [],
    state: "California",
    utilityRates: {
      gas: UTILITY_RATE_SELECTION.gas,
      electric: UTILITY_RATE_SELECTION.electric,
      water: UTILITY_RATE_SELECTION.water,
    },
    wasteHauling: [],
    newWasteHauling: [],
  };
}
