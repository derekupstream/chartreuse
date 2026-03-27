/**
 * Static registry of all calculator functions.
 * Used as a fallback when source files can't be scanned at runtime (e.g. on Vercel).
 * Keep in sync with lib/calculator/calculations/ when adding or removing functions.
 */

export type RegisteredFunction = {
  name: string;
  filePath: string;
  outputMetrics: string[];
  metricCategory: 'environmental' | 'financial' | 'utility' | 'foodware' | 'summary' | null;
};

export const CALCULATOR_REGISTRY: RegisteredFunction[] = [
  // ── Dishwashing ──────────────────────────────────────────────
  {
    name: 'getDishwasherStats',
    filePath: 'lib/calculator/calculations/dishwashing/getDishwasherStats.ts',
    outputMetrics: [
      'electricUsage',
      'gasUsage',
      'waterUsage',
      'electricCO2Weight',
      'gasCO2Weight',
      'electricCost',
      'gasCost',
      'waterCost'
    ],
    metricCategory: 'utility'
  },
  {
    name: 'dishwasherUtilityUsage',
    filePath: 'lib/calculator/calculations/dishwashing/getDishwasherUtilityUsage.ts',
    outputMetrics: ['electricUsageKwh', 'gasUsageTherms', 'waterUsageGallons'],
    metricCategory: 'utility'
  },

  // ── Foodware ─────────────────────────────────────────────────
  {
    name: 'getBottleStationResults',
    filePath: 'lib/calculator/calculations/foodware/getBottleStationResults.ts',
    outputMetrics: ['bottleStationResults.bottlesSaved'],
    metricCategory: 'foodware'
  },
  {
    name: 'getReturnRate',
    filePath: 'lib/calculator/calculations/foodware/getReturnRate.ts',
    outputMetrics: ['returnRate', 'shrinkageRate'],
    metricCategory: 'foodware'
  },
  {
    name: 'getReusableResults',
    filePath: 'lib/calculator/calculations/foodware/getReusableResults.ts',
    outputMetrics: [
      'reusableResults.summary.annualCost',
      'reusableResults.summary.ghg',
      'reusableResults.summary.waterUsage',
      'reusableResults.summary.units',
      'reusableResults.returnRate',
      'reusableResults.resultsByType'
    ],
    metricCategory: 'foodware'
  },
  {
    name: 'getReusableProductSummary',
    filePath: 'lib/calculator/calculations/foodware/getReusableResults.ts',
    outputMetrics: ['annualCostChange', 'annualGHGChange', 'annualUnitsChange', 'reusableWater', 'returnRate'],
    metricCategory: 'foodware'
  },
  {
    name: 'getSingleUseResults',
    filePath: 'lib/calculator/calculations/foodware/getSingleUseResults.ts',
    outputMetrics: [
      'singleUseResults.summary.annualCost',
      'singleUseResults.summary.ghg',
      'singleUseResults.summary.waterUsage',
      'singleUseResults.summary.units',
      'singleUseResults.resultsByType'
    ],
    metricCategory: 'foodware'
  },
  {
    name: 'getSingleUseProductSummary',
    filePath: 'lib/calculator/calculations/foodware/getSingleUseResults.ts',
    outputMetrics: ['annualCostChange', 'annualGHGChange', 'annualWaterChange', 'annualUnitsChange'],
    metricCategory: 'foodware'
  },
  {
    name: 'annualLineItemCost',
    filePath: 'lib/calculator/calculations/foodware/lineItemUtils.ts',
    outputMetrics: ['annualCost'],
    metricCategory: 'financial'
  },
  {
    name: 'annualLineItemCaseCount',
    filePath: 'lib/calculator/calculations/foodware/lineItemUtils.ts',
    outputMetrics: ['annualCaseCount'],
    metricCategory: 'foodware'
  },
  {
    name: 'annualLineItemWeight',
    filePath: 'lib/calculator/calculations/foodware/lineItemUtils.ts',
    outputMetrics: ['annualWeight'],
    metricCategory: 'environmental'
  },
  {
    name: 'getResultsByType',
    filePath: 'lib/calculator/calculations/foodware/lineItemUtils.ts',
    outputMetrics: ['resultsByMaterial', 'resultsByProductType', 'resultsByProductCategory'],
    metricCategory: 'foodware'
  },

  // ── Summary / Financial ──────────────────────────────────────
  {
    name: 'getAnnualSummary',
    filePath: 'lib/calculator/calculations/getAnnualSummary.ts',
    outputMetrics: [
      'annualSummary.dollarCostChange',
      'annualSummary.singleUseProductCount',
      'annualSummary.ghgEmissionsChange',
      'annualSummary.wasteWeightChange'
    ],
    metricCategory: 'summary'
  },
  {
    name: 'getFinancialResults',
    filePath: 'lib/calculator/calculations/getFinancialResults.ts',
    outputMetrics: [
      'financialResults.annualCostChanges',
      'financialResults.oneTimeCosts',
      'financialResults.summary.annualCost',
      'financialResults.summary.annualROI',
      'financialResults.summary.oneTimeCost',
      'financialResults.summary.paybackPeriodMonths'
    ],
    metricCategory: 'financial'
  },
  {
    name: 'dishwasherAnnualCostBreakdown',
    filePath: 'lib/calculator/calculations/getFinancialResults.ts',
    outputMetrics: [
      'financialResults.annualCostChanges.utilities',
      'financialResults.annualCostChanges.baseline',
      'financialResults.annualCostChanges.forecast',
      'financialResults.summary.annualCost'
    ],
    metricCategory: 'financial'
  },

  // ── GHG / Emissions ──────────────────────────────────────────
  {
    name: 'getAnnualGasEmissionChanges',
    filePath: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    outputMetrics: [
      'environmentalResults.annualGasEmissionChanges.landfillWaste',
      'environmentalResults.annualGasEmissionChanges.shippingBox',
      'environmentalResults.annualGasEmissionChanges.dishwashing',
      'environmentalResults.annualGasEmissionChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    name: 'getUtilityGasEmissions',
    filePath: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    outputMetrics: ['gasEmissions', 'electricEmissions'],
    metricCategory: 'environmental'
  },
  {
    name: 'getDishwasherGasEmissions',
    filePath: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    outputMetrics: ['dishwasherGHGChange'],
    metricCategory: 'environmental'
  },
  {
    name: 'getLineItemGasEmissions',
    filePath: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    outputMetrics: ['primaryGasEmissions', 'secondaryGasEmissions', 'shippingBoxGasEmissions', 'totalGasEmissions'],
    metricCategory: 'environmental'
  },
  {
    name: 'getReusableItemTransportationGHG',
    filePath: 'lib/calculator/calculations/ghg/getTransportationGHG.ts',
    outputMetrics: ['transportationGHG'],
    metricCategory: 'environmental'
  },

  // ── Waste ────────────────────────────────────────────────────
  {
    name: 'getAnnualWasteChanges',
    filePath: 'lib/calculator/calculations/waste/getAnnualWasteChanges.ts',
    outputMetrics: [
      'environmentalResults.annualWasteChanges.disposableProductWeight',
      'environmentalResults.annualWasteChanges.disposableShippingBoxWeight',
      'environmentalResults.annualWasteChanges.summary'
    ],
    metricCategory: 'environmental'
  },
  {
    name: 'getEventProjectWaste',
    filePath: 'lib/calculator/calculations/waste/getEventProjectWaste.ts',
    outputMetrics: [
      'environmentalResults.eventProjectWaste.singleUse',
      'environmentalResults.eventProjectWaste.reusable',
      'environmentalResults.eventProjectWaste.summary'
    ],
    metricCategory: 'environmental'
  },

  // ── Water ────────────────────────────────────────────────────
  {
    name: 'getAnnualWaterUsageChanges',
    filePath: 'lib/calculator/calculations/water/getAnnualWaterUsageChanges.ts',
    outputMetrics: [
      'environmentalResults.annualWaterUsageChanges.landfillWaste',
      'environmentalResults.annualWaterUsageChanges.dishwashing',
      'environmentalResults.annualWaterUsageChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    name: 'getDishwasherWaterUsage',
    filePath: 'lib/calculator/calculations/water/getAnnualWaterUsageChanges.ts',
    outputMetrics: ['dishwasherWaterUsageChange'],
    metricCategory: 'environmental'
  },
  {
    name: 'getLineItemWaterUsage',
    filePath: 'lib/calculator/calculations/water/getAnnualWaterUsageChanges.ts',
    outputMetrics: ['primaryWaterUsage', 'secondaryWaterUsage', 'shippingBoxWaterUsage', 'totalWaterUsage'],
    metricCategory: 'environmental'
  },

  // ── Environmental Aggregates ─────────────────────────────────
  {
    name: 'getEnvironmentalResults',
    filePath: 'lib/calculator/calculations/getEnvironmentalResults.ts',
    outputMetrics: [
      'environmentalResults.annualGasEmissionChanges',
      'environmentalResults.annualWasteChanges',
      'environmentalResults.annualWaterUsageChanges',
      'environmentalResults.eventProjectWaste',
      'environmentalResults.envBreakEven'
    ],
    metricCategory: 'environmental'
  },
  {
    name: 'getEnvBreakEven',
    filePath: 'lib/calculator/calculations/getEnvBreakEven.ts',
    outputMetrics: [
      'environmentalResults.envBreakEven.co2BreakEvenMonths',
      'environmentalResults.envBreakEven.waterBreakEvenMonths',
      'environmentalResults.envBreakEven.wasteBreakEvenMonths',
      'environmentalResults.envBreakEven.embodiedCO2Mtco2e',
      'environmentalResults.envBreakEven.annualCO2SavingsMtco2e',
      'environmentalResults.envBreakEven.embodiedWaterGallons',
      'environmentalResults.envBreakEven.annualWaterSavingsGallons'
    ],
    metricCategory: 'environmental'
  }
];
