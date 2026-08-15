/**
 * Overlays the 2.0 Combined Model's results onto the dashboard's existing data shape, so the
 * same components render either methodology. Only the headline aggregates are overridden —
 * the numbers the summary cards and stamp speak for. Sub-breakdowns (per-category charts,
 * line tables) remain v1-derived until the v2 engine grows its own detail views; the banner
 * shown in 2.0 mode says exactly that.
 *
 * Sign convention: v1 stores change = forecast − baseline (negative = savings/reduction);
 * the Combined Model reports reduction = baseline − forecast. Converted here.
 */
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import type { MetricTriple, ModelOutputs } from './combinedModel';

function toChange(triple: MetricTriple) {
  return {
    baseline: triple.baseline,
    forecast: triple.forecastAnnual,
    change: -triple.reduction,
    changePercent: triple.baseline === 0 ? 0 : -triple.reduction / triple.baseline
  };
}

export function applyV2Overrides(v1: ProjectionsResponse, v2: ModelOutputs): ProjectionsResponse {
  return {
    ...v1,
    annualSummary: {
      ...v1.annualSummary,
      dollarCost: {
        ...v1.annualSummary.dollarCost,
        ...toChange({
          baseline: v2.financial.baselineSingleUseAnnualCost,
          forecastAnnual: v2.financial.forecastAnnualOperatingCost,
          reduction: v2.financial.annualSavings,
          reductionPct:
            v2.financial.baselineSingleUseAnnualCost === 0
              ? 0
              : v2.financial.annualSavings / v2.financial.baselineSingleUseAnnualCost,
          forecastFirstYear: v2.financial.forecastAnnualOperatingCost,
          firstYearReduction: v2.financial.annualSavings
        })
      },
      singleUseProductCount: { ...v1.annualSummary.singleUseProductCount, ...toChange(v2.singleUseUnits) },
      wasteWeight: { ...v1.annualSummary.wasteWeight, ...toChange(v2.wasteLb) },
      greenhouseGasEmissions: {
        ...v1.annualSummary.greenhouseGasEmissions,
        total: { ...v1.annualSummary.greenhouseGasEmissions.total, ...toChange(v2.ghgMtco2e) }
      }
    },
    environmentalResults: {
      ...v1.environmentalResults,
      annualWaterUsageChanges: {
        ...v1.environmentalResults.annualWaterUsageChanges,
        total: { ...v1.environmentalResults.annualWaterUsageChanges.total, ...toChange(v2.waterGal) }
      }
    },
    financialResults: {
      ...v1.financialResults,
      oneTimeCosts: { ...v1.financialResults.oneTimeCosts, total: v2.financial.oneTimeStartupCost },
      summary: {
        ...v1.financialResults.summary,
        paybackPeriodsMonths: v2.financial.paybackMonths ?? v1.financialResults.summary.paybackPeriodsMonths,
        annualROIPercent: v2.financial.annualSavingsROI * 100
      }
    }
  };
}
