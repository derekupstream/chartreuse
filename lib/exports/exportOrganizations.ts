import type {
  Project,
  Org,
  Account,
  Dishwasher,
  OtherExpense,
  LaborCost,
  ReusableLineItem,
  SingleUseLineItem,
  WasteHaulingCost
} from '@prisma/client';
import ExcelJS from 'exceljs';

import { getDishwasherStats } from 'lib/calculator/calculations/getDishwasherStats';
import { poundsToTons } from 'lib/calculator/constants/conversions';
import type { Frequency } from 'lib/calculator/constants/frequency';
import { getAnnualOccurrence } from 'lib/calculator/constants/frequency';
import { LABOR_CATEGORIES } from 'lib/calculator/constants/labor-categories';
import { OTHER_EXPENSES } from 'lib/calculator/constants/other-expenses';
import { getProjectUtilities } from 'lib/calculator/constants/utilities';
import { getAllProjections } from 'lib/calculator/getProjections';
import type { AllProjectsSummary as _AllProjectsSummary, ProjectionsResponse } from 'lib/calculator/getProjections';
import { round } from 'lib/calculator/utils';
import { getReusableProducts } from 'lib/inventory/getReusableProducts';
import { getSingleUseProducts } from 'lib/inventory/getSingleUseProducts';
import type { ReusableProduct, SingleUseProduct } from 'lib/inventory/types/products';
import prisma from 'lib/prisma';

// create our own version of ProjectData. Nicer would be to make teh types in lib/calculator generic
interface ProjectData extends Project {
  org: Org;
  account: Account;
  dishwashers: Dishwasher[];
  otherExpenses: OtherExpense[];
  laborCosts: LaborCost[];
  reusableItems: ReusableLineItem[];
  singleUseItems: SingleUseLineItem[];
  wasteHaulingCosts: WasteHaulingCost[];
}

interface ProjectSummary extends ProjectData {
  projections: ProjectionsResponse;
}

interface AllProjectsSummary extends Omit<_AllProjectsSummary, 'projects'> {
  projects: ProjectSummary[];
}

type SheetRow = Record<string, string | number>;

export async function getOrgExport(orgId: string) {
  const projects = await prisma.project.findMany({
    where: {
      orgId
    },
    include: {
      account: true,
      org: true,
      dishwashers: true,
      otherExpenses: true,
      laborCosts: true,
      reusableItems: true,
      singleUseItems: true,
      wasteHaulingCosts: true
    }
  });
  const data = await getAllProjections(projects);
  const products = await getSingleUseProducts({ orgId });
  const reusableProducts = await getReusableProducts();

  return getExportFile(data as AllProjectsSummary, products, reusableProducts);
}

const worksheetOptions: Partial<ExcelJS.AddWorksheetOptions> = {
  views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }] // lock the first row
};

function getExportFile(data: AllProjectsSummary, products: SingleUseProduct[], reusableProducts: ReusableProduct[]) {
  const workbook = new ExcelJS.Workbook();

  addSummarySheet(workbook, data);
  addProjectsSheet(workbook, data);
  addSingleUseSheet(workbook, data, products);
  addReusablesSheet(workbook, data, reusableProducts);
  addAdditionalCostsSheet(workbook, data);
  addDishwasherSheet(workbook, data);

  return workbook;
}

// Define Summary Worksheet
function addSummarySheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary) {
  const sheet = workbook.addWorksheet('All Projects Summary', worksheetOptions);

  sheet.columns = [
    { header: '', key: 'title', width: 30 },
    { header: 'Baseline', key: 'baseline', width: 20 },
    { header: 'Forecast', key: 'forecast', width: 20 },
    { header: 'Change', key: 'change', width: 20 }
  ];

  const rows: SheetRow[] = [
    {
      title: 'Estimated Savings ($)',
      baseline: data.summary.savings.baseline,
      forecast: data.summary.savings.forecast,
      change: data.summary.savings.baseline - data.summary.savings.forecast
    },
    {
      title: 'Single-Use Reduction (units)',
      baseline: data.summary.singleUse.baseline,
      forecast: data.summary.singleUse.forecast,
      change: data.summary.singleUse.baseline - data.summary.singleUse.forecast
    },
    {
      title: 'Waste Reduction (lbs)',
      baseline: data.summary.waste.baseline,
      forecast: data.summary.waste.forecast,
      change: data.summary.waste.baseline - data.summary.waste.forecast
    },
    {
      title: 'Waste Reduction (tons)',
      baseline: poundsToTons(data.summary.waste.baseline),
      forecast: poundsToTons(data.summary.waste.forecast),
      change: poundsToTons(data.summary.waste.baseline - data.summary.waste.forecast)
    },
    {
      title: 'GHG Reduction (MTC02e)',
      baseline: data.summary.gas.baseline,
      forecast: data.summary.gas.forecast,
      change: data.summary.gas.baseline - data.summary.gas.forecast
    }
  ];

  sheet.addRows(rows);
}

