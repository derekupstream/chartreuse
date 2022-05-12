import ExcelJS from 'exceljs'
import prisma from 'lib/prisma'
import { Project, Org, Account, Dishwasher, OtherExpense, LaborCost, ReusableLineItem, SingleUseLineItem, WasteHaulingCost } from '@prisma/client'
import { getAllProjections, AllProjectsSummary as _AllProjectsSummary, ProjectionsResponse } from 'lib/calculator'
import { poundsToTons } from 'lib/calculator/constants/conversions'
import { getProducts } from 'lib/calculator/datasets/single-use-products'
import { LABOR_CATEGORIES } from 'lib/calculator/constants/labor-categories'
import { getDishwasherStats } from 'lib/calculator/outputs/dishwasher'
import { Frequency, getannualOccurrence } from 'lib/calculator/constants/frequency'
import { OTHER_EXPENSES } from 'lib/calculator/constants/other-expenses'
import { SingleUseProduct } from 'lib/calculator/types/products'
import { round } from 'lib/calculator/utils'
import { getUtilitiesByState, USState } from 'lib/calculator/constants/utilities'

// create our own version of ProjectData. Nicer would be to make teh types in lib/calculator generic
interface ProjectData extends Project {
  org: Org
  account: Account
  dishwasher: Dishwasher[]
  otherExpenses: OtherExpense[]
  laborCosts: LaborCost[]
  reusableItems: ReusableLineItem[]
  singleUseItems: SingleUseLineItem[]
  wasteHaulingCosts: WasteHaulingCost[]
}

interface ProjectSummary extends ProjectData {
  projections: ProjectionsResponse
}

interface AllProjectsSummary extends Omit<_AllProjectsSummary, 'projects'> {
  projects: ProjectSummary[]
}

export async function getOrgExport(orgId: string) {
  const projects = await prisma.project.findMany({
    where: {
      orgId,
    },
    include: {
      account: true,
      org: true,
      dishwasher: true,
      otherExpenses: true,
      laborCosts: true,
      reusableItems: true,
      singleUseItems: true,
      wasteHaulingCosts: true,
    },
  })
  const data = await getAllProjections(projects)
  const products = await getProducts()

  return getExportFile(data as AllProjectsSummary, products)
}

const worksheetOptions: Partial<ExcelJS.AddWorksheetOptions> = {
  views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }], // lock the first row
}

function getExportFile(data: AllProjectsSummary, products: SingleUseProduct[]) {
  const workbook = new ExcelJS.Workbook()

  addSummarySheet(workbook, data)
  addProjectsSheet(workbook, data)
  addSingleUseSheet(workbook, data, products)
  addReusablesSheet(workbook, data)
  addAdditionalCostsSheet(workbook, data)
  addDishwasherSheet(workbook, data)

  return workbook
}

// Define Summary Worksheet
function addSummarySheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary) {
  const sheet = workbook.addWorksheet('All Projects Summary', worksheetOptions)

  sheet.columns = [
    { header: '', key: 'title', width: 30 },
    { header: 'Baseline', key: 'baseline', width: 20 },
    { header: 'Forecast', key: 'forecast', width: 20 },
    { header: 'Change', key: 'change', width: 20 },
  ]

  sheet.addRows([
    {
      title: 'Estimated Savings ($)',
      baseline: data.summary.savings.baseline,
      forecast: data.summary.savings.forecast,
      change: data.summary.savings.baseline - data.summary.savings.forecast,
    },
    {
      title: 'Single-Use Reduction (units)',
      baseline: data.summary.singleUse.baseline,
      forecast: data.summary.singleUse.forecast,
      change: data.summary.singleUse.baseline - data.summary.singleUse.forecast,
    },
    {
      title: 'Waste Reduction (lbs)',
      baseline: data.summary.waste.baseline,
      forecast: data.summary.waste.forecast,
      change: data.summary.waste.baseline - data.summary.waste.forecast,
    },
    {
      title: 'Waste Reduction (tons)',
      baseline: poundsToTons(data.summary.waste.baseline),
      forecast: poundsToTons(data.summary.waste.forecast),
      change: poundsToTons(data.summary.waste.baseline - data.summary.waste.forecast),
    },
    {
      title: 'GHG Reduction (MTC02e)',
      baseline: '',
      forecast: '',
      change: data.summary.gas.change,
    },
  ])
}

