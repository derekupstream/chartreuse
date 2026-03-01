export type LineageEntry = {
  pattern: RegExp;
  calculatorFile: string;
  calculatorFunction: string;
  outputMetrics: string[];
  metricCategory: 'environmental' | 'financial' | 'utility';
};

export const LINEAGE_MAP: LineageEntry[] = [
  {
    pattern: /^ELECTRIC_CO2_EMISSIONS_FACTOR$/,
    calculatorFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    calculatorFunction: 'getAnnualGasEmissionChanges()',
    outputMetrics: ['environmentalResults.annualGasEmissionChanges.dishwashing'],
    metricCategory: 'environmental'
  },
  {
    pattern: /^NATURAL_GAS_CO2_EMISSIONS_FACTOR$/,
    calculatorFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    calculatorFunction: 'getAnnualGasEmissionChanges()',
    outputMetrics: ['environmentalResults.annualGasEmissionChanges.dishwashing'],
    metricCategory: 'environmental'
  },
  {
    pattern: /^TRANSPORTATION_CO2_EMISSIONS_FACTOR$/,
    calculatorFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    calculatorFunction: 'getLineItemGasEmissions()',
    outputMetrics: [
      'environmentalResults.annualGasEmissionChanges.landfillWaste',
      'environmentalResults.annualGasEmissionChanges.shippingBox',
      'environmentalResults.annualGasEmissionChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    pattern: /^MATERIALS\[.*\]\.mtco2ePerLb$/,
    calculatorFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    calculatorFunction: 'calculateMaterialGas()',
    outputMetrics: [
      'environmentalResults.annualGasEmissionChanges.landfillWaste',
      'environmentalResults.annualGasEmissionChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    pattern: /^MATERIALS\[.*\]\.waterUsageGalPerLb$/,
    calculatorFile: 'lib/calculator/calculations/water/getAnnualWaterUsageChanges.ts',
    calculatorFunction: 'calculateMaterialWater()',
    outputMetrics: [
      'environmentalResults.annualWaterUsageChanges.landfillWaste',
      'environmentalResults.annualWaterUsageChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    pattern: /^REUSABLE_MATERIALS\[.*\]\.mtco2ePerLb$/,
    calculatorFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    calculatorFunction: 'calculateMaterialGas()',
    outputMetrics: [
      'environmentalResults.annualGasEmissionChanges.landfillWaste',
      'environmentalResults.annualGasEmissionChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    pattern: /^REUSABLE_MATERIALS\[.*\]\.waterUsageGalPerLb$/,
    calculatorFile: 'lib/calculator/calculations/water/getAnnualWaterUsageChanges.ts',
    calculatorFunction: 'calculateMaterialWater()',
    outputMetrics: [
      'environmentalResults.annualWaterUsageChanges.landfillWaste',
      'environmentalResults.annualWaterUsageChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    pattern: /^STATES\[.*\]\.electric$/,
    calculatorFile: 'lib/calculator/calculations/getFinancialResults.ts',
    calculatorFunction: 'dishwasherAnnualCostBreakdown()',
    outputMetrics: [
      'financialResults.annualCostChanges.utilities',
      'financialResults.annualCostChanges.baseline',
      'financialResults.annualCostChanges.forecast',
      'financialResults.summary.annualCost'
    ],
    metricCategory: 'financial'
  },
  {
    pattern: /^STATES\[.*\]\.gas$/,
    calculatorFile: 'lib/calculator/calculations/getFinancialResults.ts',
    calculatorFunction: 'dishwasherAnnualCostBreakdown()',
    outputMetrics: [
      'financialResults.annualCostChanges.utilities',
      'financialResults.annualCostChanges.baseline',
      'financialResults.annualCostChanges.forecast',
      'financialResults.summary.annualCost'
    ],
    metricCategory: 'financial'
  },
  {
    pattern: /^REUSABLE_MATERIALS\[.*\]\.mtco2ePerLb$|^CORRUGATED_CARDBOARD_GAS$|^TRANSPORTATION_CO2_EMISSIONS_FACTOR$/,
    calculatorFile: 'lib/calculator/calculations/getEnvBreakEven.ts',
    calculatorFunction: 'getEnvBreakEven()',
    outputMetrics: [
      'environmentalResults.envBreakEven.co2BreakEvenMonths',
      'environmentalResults.envBreakEven.embodiedCO2Mtco2e',
      'environmentalResults.envBreakEven.annualCO2SavingsMtco2e'
    ],
    metricCategory: 'environmental'
  },
  {
    pattern: /^REUSABLE_MATERIALS\[.*\]\.waterUsageGalPerLb$/,
    calculatorFile: 'lib/calculator/calculations/getEnvBreakEven.ts',
    calculatorFunction: 'getEnvBreakEven()',
    outputMetrics: [
      'environmentalResults.envBreakEven.waterBreakEvenMonths',
      'environmentalResults.envBreakEven.embodiedWaterGallons',
      'environmentalResults.envBreakEven.annualWaterSavingsGallons'
    ],
    metricCategory: 'environmental'
  }
];

export function resolveLineage(key: string | null) {
  if (!key) return null;
  return LINEAGE_MAP.find(entry => entry.pattern.test(key)) ?? null;
}