// Define Projects Worksheet
function addProjectsSheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary) {
  const sheet = workbook.addWorksheet('Projects', worksheetOptions);

  sheet.columns = [
    { header: 'Project', key: 'title', width: 30 },
    { header: 'Account', key: 'account', width: 30 },
    { header: 'Organization', key: 'org', width: 30 },
    ...['Savings', 'Single-Use unit', 'Waste', 'GHG']
      .map(title => [
        { header: `${title}: Baseline`, key: `${title}_baseline`, width: 20 },
        { header: `${title}: Forecast`, key: `${title}_forecast`, width: 20 },
        { header: `${title}: Change`, key: `${title}_change`, width: 20 }
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
    { header: 'Dishwashing Type', key: 'dishwashingType', width: 30 }
  ];

  const rows = data.projects.map(project => {
    const metadata = project.metadata as any;
    const utilityRates = getProjectUtilities(project);
    return {
      title: project.name,
      Savings_baseline: project.projections.financialResults.annualCostChanges.baseline,
      Savings_forecast: project.projections.financialResults.annualCostChanges.forecast,
      Savings_change: project.projections.financialResults.annualCostChanges.change,
      'Single-Use_baseline': project.projections.singleUseResults.summary.annualUnits.baseline,
      'Single-Use_forecast': project.projections.singleUseResults.summary.annualUnits.forecast,
      'Single-Use_change': project.projections.singleUseResults.summary.annualUnits.change,
      Waste_baseline: project.projections.environmentalResults.annualWasteChanges.total.baseline,
      Waste_forecast: project.projections.environmentalResults.annualWasteChanges.total.forecast,
      Waste_change: project.projections.environmentalResults.annualWasteChanges.total.change,
      GHG_baseline: project.projections.environmentalResults.annualGasEmissionChanges.total.baseline,
      GHG_forecast: project.projections.environmentalResults.annualGasEmissionChanges.total.forecast,
      GHG_change: project.projections.environmentalResults.annualGasEmissionChanges.total.change,
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
      org: project.org.name
    };
  });

  sheet.addRows(rows);
}

function getProduct<T extends SingleUseProduct>(products: T[], productId: string): { description: string } {
  return products.find(product => product.id === productId) || { description: '' };
}

// Define Single-Use Worksheet
function addSingleUseSheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary, products: SingleUseProduct[]) {
  const sheet = workbook.addWorksheet('Single-Use Items', worksheetOptions);

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
    { header: 'Organization', key: 'org', width: 30 }
  ];

  const rows: SheetRow[] = data.projects
    .map(project =>
      project.singleUseItems.map(item => ({
        title: getProduct(products, item.productId).description,
        project: project.name,
        account: project.account.name,
        org: project.org.name,
        caseCost: item.caseCost,
        casesPurchased: item.casesPurchased,
        frequency: item.frequency,
        newCaseCost: item.newCaseCost,
        newCasesPurchased: item.newCasesPurchased,
        unitsPerCase: item.unitsPerCase
      }))
    )
    .flat();

  sheet.addRows(rows);
}

// Define Reusables Worksheet
function addReusablesSheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary, products: ReusableProduct[]) {
  const sheet = workbook.addWorksheet('Reusable Items', worksheetOptions);

  sheet.columns = [
    { header: 'Description', key: 'title', width: 30 },
    { header: 'Repurchase %', key: 'repurchase', width: 20 },
    { header: 'Case cost', key: 'caseCost', width: 20 },
    { header: 'Cases Purchased', key: 'casesPurchased', width: 20 },
    { header: 'Units per case', key: 'unitsPerCase', width: 20 },
    { header: 'Project', key: 'project', width: 30 },
    { header: 'Account', key: 'account', width: 30 },
    { header: 'Organization', key: 'org', width: 30 }
  ];

  const rows: SheetRow[] = data.projects
    .map(project =>
      project.reusableItems.map(item => ({
        title: item.productName || (item.productId && getProduct(products, item.productId).description) || '',
        project: project.name,
        account: project.account.name,
        org: project.org.name,
        repurchase: round(item.annualRepurchasePercentage, 2),
        caseCost: item.caseCost,
        casesPurchased: item.casesPurchased,
        unitsPerCase: item.unitsPerCase
      }))
    )
    .flat();

  sheet.addRows(rows);
}

