import type {
  LaborCost,
  OtherExpense,
  ReusableLineItem,
  SingleUseLineItem,
  SingleUseLineItemRecord,
  WasteHaulingCost,
  EventFoodwareLineItem
} from '@prisma/client';

import prisma from 'lib/prisma';

import type { Frequency } from '../calculator/constants/frequency';
import type { LaborCostCategory } from '../calculator/constants/labor-categories';
import type { OtherExpenseCategory } from '../calculator/constants/other-expenses';
import { PRODUCT_CATEGORIES } from '../calculator/constants/product-categories';
import type { USState } from '../calculator/constants/utilities';
import { BOTTLE_STATION_PRODUCT_ID } from '../calculator/constants/reusable-product-types';
import { getProjectUtilities } from '../calculator/constants/utilities';

import { getReusableProductsWithBottleStation } from './assets/reusables/getReusableProducts';
import { getSingleUseProducts } from './getSingleUseProducts';
import type { FoodwareSelection, ReusableProduct, SingleUseProduct } from './types/products';
import type {
  DishWasher,
  ProjectInventory,
  WasteHaulingService,
  ReusableLineItemPopulated,
  CalculatorDishWasherSimple
} from './types/projects';

const gallonsUsedPerBottleStation = 27.15;
const gallonsPerBottle = 0.132;

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
      eventFoodwareItems: true,
      reusableItems: true,
      dishwashers: true,
      dishwashersSimple: true,
      truckTransportationCosts: {
        select: {
          id: true,
          distanceInMiles: true
        }
      },
      wasteHaulingCosts: true,
      org: {
        select: {
          useMetricSystem: true
        }
      }
    }
  });
  if (!project) {
    throw new Error('Project not found. Project Id: ' + projectId);
  }
  // get utility rates
  const utilityRates = getProjectUtilities(project);
  // map db model types to frontend types
  const products = await getSingleUseProducts({ orgId: project.orgId });
  const reusableProducts = await getReusableProductsWithBottleStation();
  const laborCosts = project.laborCosts.map(mapLaborCost);
  const otherExpenses = project.otherExpenses.map(mapAdditionalCost);
  const reusableItems = project.reusableItems.map(item => mapReusableItem(item, reusableProducts));
  const singleUseItems = project.singleUseItems.map(item => mapSingleUseItem(item, products));
  const wasteHauling = project.wasteHaulingCosts.map(mapWasteHauling);
  const foodwareItems = project.eventFoodwareItems.map(item => mapFoodwareItem(item, products, reusableProducts));
  const foodwareSingleUseItems = foodwareItems.map(item => mapFoodwareSingleUseItem(item));
  const foodwareReusableItems = foodwareItems.map(item => mapFoodwareReusableItem(item));
  const allSingleUseItems = [...singleUseItems, ...foodwareSingleUseItems];
  // only calculate racks used for dishwashers if the project is an event
  const racksUsedForEventProjects =
    project.category !== 'event'
      ? 0
      : allSingleUseItems.reduce((sum, item) => {
          return (
            sum +
            (item.product.reusableItemCountPerRack ? item.unitsPerCase / item.product.reusableItemCountPerRack : 0)
          );
        }, 0);
  return {
    isEventProject: project.category === 'event',
    dishwashers: project.dishwashers as DishWasher[],
    dishwashersSimple: project.dishwashersSimple as CalculatorDishWasherSimple[],
    laborCosts,
    otherExpenses,
    reusableItems: [...reusableItems, ...foodwareReusableItems],
    singleUseItems: allSingleUseItems,
    racksUsedForEventProjects,
    foodwareItems,
    state: project.USState as USState,
    utilityRates,
    wasteHauling,
    truckTransportationCosts: project.truckTransportationCosts
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

function mapFoodwareItem(
  item: EventFoodwareLineItem,
  products: SingleUseProduct[],
  reusableProducts: ReusableProduct[]
): FoodwareSelection {
  return {
    id: item.id,
    createdAt: item.createdAt,
    projectId: item.projectId,
    reusableItemCount: item.reusableItemCount,
    reusableReturnPercentage: item.reusableReturnPercentage,
    reusableReturnCount: item.reusableReturnCount,
    waterUsageGallons: item.waterUsageGallons ?? undefined,
    reusableProduct: reusableProducts.find(product => product.id === item.reusableProductId)!,
    singleUseProduct: products.find(product => product.id === item.singleUseProductId)!
  };
}

function mapReusableItem(reusableItem: ReusableLineItem, products: ReusableProduct[]): ReusableLineItemPopulated {
  const product = products.find(product => product.id === reusableItem.productId);
  // if (!product) {
  //   throw new Error('Product not found. Product Id: ' + reusableItem.productId);
  // }
  const category = PRODUCT_CATEGORIES.find(c => c.id === product?.category);
  return {
    ...reusableItem,
    categoryName: category?.name ?? 'N/A',
    newCaseCost: reusableItem.caseCost,
    // frequency: 'Annually',
    newCasesPurchased: reusableItem.casesPurchased * reusableItem.annualRepurchasePercentage,
    // totalCost: reusableItem.casesPurchased * reusableItem.caseCost,
    // totalUnits: reusableItem.casesPurchased * reusableItem.unitsPerCase,
    product
  };
}

function mapFoodwareReusableItem(item: FoodwareSelection): ProjectInventory['reusableItems'][number] {
  const product = item.reusableProduct;
  const isBottleStation = product.id === BOTTLE_STATION_PRODUCT_ID;
  const returnPercent = item.reusableReturnPercentage
    ? item.reusableReturnPercentage
    : (item.reusableReturnCount / item.reusableItemCount) * 100;
  // we want to only consider the impact of lost reusable items
  const lossRate = 1 - returnPercent / 100;
  // assume bottle stations do not need to be 'replaced'
  const unitsPerCase = isBottleStation ? 0 : item.reusableItemCount * lossRate;
  return {
    id: item.id,
    categoryName: 'N/A',
    newCaseCost: 0,
    newCasesPurchased: 1,
    unitsPerCase,
    productId: product.id,
    projectId: item.projectId,
    product,
    categoryId: 'N/A',
    annualRepurchasePercentage: 0,
    caseCost: 0,
    casesPurchased: 0,
    productName: product.description,
    forecastWaterUsageGallons: item.waterUsageGallons ?? undefined
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
    throw new Error('Single Use Product not found. Product Id: ' + singleUseItem.productId);
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

function mapFoodwareSingleUseItem(item: FoodwareSelection): ProjectInventory['singleUseItems'][number] {
  const product = item.singleUseProduct;
  // for water stations, we want to consider the impact of water bottle single use items
  const waterPerStation = item.waterUsageGallons || 27.15;
  const totalWaterUsageGallons = waterPerStation * item.reusableItemCount;
  const unitsPerCase =
    item.reusableProduct.id === BOTTLE_STATION_PRODUCT_ID
      ? totalWaterUsageGallons
        ? Math.floor(totalWaterUsageGallons / gallonsPerBottle)
        : 0
      : item.reusableItemCount;

  return {
    casesPurchased: 1,
    unitsPerCase,
    // other unimportant fields...
    createdAt: item.createdAt,
    id: item.id,
    categoryName: 'N/A',
    caseCost: 0,
    totalCost: 0,
    totalUnits: 0,
    product,
    records: [],
    newCaseCost: 0,
    newCasesPurchased: 0,
    projectId: item.projectId,
    frequency: 'Annually',
    productId: product.id,
    baselineWaterUsageGallons: item.waterUsageGallons
  };
}

function mapWasteHauling(wasteHaulingCost: WasteHaulingCost): ProjectInventory['wasteHauling'][number] {
  return {
    ...wasteHaulingCost,
    serviceType: wasteHaulingCost.serviceType as WasteHaulingService['serviceType'],
    wasteStream: wasteHaulingCost.wasteStream as WasteHaulingService['wasteStream']
  };
}
