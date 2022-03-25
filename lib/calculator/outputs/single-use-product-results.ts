import { MATERIALS } from '../constants/materials'
import { Frequency, getAnnualOccurence } from '../constants/frequency'
import { PRODUCT_CATEGORIES } from '../constants/product-categories'
import { PRODUCT_TYPES } from '../constants/product-types'
import { ProjectInput } from '../types/projects'
import { SingleUseProduct } from '../types/products'
import { ChangeSummary, getChangeSummaryRow, getChangeSummaryRowRounded, round } from '../utils'
import { singleUseItemGasEmissions } from './environmental-results'
import { CORRUGATED_CARDBOARD_NAME } from '../constants/materials'

interface PurchasingSummaryColumn {
  annualCost: number
  annualUnits: number
  productCount: number
}

interface SingleUseProductResults {
  summary: {
    annualCost: ChangeSummary
    annualUnits: ChangeSummary
    productCount: ChangeSummary
  }
  resultsByType: {
    material: {
      rows: CombinedLineItemResultsWithTitle[]
      totals: CombinedLineItemResults
    }
    productType: {
      rows: CombinedLineItemResultsWithTitle[]
      totals: CombinedLineItemResults
    }
    productCategory: {
      rows: CombinedLineItemResultsWithTitle[]
      totals: CombinedLineItemResults
    }
  }
}

export function getSingleUseProductResults(project: ProjectInput): SingleUseProductResults {
  const summary = getSingleUseProductSummary(project.singleUseItems)
  const resultsByType = getResultsByType(project.singleUseItems)

  return {
    summary,
    resultsByType,
  }
}

// for each single use item, calculate difference in annual cost
export function getSingleUseProductSummary(singleUseItems: ProjectInput['singleUseItems']): SingleUseProductResults['summary'] {
  const baseline = singleUseItems.reduce<PurchasingSummaryColumn>(
    (column, item) => {
      const { caseCost, casesPurchased, frequency, product } = item
      const annualCost = annualSingleUseCost({
        caseCost,
        casesPurchased,
        frequency,
      })
      const annualUnits =
        product.unitsPerCase *
        annualSingleUseCaseCount({
          casesPurchased,
          frequency,
        })

      return {
        annualUnits: column.annualUnits + annualUnits,
        annualCost: column.annualCost + annualCost,
        productCount: annualUnits > 0 ? column.productCount + 1 : column.productCount,
      }
    },
    { annualCost: 0, annualUnits: 0, productCount: 0 }
  )

  const followup = singleUseItems.reduce<PurchasingSummaryColumn>(
    (column, item) => {
      const { newCaseCost: caseCost, newCasesPurchased: casesPurchased, frequency, product } = item
      const annualCost = annualSingleUseCost({
        caseCost,
        casesPurchased,
        frequency,
      })
      const annualUnits =
        product.unitsPerCase *
        annualSingleUseCaseCount({
          casesPurchased,
          frequency,
        })

      return {
        annualUnits: column.annualUnits + annualUnits,
        annualCost: column.annualCost + annualCost,
        productCount: annualUnits > 0 ? column.productCount + 1 : column.productCount,
      }
    },
    { annualCost: 0, annualUnits: 0, productCount: 0 }
  )

  return {
    annualCost: getChangeSummaryRow(baseline.annualCost, followup.annualCost),
    annualUnits: getChangeSummaryRow(baseline.annualUnits, followup.annualUnits),
    productCount: getChangeSummaryRow(baseline.productCount, followup.productCount),
  }
}

// Detailed Results, Column M: =$J5*L5*INDEX(HIDDEN_Purchase_Frequency_Table,MATCH($I5,HIDDEN_Purchase_Frequency_Options,0),2)
function annualSingleUseCost(item: { caseCost: number; casesPurchased: number; frequency: Frequency }) {
  return item.caseCost * annualSingleUseCaseCount(item)
}

// Detailed Results, Column N
function annualSingleUseCaseCount(item: { casesPurchased: number; frequency: Frequency }) {
  const frequencyVal = getAnnualOccurence(item.frequency)
  return item.casesPurchased * frequencyVal
}

