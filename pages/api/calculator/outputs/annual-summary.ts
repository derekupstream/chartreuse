import { SingleUseItem } from "../products";

interface AnnualSummary {
  savingsDollars: number; // dollars
  reducedSingleUseProducts: number; // count
  reducedWastePounds: number; // pounds
  reducedEmissionsMTCO2e: number; // MTCO2e
}

export async function getAnnualSummary(): Promise<AnnualSummary> {}
