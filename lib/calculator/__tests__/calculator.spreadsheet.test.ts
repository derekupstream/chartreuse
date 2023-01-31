/**
 *
 * The following tests are based on data provided as part of the spreadsheet model from Upstream
 */

import type { ProjectInventory } from '../../inventory/types/projects';
import { getEnvironmentalResults } from '../calculations/environmental-results';
import { getFinancialResults } from '../calculations/financial-results';
import { getAnnualSummary } from '../forecast/annual-summary';
import { getSingleUseProductForecast } from '../forecast/single-use-forecast';

import { getProjectInventory } from './calculator.spreadsheet.test.data';

describe('Predictions Calculator: Spreadsheet results from Upstream', () => {
  let project: ProjectInventory;

  beforeEach(async () => {
    project = await getProjectInventory();
  });

  it('calculates Annual Summary', () => {
    const results = getAnnualSummary(project);
    expect(results).toEqual({
      dollarCost: {
        additionalCosts: 29200,
        baseline: 88320,
        change: -30198,
        changePercent: -34,
        forecast: 58122,
        laborCosts: 0,
        otherExpenses: 29200,
        reusableProductCosts: 10.58,
        singleUseProductChange: -59800,
        utilities: 871.77,
        wasteHauling: -480
      },
      greenhouseGasEmissions: {
        dishwashing: {
          baseline: 0,
          change: 4.9,
          changePercent: 0,
          forecast: 4.9
        },
        landfillWaste: {
          baseline: 80.81,
          change: -64.81,
          changePercent: -80,
          forecast: 16.01
        },
        total: {
          baseline: 80.81,
          change: -59.91,
          changePercent: -74,
          forecast: 20.91
        }
      },
      singleUseProductCount: {
        baseline: 1924000,
        change: -472160,
        changePercent: -25,
        forecast: 1451840
      },
      wasteWeight: {
        baseline: 33644,
        change: -22100,
        changePercent: -66,
        forecast: 11544
      }
    });
  });

  it('calculates Environmental Results', () => {
    const results = getEnvironmentalResults(project);
    expect(results.annualGasEmissionChanges).toEqual({
      dishwashing: {
        baseline: 0,
        change: 4.9,
        changePercent: 0,
        forecast: 4.9
      },
      landfillWaste: {
        baseline: 80.81,
        change: -64.81,
        changePercent: -80,
        forecast: 16.01
      },
      total: {
        baseline: 80.81,
        change: -59.91,
        changePercent: -74,
        forecast: 20.91
      }
    });
  });

  it('calculates Financial Results', () => {
    const results = getFinancialResults(project);
    expect(results.oneTimeCosts.reusableProductCosts).toBe(46);
    expect(results.oneTimeCosts.additionalCosts).toBe(10000);
    expect(results.oneTimeCosts.total).toBe(10046);
    expect(results.annualCostChanges.additionalCosts).toBe(29200);
    expect(results.annualCostChanges.reusableProductCosts).toBe(10.58);
    expect(results.annualCostChanges.singleUseProductChange).toBe(-59800);
    expect(results.annualCostChanges.utilities).toBe(871.77);
    expect(results.annualCostChanges.wasteHauling).toBe(-480);
    expect(results.annualCostChanges.change).toBe(-30198);
    expect(results.summary.oneTimeCost).toBe(10046);
    expect(results.summary.annualCost).toBe(-30198);
    expect(results.summary.paybackPeriodsMonths).toBe(4);
    expect(results.summary.annualROIPercent).toBe(200.6);
  });

  it('calculates Single Use Product Results', () => {
    const results = getSingleUseProductForecast(project);
    expect(results.summary.annualCost).toEqual({
      baseline: 85800,
      forecast: 26000,
      change: -59800,
      changePercent: -70
    });
    expect(results.summary.productCount).toEqual({
      baseline: 3,
      forecast: 4,
      change: 1,
      changePercent: 33
    });
    expect(results.summary.annualUnits).toEqual({
      baseline: 1924000,
      forecast: 1451840,
      change: -472160,
      changePercent: -25
    });
    expect(results.resultsByType.productCategory.rows.length).toBe(2);
    expect(results.resultsByType.productType.rows.length).toBe(5);
    expect(results.resultsByType.material.rows.length).toBe(5);
    expect(results.resultsByType.material.totals).toEqual({
      cost: {
        baseline: 85800,
        forecast: 26000,
        change: -59800,
        changePercent: -70
      },
      gasEmissions: {
        baseline: 80.82,
        forecast: 15.97,
        change: -64.85,
        changePercent: -80
      },
      weight: {
        baseline: 33644,
        forecast: 11508,
        change: -22136,
        changePercent: -66
      }
    });
  });
});
