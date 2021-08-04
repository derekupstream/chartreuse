import { ProjectCalculatorInput } from "../models";

interface AnnualSummary {
  savingsDollars: number; // dollars
  reducedSingleUseProducts: number; // count
  reducedWastePounds: number; // pounds
  reducedEmissionsMTCO2e: number; // MTCO2e
}

export function getAnnualSummary(
  project: ProjectCalculatorInput
): AnnualSummary {}