export function annualSingleUseWeight(casesPurchased: number, annualOccurence: number, unitsPerCase: number, weightPerUnit: number) {
  const annualUnits = casesPurchased * unitsPerCase * annualOccurence
  return annualUnits * weightPerUnit
}

// See Sheet 5: Detailed Results
interface SingleUseDetailedResult {
  annualCost: number
  annualBoxWeight: number
  annualWeight: number
  category: SingleUseProduct['category']
  gasEmissionsReduction: number
  type: SingleUseProduct['type']
  followupAnnualCost: number
  followupAnnualWeight: number
  followupAnnualBoxWeight: number
  primaryMaterial: SingleUseProduct['primaryMaterial']
  primaryGasReduction: number
  secondaryGasReduction: number
  shippingBoxGasReduction: number
}

function getDetailedLineItemResults(singleUseItems: ProjectInput['singleUseItems']): SingleUseDetailedResult[] {
  return singleUseItems.map(lineItem => {
    const annualCost = annualSingleUseCost({
      caseCost: lineItem.caseCost,
      casesPurchased: lineItem.casesPurchased,
      frequency: lineItem.frequency,
    })
    const followupAnnualCost = annualSingleUseCost({
      caseCost: lineItem.caseCost,
      casesPurchased: lineItem.newCasesPurchased,
      frequency: lineItem.frequency,
    })
    const annualOccurence = getAnnualOccurence(lineItem.frequency)
    const product = lineItem.product
    const annualWeight = annualSingleUseWeight(lineItem.casesPurchased, annualOccurence, product.unitsPerCase, product.primaryMaterialWeightPerUnit)
    const followupAnnualWeight = annualSingleUseWeight(lineItem.newCasesPurchased, annualOccurence, product.unitsPerCase, product.primaryMaterialWeightPerUnit)

    const { primaryGasReduction, secondaryGasReduction, shippingBoxGasReduction, totalGasReductions } = singleUseItemGasEmissions(lineItem)

    const annualBoxWeight = lineItem.casesPurchased * lineItem.product.boxWeight * annualOccurence
    const followupAnnualBoxWeight = lineItem.newCasesPurchased * lineItem.product.boxWeight * annualOccurence

    const detailedResult: SingleUseDetailedResult = {
      annualBoxWeight,
      annualCost,
      annualWeight,
      category: product.category,
      followupAnnualCost,
      followupAnnualWeight,
      followupAnnualBoxWeight,
      gasEmissionsReduction: totalGasReductions,
      primaryMaterial: product.primaryMaterial,
      primaryGasReduction,
      secondaryGasReduction,
      shippingBoxGasReduction,
      type: product.type,
    }
    return detailedResult
  })
}

// see HIDDEN: Output Calculations
interface CombinedLineItemResults {
  cost: ChangeSummary & {
    shareOfReduction: number
  }
  gasEmissions: {
    reduction: number
    shareOfReduction: number
  }
  weight: ChangeSummary & {
    shareOfReduction: number
  }
}

interface CombinedLineItemResultsWithTitle extends CombinedLineItemResults {
  title: string
}

function getResultsByType(singleUseItems: ProjectInput['singleUseItems']): SingleUseProductResults['resultsByType'] {
  const detailedResults = getDetailedLineItemResults(singleUseItems)

  const itemsByCategory = PRODUCT_CATEGORIES.map(category => {
    const items = detailedResults.filter(item => item.category === category.id)
    return { title: category.name, items }
  })

  const itemsByType = PRODUCT_TYPES.map(type => {
    const items = detailedResults.filter(item => item.type === type.id)
    return { title: type.name, items }
  })

  const materialRows = MATERIALS.map(material => {
    const items = detailedResults.filter(item => {
      // all products require some cardboard
      if (material.name === CORRUGATED_CARDBOARD_NAME) {
        return true
      } else {
        return item.primaryMaterial === material.id
      }
    })
    return { title: material.name, items }
  })

  return {
    productCategory: combineResultsByCategory(itemsByCategory),
    material: combineResultsByCategory(materialRows),
    productType: combineResultsByCategory(itemsByType),
  }
}

