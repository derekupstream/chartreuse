/**
 *
 * The following tests are based on data provided as part of the spreadsheet model from Upstream
 */

import { getProjectInput } from './calculator.spreadsheet.test.data'
import { getAnnualSummary } from './outputs/annual-summary'
import { getEnvironmentalResults } from './outputs/environmental-results'
import { getFinancialResults } from './outputs/financial-results'
import { getSingleUseProductResults } from './outputs/single-use-product-results'
import { ProjectInput } from './types/projects'

describe('Predictions Calculator: Spreadsheet results from Upstream', () => {
  let project: ProjectInput

  beforeEach(async () => {
    project = await getProjectInput()
  })

  it('calculates Annual Summary', () => {
    const results = getAnnualSummary(project)
    expect(results).toEqual({
      dollarCost: -30197.65,
      singleUseProductCount: -472160,
      greenhouseGasEmissions: -59.91,
      wasteWeight: -22100,
    })
  })

  it('calculates Environmental Results', () => {
    const results = getEnvironmentalResults(project)
    expect(results.annualGasEmissionChanges).toEqual({
      dishwashing: 4.9,
      landfillWaste: -64.81,
      total: -59.91,
    })
  })

  it('calculates Financial Results', () => {
    const results = getFinancialResults(project)
    expect(results.oneTimeCosts.reusableProductCosts).toBe(46)
    expect(results.oneTimeCosts.additionalCosts).toBe(10000)
    expect(results.oneTimeCosts.total).toBe(10046)
    expect(results.annualCostChanges.additionalCosts).toBe(29200)
    expect(results.annualCostChanges.reusableProductCosts).toBe(10.58)
    expect(results.annualCostChanges.singleUseProductChange).toBe(-59800)
    expect(results.annualCostChanges.utilities).toBe(871.77)
    expect(results.annualCostChanges.wasteHauling).toBe(-480)
    expect(results.annualCostChanges.total).toBe(-30197.65)
    expect(results.summary.oneTimeCost).toBe(10046)
    expect(results.summary.annualCost).toBe(-30197.65)
    expect(results.summary.paybackPeriodsMonths).toBe(4)
    expect(results.summary.annualROIPercent).toBe(200.59)
  })

  it('calculates Single Use Product Results', () => {
    const results = getSingleUseProductResults(project)
    expect(results.summary.annualCost).toEqual({
      baseline: 85800,
      followup: 26000,
      change: -59800,
      changePercent: -70,
    })
    expect(results.summary.productCount).toEqual({
      baseline: 3,
      followup: 4,
      change: 1,
      changePercent: 33,
    })
    expect(results.summary.annualUnits).toEqual({
      baseline: 1924000,
      followup: 1451840,
      change: -472160,
      changePercent: -25,
    })
    expect(results.resultsByType.productCategory.rows.length).toBe(2)
    expect(results.resultsByType.productType.rows.length).toBe(5)
    expect(results.resultsByType.material.rows.length).toBe(5)
    expect(results.resultsByType.material.totals).toEqual({
      cost: {
        baseline: 85800,
        followup: 26000,
        change: -59800,
        changePercent: -70,
        shareOfReduction: 100,
      },
      gasEmissions: {
        reduction: -64.84,
        shareOfReduction: 100,
      },
      weight: {
        baseline: 33644,
        followup: 11508,
        change: -22136,
        changePercent: -66,
        shareOfReduction: 100,
      },
    })
  })
})
