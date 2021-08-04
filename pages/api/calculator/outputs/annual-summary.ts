import { ProjectCalculatorInput } from "../models";

interface AnnualSummary {
  savingsDollars: number; // dollars
  reducedSingleUseProducts: number; // count
  reducedWastePounds: number; // pounds
  reducedEmissionsMTCO2e: number; // MTCO2e
}

export async function getAnnualSummary(
  project: ProjectCalculatorInput
): Promise<AnnualSummary> {}
