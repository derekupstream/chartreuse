
import { ProjectInput } from "./types/projects";

// TODO: retrieve project data from database
export async function getProjectData(
  projectId: string
): Promise<ProjectInput> {
  return {
    additionalCosts: [],
    reusableItems: [],
    singleUseItems: [],
    state: "California",
    utilityRates: {
      gas: 0,
      electric: 0,
      water: 0,
    },
    wasteHauling: [],
    newWasteHauling: [],
  };
}