// Define Additional Costs Worksheet
function addAdditionalCostsSheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary) {
  const sheet = workbook.addWorksheet('Additional Costs', worksheetOptions);

  sheet.columns = [
    { header: 'Description', key: 'title', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Frequency', key: 'frequency', width: 20 },
    { header: 'Cost: Baseline', key: 'baselineCost', width: 20 },
    { header: 'Cost: Forecast', key: 'forecastCost', width: 20 },
    { header: 'Annual Cost', key: 'forecastAnnualCost', width: 20 },
    { header: 'Project', key: 'project', width: 30 },
    { header: 'Account', key: 'account', width: 30 },
    { header: 'Organization', key: 'org', width: 30 }
  ];

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
          forecastAnnualCost: getAnnualCost(item)
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
          forecastAnnualCost: getAnnualCost({ cost: item.newMonthlyCost, frequency: 'Monthly' })
        })),
        ...project.otherExpenses.map(item => ({
          title: item.description,
          project: project.name,
          account: project.account.name,
          org: project.org.name,
          category: OTHER_EXPENSES.find(cat => cat.id === item.categoryId)?.name || '',
          frequency: item.frequency,
          forecastCost: item.cost,
          forecastAnnualCost: getAnnualCost(item)
        }))
      ])
      .flat()
  );
}

function getAnnualCost({ frequency, cost }: { frequency: string; cost: number }) {
  if (frequency === 'One Time') {
    return '';
  }
  return cost * getAnnualOccurrence(frequency as Frequency);
}

// Define Reusables Worksheet
function addDishwasherSheet(workbook: ExcelJS.Workbook, data: AllProjectsSummary) {
  const sheet = workbook.addWorksheet('Dishwasher Usage', worksheetOptions);

  sheet.columns = [
    { header: '', key: 'type', width: 30 },
    { header: 'Annual usage: Baseline', key: 'usage', width: 30 },
    { header: 'CO2 (lbs/yr): Baseline', key: 'weight', width: 20 },
    { header: 'Annual cost: Baseline', key: 'cost', width: 20 },
    { header: 'Annual usage: Forecast', key: 'usageForecast', width: 30 },
    { header: 'CO2 (lbs/yr): Forecast', key: 'weightForecast', width: 20 },
    { header: 'Annual cost: Forecast', key: 'cost', width: 20 },
    { header: 'Annual cost: Forecast', key: 'cost', width: 20 },
    { header: 'Project', key: 'project', width: 30 },
    { header: 'Account', key: 'account', width: 30 },
    { header: 'Organization', key: 'org', width: 30 }
  ];
  sheet.addRows(
    data.projects
      .filter(project => project.dishwashers.length > 0)
      .map(project => {
        const rates = getProjectUtilities(project);
        const stats = getDishwasherStats({ dishwasher: project.dishwashers[0], rates });
        const rows: SheetRow[] = [
          {
            type: 'Electric Usage (kWh)',
            usage: stats.electricUsage.baseline,
            usageForecast: stats.electricUsage.forecast,
            weight: stats.electricCO2Weight.baseline,
            weightForecast: stats.electricCO2Weight.forecast,
            cost: stats.electricCost.baseline,
            costForecast: stats.electricCost.forecast,
            project: project.name,
            account: project.account.name,
            org: project.org.name
          },
          {
            type: 'Gas Usage (CF)',
            usage: stats.gasUsage.baseline,
            usageForecast: stats.gasUsage.forecast,
            weight: stats.gasCO2Weight.baseline,
            weightForecast: stats.gasCO2Weight.forecast,
            cost: stats.gasCost.baseline,
            costForecast: stats.gasCost.forecast,
            project: project.name,
            account: project.account.name,
            org: project.org.name
          },
          {
            type: 'Water Usage (gallons)',
            usage: stats.waterUsage.baseline,
            usageForecast: stats.waterUsage.forecast,
            weight: '', // water doesnt have an effect on C02
            weightForecast: '', // water doesnt have an effect on C02
            cost: stats.waterCost.baseline,
            costForecast: stats.waterCost.forecast,
            project: project.name,
            account: project.account.name,
            org: project.org.name
          }
        ];
        return rows;
      })
      .flat()
  );
}
