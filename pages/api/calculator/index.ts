import { getAnnualSummary } from "./outputs/annual-summary";
import { getEnvironmentalResults } from "./outputs/environmental-results";
import { getFinancialResults } from "./outputs/financial-results";
import { getSingleUseProductResults } from "./outputs/single-use-product-results";
import { ProjectCalculatorInput } from "./models/projects";

export async function getProjections(projectId: string) {
  // TODO: retrieve project data from database
  const project: ProjectCalculatorInput = {
    additionalCosts: [],
    reusableItems: [],
    singleUseItems: [],
    state: "California",
  };

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
