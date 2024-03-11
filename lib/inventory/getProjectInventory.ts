import type {
  LaborCost,
  OtherExpense,
  SingleUseLineItem,
  SingleUseLineItemRecord,
  WasteHaulingCost
} from '@prisma/client';

import prisma from 'lib/prisma';

import type { Frequency } from '../calculator/constants/frequency';
import type { LaborCostCategory } from '../calculator/constants/labor-categories';
import type { OtherExpenseCategory } from '../calculator/constants/other-expenses';
import { PRODUCT_CATEGORIES } from '../calculator/constants/product-categories';
import type { USState } from '../calculator/constants/utilities';
import { getProjectUtilities } from '../calculator/constants/utilities';

import { getSingleUseProducts } from './getSingleUseProducts';
import type { SingleUseProduct } from './types/products';
import type { DishWasher, ProjectInventory, WasteHaulingService } from './types/projects';

export async function getProjectInventory(projectId: string): Promise<ProjectInventory> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId
    },
    include: {
      account: true,
      otherExpenses: true,
      laborCosts: true,
      singleUseItems: {
        include: {
          records: true
        }
      },
      reusableItems: true,
      dishwashers: true,
      wasteHaulingCosts: true
    }
  });
  if (!project) {
    throw new Error('Project not found. Project Id: ' + projectId);
  }

  // get utility rates
  const utilityRates = getProjectUtilities(project);

  // map db model types to frontend types
  const products = await getSingleUseProducts({ orgId: project.orgId });
  const laborCosts = project.laborCosts.map(mapLaborCost);
  const otherExpenses = project.otherExpenses.map(mapAdditionalCost);
  const singleUseItems = project.singleUseItems.map(item => mapSingleUseItem(item, products));
  const wasteHauling = project.wasteHaulingCosts.map(mapWasteHauling);

  return {
    dishwashers: project.dishwashers as DishWasher[],
    laborCosts,
    otherExpenses,
    // @ts-ignore
    reusableItems: project.reusableItems,
    singleUseItems,
    state: project.USState as USState,
    utilityRates,
    wasteHauling
  };
}

function mapLaborCost(expense: LaborCost): ProjectInventory['laborCosts'][number] {
  return {
    ...expense,
    categoryId: expense.categoryId as LaborCostCategory,
    frequency: expense.frequency as Frequency
  };
}

function mapAdditionalCost(expense: OtherExpense): ProjectInventory['otherExpenses'][number] {
  return {
    ...expense,
    categoryId: expense.categoryId as OtherExpenseCategory,
    frequency: expense.frequency as Frequency
  };
}

function mapSingleUseItem(
  singleUseItem: SingleUseLineItem & {
    records: SingleUseLineItemRecord[];
  },
  products: SingleUseProduct[]
): ProjectInventory['singleUseItems'][number] {
  const product = products.find(product => product.id === singleUseItem.productId);
  if (!product) {
    throw new Error('Product not found. Product Id: ' + singleUseItem.productId);
  }

  const category = PRODUCT_CATEGORIES.find(c => c.id === product.category);
  return {
    ...singleUseItem,
    categoryName: category?.name ?? 'N/A',
    totalCost: singleUseItem.casesPurchased * singleUseItem.caseCost,
    totalUnits: singleUseItem.casesPurchased * singleUseItem.unitsPerCase,
    records: singleUseItem.records.map(record => ({
      ...record,
      entryDate: record.entryDate.toISOString(),
      totalCost: record.caseCost * record.casesPurchased,
      totalUnits: record.casesPurchased * record.unitsPerCase
    })),
    frequency: singleUseItem.frequency as Frequency,
    product
  };
}

function mapWasteHauling(wasteHaulingCost: WasteHaulingCost): ProjectInventory['wasteHauling'][number] {
  return {
    ...wasteHaulingCost,
    serviceType: wasteHaulingCost.serviceType as WasteHaulingService['serviceType'],
    wasteStream: wasteHaulingCost.wasteStream as WasteHaulingService['wasteStream']
  };
}
