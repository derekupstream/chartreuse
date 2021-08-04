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

  const annualSummary = await getAnnualSummary(project);
  const environmentalResults = await getEnvironmentalResults(project);
  const financialResults = await getFinancialResults(project);
  const singleUseProductResults = await getSingleUseProductResults(project);

  return {
    annualSummary,
    environmentalResults,
    financialResults,
    singleUseProductResults,
  };
}
