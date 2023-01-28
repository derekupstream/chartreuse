import { DateRange } from '../types'

import { ProjectInventory } from '../../inventory/types/projects'

interface SingleUseProductActuals {
  purchases: Record<string, TotalsForDate>
  categories: Record<string, TotalsForDate>
  biggestChangeCategory: { id: string; change: number; changePercent: number } | null
  biggestSavingsCategory: { id: string; change: number; changePercent: number } | null
}

interface ActualsFilters {
  dateRange?: DateRange
  categoryId?: string
}

export function getSingleUseProductActuals(project: ProjectInventory, filters: ActualsFilters): SingleUseProductActuals {
  // filter by date range
  const singleUseItems = project.singleUseItems.map(item => {
    // sort records by earliest date first
    item.records.sort((a, b) => (a.entryDate > b.entryDate ? -1 : 1))

    if (filters.dateRange) {
      const records = item.records.filter(record => {
        const dateDate = new Date(record.entryDate)
        const outOfDateRange = filters.dateRange && ((filters.dateRange.start && dateDate < filters.dateRange.start) || (filters.dateRange.end && dateDate > filters.dateRange?.end))
        return !outOfDateRange
      })
      return {
        ...item,
        records,
      }
    }
    return { ...item }
  })

  return {
    categories: getCategorySummary(singleUseItems),
    purchases: getPurchaseEvents(singleUseItems, { categoryId: filters.categoryId }),
    biggestChangeCategory: getBiggestChange(singleUseItems, 'totalUnits'),
    biggestSavingsCategory: getBiggestChange(singleUseItems, 'totalCost'),
  }
}

interface RecordActual {
  actual: number
  baseline: number
  forecast: number
}

function getRecords(project: ProjectInventory) {
  project.singleUseItems.map(item => {
    const baselineDate = item.createdAt
    const records = [...item.records].sort((a, b) => (a.entryDate > b.entryDate ? -1 : 1))
    return records.map((record, index) => {
      const lastRecordDate = records[index - 1]?.entryDate || baselineDate
      return {
        baseline: {
          caseCost: item.caseCost,
          casesPurchased: item.casesPurchased,
          totalCost: item.casesPurchased * item.caseCost,
        },
        forecast: {
          caseCost: item.newCaseCost,
          casesPurchased: item.newCasesPurchased,
          totalCost: item.newCasesPurchased * item.newCaseCost,
        },
        entryDate: record.entryDate,
        caseCost: record.caseCost,
        casesPurchased: record.casesPurchased,
        totalCost: record.totalCost,
        totalUnits: record.totalUnits,
        unitsPerCase: record.unitsPerCase,
      }
    })
  })
}

interface TotalsForDate {
  //baseline: number
  totalCost: number
  unitCount: number
  productCount: number
}

// aggregate purchases by date
function getPurchaseEvents(singleUseItems: ProjectInventory['singleUseItems'], filters: { categoryId?: string }): SingleUseProductActuals['purchases'] {
  const totals: { [key: string]: TotalsForDate } = {}
  singleUseItems.forEach(item => {
    item.records.forEach(record => {
      const date = record.entryDate
      if (filters.categoryId && filters.categoryId !== item.product.category) {
        return
      }
      const totalCost = record.totalCost
      const unitCount = record.totalUnits
      const productCount = record.totalUnits ? 1 : 0
      if (totals[date]) {
        totals[date].totalCost += totalCost
        totals[date].unitCount += unitCount
        totals[date].productCount += productCount
      } else {
        totals[date] = {
          totalCost: totalCost,
          unitCount: unitCount,
          productCount: productCount,
        }
      }
    })
  })
  return totals
}

// find the biggest category change
function getBiggestChange(singleUseItems: ProjectInventory['singleUseItems'], valueType: 'totalUnits' | 'totalCost') {
  const deltas: { [key: string]: { start: number; end: number } } = {}
  singleUseItems.forEach(item => {
    if (item.records.length > 1) {
      deltas[item.product.category] ||= { start: 0, end: 0 }
      deltas[item.product.category].start += item.records[0][valueType]
      deltas[item.product.category].end += item.records[item.records.length - 1][valueType]
    }
  })

  // if there are no deltas, return null
  if (Object.keys(deltas).length === 0) {
    return null
  }

  const results: { [key: string]: { change: number; changePercent: number; id: string } } = {}

  const category = Object.keys(deltas).reduce((a, b) => {
    results[b] = {
      change: deltas[b].end - deltas[b].start,
      changePercent: (deltas[b].end - deltas[b].start) / deltas[b].start,
      id: b,
    }
    return Math.abs(results[a]?.change) > Math.abs(results[b].change) ? a : b
  })

  return results[category]
}

// get a breakdown by category of single use purchases
function getCategorySummary(singleUseItems: ProjectInventory['singleUseItems']): SingleUseProductActuals['categories'] {
  const totals: { [key: string]: TotalsForDate } = {}
  singleUseItems.forEach(item => {
    item.records.forEach(record => {
      const totalCost = record.casesPurchased * record.caseCost
      const unitCount = record.casesPurchased * record.unitsPerCase
      const productCount = record.casesPurchased ? 1 : 0
      if (totals[item.product.category]) {
        totals[item.product.category].totalCost += totalCost
        totals[item.product.category].unitCount += unitCount
        totals[item.product.category].productCount += productCount
      } else {
        totals[item.product.category] = {
          totalCost: totalCost,
          unitCount: unitCount,
          productCount: productCount,
        }
      }
    })
  })
  return totals
}
