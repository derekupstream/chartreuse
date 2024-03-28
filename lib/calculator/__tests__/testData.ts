import { getSingleUseProducts } from 'lib/inventory/assets/upstream/getSingleUseProducts';
import type { ProjectInventory } from 'lib/inventory/types/projects';
import type {
  OtherExpense,
  DishWasher,
  ReusableLineItemPopulated,
  SingleUseLineItem,
  WasteHaulingService
} from 'lib/inventory/types/projects';

const projectId = 'aaa';

export const singleUseItems: (SingleUseLineItem & { categoryName: string })[] = [
  {
    id: 'aaa',
    caseCost: 80,
    casesPurchased: 10,
    categoryName: 'Foodware',
    productId: '17',
    projectId,
    frequency: 'Weekly',
    newCaseCost: 80,
    newCasesPurchased: 0,
    unitsPerCase: 200
  },
  {
    id: 'aaa',
    caseCost: 30,
    casesPurchased: 15,
    categoryName: 'Foodware',
    productId: '7',
    projectId,
    frequency: 'Weekly',
    newCaseCost: 30,
    newCasesPurchased: 5,
    unitsPerCase: 1000
  },
  {
    id: 'aaa',
    caseCost: 20,
    casesPurchased: 20,
    categoryName: 'Foodware',
    productId: '3',
    projectId,
    frequency: 'Weekly',
    newCaseCost: 20,
    newCasesPurchased: 10,
    unitsPerCase: 1000
  },
  {
    id: 'aaa',
    caseCost: 50,
    casesPurchased: 0,
    categoryName: 'Foodware',
    productId: '16',
    projectId,
    frequency: 'Weekly',
    newCaseCost: 50,
    newCasesPurchased: 2,
    unitsPerCase: 210
  },
  {
    id: 'aaa',
    caseCost: 10,
    casesPurchased: 0,
    categoryName: 'Foodware',
    productId: '93',
    projectId,
    frequency: 'Weekly',
    newCaseCost: 10,
    newCasesPurchased: 5,
    unitsPerCase: 2500
  }
];

const reusableItems: ReusableLineItemPopulated[] = [
  {
    categoryId: '1',
    projectId,
    productId: null,
    productName: 'Cup',
    caseCost: 23,
    newCaseCost: 23,
    casesPurchased: 2,
    unitsPerCase: 10,
    annualRepurchasePercentage: 0.23,
    newCasesPurchased: 2 * 0.23,
    categoryName: 'Foodware'
  }
];

const otherExpenses: OtherExpense[] = [
  { projectId, cost: 80, frequency: 'Daily', categoryId: '3' },
  { projectId, cost: 5000, frequency: 'One Time', categoryId: '2' },
  { projectId, cost: 5000, frequency: 'One Time', categoryId: '3' }
];

const dishwasher: DishWasher = {
  racksPerDay: 0,
  newRacksPerDay: 80,
  boosterWaterHeaterFuelType: 'Electric',
  buildingWaterHeaterFuelType: 'Electric',
  energyStarCertified: true,
  operatingDays: 0,
  newOperatingDays: 364, // should be 365, but original test data was 7 days * 52 weeks
  projectId,
  temperature: 'High',
  type: 'Under Counter'
};

const wasteHauling: WasteHaulingService[] = [
  {
    id: '123',
    description: 'Waste Hauling',
    monthlyCost: 125,
    newMonthlyCost: 85,
    projectId,
    wasteStream: 'Garbage',
    serviceType: 'Bin'
  },
  {
    id: '456',
    description: 'Waste Hauling',
    monthlyCost: 85,
    newMonthlyCost: 85,
    projectId,
    wasteStream: 'Garbage',
    serviceType: 'Bin'
  }
];

const project: ProjectInventory = {
  state: 'California',
  laborCosts: [],
  singleUseItems: [],
  otherExpenses,
  reusableItems,
  dishwashers: [dishwasher],
  utilityRates: {
    gas: 0.922,
    electric: 0.1032,
    water: 6.98
  },
  wasteHauling
};

export async function getProjectInventory(): Promise<ProjectInventory> {
  const products = await getSingleUseProducts();
  const singleUseItemsPopulated: ProjectInventory['singleUseItems'] = singleUseItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      throw new Error('Could not find product for productId: ' + item.productId);
    }
    return { ...item, product, createdAt: new Date(), totalCost: 0, totalUnits: 0, ProjectInventory: 0, records: [] };
  });
  return { ...project, singleUseItems: singleUseItemsPopulated };
}