// Define Projects Worksheet
function addProjectsSheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary) {
  const sheet = workbook.addWorksheet('Projects', worksheetOptions)

  sheet.columns = [
    { header: 'Project', key: 'title', width: 30 },
    { header: 'Account', key: 'account', width: 30 },
    { header: 'Organization', key: 'org', width: 30 },
    ...['Savings', 'Single-Use', 'Waste', 'GHG']
      .map(title => [
        { header: `${title}: Baseline`, key: `${title}_baseline`, width: 20 },
        { header: `${title}: Forecast`, key: `${title}_forecast`, width: 20 },
        { header: `${title}: Change`, key: `${title}_change`, width: 20 },
      ])
      .flat(),
    { header: 'Gas Utility ($/therm)', key: 'gasRate', width: 20 },
    { header: 'Electric Utility ($/kWh)', key: 'electricRate', width: 20 },
    { header: 'Water Utility', key: 'waterRate', width: 20 },
    { header: 'US State', key: 'USState', width: 20 },
    { header: 'Project Type', key: 'projectType', width: 20 },
    { header: 'Daily Customers', key: 'dailyCustomers', width: 20 },
    { header: 'Dine-in vs Take-out', key: 'dineInVsTakeOut', width: 20 },
    { header: 'Food Prep', key: 'whereIsFoodPrepared', width: 20 },
    { header: 'Dishwashing Type', key: 'dishwashingType', width: 30 },
  ]

  sheet.addRows(
    data.projects.map(project => {
      const metadata = project.metadata as any
      const utilityRates = getUtilitiesByState(project.account.USState as USState)
      return {
        title: project.name,
        Savings_baseline: project.projections.financialResults.annualCostChanges.baseline,
        Savings_forecast: project.projections.financialResults.annualCostChanges.followup,
        Savings_change: project.projections.financialResults.annualCostChanges.change,
        'Single-Use_baseline': project.projections.singleUseProductResults.summary.annualUnits.baseline,
        'Single-Use_forecast': project.projections.singleUseProductResults.summary.annualUnits.followup,
        'Single-Use_change': project.projections.singleUseProductResults.summary.annualUnits.change,
        Waste_baseline: project.projections.environmentalResults.annualWasteChanges.total.baseline,
        Waste_forecast: project.projections.environmentalResults.annualWasteChanges.total.followup,
        Waste_change: project.projections.environmentalResults.annualWasteChanges.total.change,
        GHG_baseline: '',
        GHG_forecast: '',
        GHG_change: project.projections.environmentalResults.annualGasEmissionChanges.total,
        USState: project.account.USState,
        electricRate: utilityRates.electric,
        gasRate: utilityRates.gas,
        waterRate: utilityRates.water,
        projectType: metadata.type,
        dailyCustomers: metadata.customers,
        dineInVsTakeOut: metadata.hasOwnProperty('dineInVsTakeOut') ? metadata.dineInVsTakeOut + '%' : '',
        whereIsFoodPrepared: metadata.whereIsFoodPrepared,
        dishwashingType: metadata.dishwashingType,
        account: project.account.name,
        org: project.org.name,
      }
    })
  )
}

// Define Single-Use Worksheet
function addSingleUseSheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary, products: SingleUseProduct[]) {
  const sheet = workbook.addWorksheet('Single-Use Items', worksheetOptions)

  function getProduct(item: { productId: string }): Partial<SingleUseProduct> {
    return products.find(product => product.id === item.productId) || {}
  }

  sheet.columns = [
    { header: 'Product description', key: 'title', width: 40 },
    { header: 'Units per case', key: 'unitsPerCase', width: 20 },
    { header: 'Frequency', key: 'frequency', width: 20 },
    { header: 'Case Cost: Baseline', key: 'caseCost', width: 20 },
    { header: 'Cases Purchased: Baseline', key: 'casesPurchased', width: 20 },
    { header: 'Case Cost: Forecast', key: 'newCaseCost', width: 20 },
    { header: 'Cases Purchased: Forecast', key: 'newCasesPurchased', width: 20 },
    { header: 'Project', key: 'project', width: 30 },
    { header: 'Account', key: 'account', width: 30 },
    { header: 'Organization', key: 'org', width: 30 },
  ]

  sheet.addRows(
    data.projects
      .map(project =>
        project.singleUseItems.map(item => ({
          title: getProduct(item).description || '',
          project: project.name,
          account: project.account.name,
          org: project.org.name,
          caseCost: item.caseCost,
          casesPurchased: item.casesPurchased,
          frequency: item.frequency,
          newCaseCost: item.newCaseCost,
          newCasesPurchased: item.newCasesPurchased,
          unitsPerCase: item.unitsPerCase,
        }))
      )
      .flat()
  )
}

