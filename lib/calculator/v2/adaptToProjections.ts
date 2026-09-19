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
import { getChangeSummaryRowRounded, round } from 'lib/calculator/utils';
import type { MetricTriple, ModelOutputs } from './combinedModel';

// v1's own rounding/percent convention (whole-number totals, changePercent as a rounded
// percentage like -74) — the overlay must speak it exactly or badges print raw fractions.
function toChange(triple: MetricTriple) {
  return getChangeSummaryRowRounded(triple.baseline, triple.forecastAnnual, 0);
}

// GHG keeps two decimals (Derek, 2026-09-19): projects small enough to round to a whole
// MTCO2e — or to 0 — would misstate their impact. The percent badge stays whole-rounded
// so badges read consistently across cards.
function toChangeGhg(triple: MetricTriple) {
  const precise = getChangeSummaryRowRounded(triple.baseline, triple.forecastAnnual, 2);
  return { ...precise, changePercent: toChange(triple).changePercent };
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
        total: { ...v1.annualSummary.greenhouseGasEmissions.total, ...toChangeGhg(v2.ghgMtco2e) }
      }
    },
    environmentalResults: {
      ...v1.environmentalResults,
      // The environmental headline cards read these totals (not annualSummary.*) — each must
      // be overlaid or its card silently keeps speaking v1 (caught 2026-09-19: the GHG card
      // showed v1's −82.16 beside a 2.0 stamp; her Dashboard says 82.21). The per-category
      // bars inside the charts stay v1 until the model defines decompositions (feedback #11).
      annualWaterUsageChanges: {
        ...v1.environmentalResults.annualWaterUsageChanges,
        total: { ...v1.environmentalResults.annualWaterUsageChanges.total, ...toChange(v2.waterGal) }
      },
      annualGasEmissionChanges: {
        ...v1.environmentalResults.annualGasEmissionChanges,
        total: { ...v1.environmentalResults.annualGasEmissionChanges.total, ...toChangeGhg(v2.ghgMtco2e) }
      },
      annualWasteChanges: {
        ...v1.environmentalResults.annualWasteChanges,
        summary: { ...v1.environmentalResults.annualWasteChanges.summary, ...toChange(v2.wasteLb) }
      }
    },
    financialResults: (() => {
      // The Financial summary card must speak ONE methodology (Derek, 2026-09-19: v1's
      // $66,505 savings sat beside 2.0's ROI). Savings total and dishwashing utilities come
      // from the model; the recurring aggregate shifts by the same delta so the column still
      // sums. Restocking/labor/hauling lines are identical math in both methodologies.
      const v1Utilities = v1.financialResults.annualCostChanges.utilities;
      const utilities = v2.dishwashing ? round(v2.dishwashing.utilityCost, 2) : v1Utilities;
      return {
        ...v1.financialResults,
        annualCostChanges: {
          ...v1.financialResults.annualCostChanges,
          utilities,
          change: round(v1.financialResults.annualCostChanges.change + (utilities - v1Utilities), 2)
        },
        oneTimeCosts: { ...v1.financialResults.oneTimeCosts, total: round(v2.financial.oneTimeStartupCost, 0) },
        summary: {
          ...v1.financialResults.summary,
          // v1 sign convention: annualCost negative = net savings (the card displays ×−1)
          annualCost: -round(v2.financial.annualSavings, 2),
          // v1 conventions: payback in whole months (ceil), ROI as a percent to 2 decimals
          paybackPeriodsMonths: v2.financial.paybackMonths
            ? Math.ceil(v2.financial.paybackMonths)
            : v1.financialResults.summary.paybackPeriodsMonths,
          annualROIPercent: round(v2.financial.annualSavingsROI * 100, 2)
        }
      };
    })()
  };
}