const emptyCombinedResults: CombinedLineItemResults = {
  cost: {
    baseline: 0,
    followup: 0,
    change: 0,
    changePercent: 0,
    shareOfReduction: 0,
  },
  gasEmissions: {
    reduction: 0,
    shareOfReduction: 0,
  },
  weight: {
    baseline: 0,
    followup: 0,
    change: 0,
    changePercent: 0,
    shareOfReduction: 0,
  },
}

// combine the results of a group of line items
function combineLineItemResults(title: string, items: SingleUseDetailedResult[]): CombinedLineItemResultsWithTitle {
  return items.reduce(
    (result, item) => {
      const baselineCost = result.cost.baseline + item.annualCost
      const followupCost = result.cost.followup + item.followupAnnualCost
      let cost = getChangeSummaryRow(baselineCost, followupCost)
      let annualWeight = item.annualWeight
      let followupAnnualWeight = item.followupAnnualWeight
      let gasEmissionsReduction = item.primaryGasReduction
      // calculate box weight for cardboard
      if (title === CORRUGATED_CARDBOARD_NAME) {
        annualWeight = item.annualBoxWeight
        followupAnnualWeight = item.followupAnnualBoxWeight
        cost = getChangeSummaryRow(0, 0)
        gasEmissionsReduction = item.shippingBoxGasReduction
      }
      const baselineWeight = result.weight.baseline + annualWeight
      const followupWeight = result.weight.followup + followupAnnualWeight
      const weight = getChangeSummaryRow(baselineWeight, followupWeight)

      return {
        title,
        cost: {
          ...cost,
          shareOfReduction: 0,
        },
        gasEmissions: {
          reduction: result.gasEmissions.reduction + gasEmissionsReduction,
          shareOfReduction: 0,
        },
        weight: {
          ...weight,
          shareOfReduction: 0, // to be calculated later
        },
      }
    },
    {
      title,
      ...emptyCombinedResults,
    }
  )
}

function combineResultsByCategory(items: { title: string; items: SingleUseDetailedResult[] }[]): { totals: CombinedLineItemResults; rows: CombinedLineItemResultsWithTitle[] } {
  const rows = items.map(item => combineLineItemResults(item.title, item.items))

  const totals = rows.reduce((totals, row) => {
    const baselineCost = totals.cost.baseline + row.cost.baseline
    const followupCost = totals.cost.followup + row.cost.followup
    const cost = getChangeSummaryRowRounded(baselineCost, followupCost)
    const baselineWeight = totals.weight.baseline + row.weight.baseline
    const followupWeight = totals.weight.followup + row.weight.followup
    const weight = getChangeSummaryRowRounded(baselineWeight, followupWeight)

    return {
      cost: {
        ...cost,
        shareOfReduction: 100,
      },
      gasEmissions: {
        reduction: totals.gasEmissions.reduction + row.gasEmissions.reduction,
        shareOfReduction: 100,
      },
      weight: {
        ...weight,
        shareOfReduction: 100,
      },
    }
  }, emptyCombinedResults)

  // calculate shares of reduction, only count against other line items that had negative reduction
  const totalCostReduction = rows.reduce((total, row) => (row.cost.change < 0 ? total + row.cost.change : total), 0)
  const totalGasReduction = rows.reduce((total, row) => (row.gasEmissions.reduction < 0 ? total + row.gasEmissions.reduction : total), 0)
  const totalWeightReduction = rows.reduce((total, row) => (row.weight.change < 0 ? total + row.weight.change : total), 0)

  rows.forEach(row => {
    if (row.cost.change < 0) {
      row.cost.shareOfReduction = round(row.gasEmissions.reduction / totalCostReduction)
    }
    if (row.gasEmissions.reduction < 0) {
      row.gasEmissions.shareOfReduction = round(row.gasEmissions.reduction / totalGasReduction, 2)
      row.gasEmissions.reduction = round(row.gasEmissions.reduction, 2)
    }
    if (row.weight.change < 0) {
      row.weight.shareOfReduction = round(row.gasEmissions.reduction / totalWeightReduction)
    }
  })

  totals.gasEmissions.reduction = round(totals.gasEmissions.reduction, 2)

  const nonEmptyRows = rows.filter(row => row.cost.baseline !== 0 || row.cost.followup !== 0 || row.weight.baseline !== 0 || row.weight.followup !== 0)

  return {
    rows: nonEmptyRows,
    totals,
  }
}