// Define Reusables Worksheet
function addReusablesSheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary) {
  const sheet = workbook.addWorksheet('Reusable Items', worksheetOptions)

  sheet.columns = [
    { header: 'Description', key: 'title', width: 30 },
    { header: 'Repurchase %', key: 'repurchase', width: 20 },
    { header: 'Case cost', key: 'caseCost', width: 20 },
    { header: 'Cases Purchased', key: 'casesPurchased', width: 20 },
    { header: 'Project', key: 'project', width: 30 },
    { header: 'Account', key: 'account', width: 30 },
    { header: 'Organization', key: 'org', width: 30 },
  ]

  sheet.addRows(
    data.projects
      .map(project =>
        project.reusableItems.map(item => ({
          title: item.productName,
          project: project.name,
          account: project.account.name,
          org: project.org.name,
          repurchase: round(item.annualRepurchasePercentage, 2),
          caseCost: item.caseCost,
          casesPurchased: item.casesPurchased,
        }))
      )
      .flat()
  )
}

// Define Additional Costs Worksheet
function addAdditionalCostsSheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary) {
  const sheet = workbook.addWorksheet('Additional Costs', worksheetOptions)

  sheet.columns = [
    { header: 'Description', key: 'title', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Frequency', key: 'frequency', width: 20 },
    { header: 'Baseline Cost', key: 'baselineCost', width: 20 },
    { header: 'Forecast Cost', key: 'forecastCost', width: 20 },
    { header: 'Annual Forecast Cost', key: 'forecastAnnualCost', width: 20 },
    { header: 'Project', key: 'project', width: 30 },
    { header: 'Account', key: 'account', width: 30 },
    { header: 'Organization', key: 'org', width: 30 },
  ]

  sheet.addRows(
    data.projects
      .map(project => [
        ...project.laborCosts.map(item => ({
          title: item.description,
          project: project.name,
          account: project.account.name,
          org: project.org.name,
          category: LABOR_CATEGORIES.find(cat => cat.id === item.categoryId)?.name || '',
          frequency: item.frequency,
          forecastCost: item.cost,
          forecastAnnualCost: getAnnualCost(item),
        })),
        ...project.wasteHaulingCosts.map(item => ({
          title: item.description,
          project: project.name,
          account: project.account.name,
          org: project.org.name,
          category: `${item.wasteStream} / ${item.serviceType}`,
          frequency: 'Monthly',
          baselineCost: item.monthlyCost,
          forecastCost: item.newMonthlyCost,
          forecastAnnualCost: getAnnualCost({ cost: item.newMonthlyCost, frequency: 'Monthly' }),
        })),
        ...project.otherExpenses.map(item => ({
          title: item.description,
          project: project.name,
          account: project.account.name,
          org: project.org.name,
          category: OTHER_EXPENSES.find(cat => cat.id === item.categoryId)?.name || '',
          frequency: item.frequency,
          forecastCost: item.cost,
          forecastAnnualCost: getAnnualCost(item),
        })),
      ])
      .flat()
  )
}

function getAnnualCost({ frequency, cost }: { frequency: string; cost: number }) {
  if (frequency === 'One Time') {
    return ''
  }
  return cost * getannualOccurrence(frequency as Frequency)
}

// Define Reusables Worksheet
function addDishwasherSheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary) {
  const sheet = workbook.addWorksheet('Dishwasher Usage', worksheetOptions)

  sheet.columns = [
    { header: '', key: 'type', width: 30 },
    { header: 'Annual usage', key: 'usage', width: 30 },
    { header: 'CO2 (lbs/yr)', key: 'weight', width: 20 },
    { header: 'Annual cost', key: 'cost', width: 20 },
    { header: 'Project', key: 'project', width: 30 },
    { header: 'Account', key: 'account', width: 30 },
    { header: 'Organization', key: 'org', width: 30 },
  ]
  sheet.addRows(
    data.projects
      .filter(project => project.dishwasher.length > 0)
      .map(project => {
        const stats = getDishwasherStats({ dishwasher: project.dishwasher[0], state: project.account.USState as USState })
        return [
          {
            type: 'Electric Usage (kWh)',
            usage: stats.electricUsage,
            weight: stats.electricCO2Weight,
            cost: stats.electricCost,
            project: project.name,
            account: project.account.name,
            org: project.org.name,
          },
          {
            type: 'Gas Usage (CF)',
            usage: stats.gasUsage,
            weight: stats.gasCO2Weight,
            cost: stats.gasCost,
            project: project.name,
            account: project.account.name,
            org: project.org.name,
          },
          {
            type: 'Water Usage (gallons)',
            usage: stats.waterUsage,
            weight: '', // water doesnt have an effect on C02
            cost: stats.waterCost,
            project: project.name,
            account: project.account.name,
            org: project.org.name,
          },
        ]
      })
      .flat()
  )
}
