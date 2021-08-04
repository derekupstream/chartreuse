import { ProjectCalculatorInput } from "../models";

// all values in MTCO2e
interface AnnualGasEmissionIncreases {
  landfillWaste: number;
  dishwashing: number;
  total: number;
}

// all values in pounds
interface AnnualWasteSummary {
  disposableProductWeight: number;
  disposableShippingBoxWeight: number;
  total: number;
}

interface AnnualWasteResults {
  baseline: AnnualWasteSummary;
  followup?: AnnualWasteSummary;
}

interface EnvironmentalResults {
  annualGasEmissionIncreases: AnnualGasEmissionIncreases;
  annualWaste: AnnualWasteResults;
}

export async function getEnvironmentalResults(
  project: ProjectCalculatorInput
): Promise<EnvironmentalResults> {}
