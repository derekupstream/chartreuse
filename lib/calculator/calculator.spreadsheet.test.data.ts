import getSingleUseItems from '../../inventory/assets/upstream/getSingleUseItems'
import { ProjectInput } from './types/projects'
import { OtherExpense, DishWasher, ReusableLineItem, SingleUseLineItem, WasteHaulingService } from './types/projects'

const projectId = 'aaa'

export const singleUseItems: SingleUseLineItem[] = [
  {
    id: 'aaa',
    caseCost: 80,
    casesPurchased: 10,
    productId: '17',
    projectId,
    frequency: 'Weekly',
    newCaseCost: 80,
    newCasesPurchased: 0,
    unitsPerCase: 200,
  },
  {
    id: 'aaa',
    caseCost: 30,
    casesPurchased: 15,
    productId: '7',
    projectId,
    frequency: 'Weekly',
    newCaseCost: 30,
    newCasesPurchased: 5,
    unitsPerCase: 1000,
  },
  {
    id: 'aaa',
    caseCost: 20,
    casesPurchased: 20,
    productId: '3',
    projectId,
    frequency: 'Weekly',
    newCaseCost: 20,
    newCasesPurchased: 10,
    unitsPerCase: 1000,
  },
  {
    id: 'aaa',
    caseCost: 50,
    casesPurchased: 0,
    productId: '16',
    projectId,
    frequency: 'Weekly',
    newCaseCost: 50,
    newCasesPurchased: 2,
    unitsPerCase: 210,
  },
  {
    id: 'aaa',
    caseCost: 10,
    casesPurchased: 0,
    productId: '93',
    projectId,
    frequency: 'Weekly',
    newCaseCost: 10,
    newCasesPurchased: 5,
    unitsPerCase: 2500,
  },
]

const reusableItems: ReusableLineItem[] = [{ categoryId: '1', projectId, productName: 'Cup', caseCost: 23, casesPurchased: 2, annualRepurchasePercentage: 0.23 }]

const otherExpenses: OtherExpense[] = [
  { projectId, cost: 80, frequency: 'Daily', categoryId: '3' },
  { projectId, cost: 5000, frequency: 'One Time', categoryId: '2' },
  { projectId, cost: 5000, frequency: 'One Time', categoryId: '3' },
]

const dishwasher: DishWasher = {
  racksPerDay: 0,
  newRacksPerDay: 80,
  boosterWaterHeaterFuelType: 'Electric',
  buildingWaterHeaterFuelType: 'Electric',
  energyStarCertified: true,
  operatingDays: 0,
  newOperatingDays: 364, // original math was 7 days * 52 weeks
  projectId,
  temperature: 'High',
  type: 'Under Counter',
}

const wasteHauling: WasteHaulingService[] = [
  {
    id: '123',
    description: 'Waste Hauling',
    monthlyCost: 125,
    newMonthlyCost: 85,
    projectId,
    wasteStream: 'Garbage',
    serviceType: 'Bin',
  },
  {
    id: '456',
    description: 'Waste Hauling',
    monthlyCost: 85,
    newMonthlyCost: 85,
    projectId,
    wasteStream: 'Garbage',
    serviceType: 'Bin',
  },
]

const project: ProjectInput = {
  state: 'California',
  laborCosts: [],
  singleUseItems: [],
  otherExpenses,
  reusableItems,
  dishwashers: [dishwasher],
  utilityRates: {
    gas: 0.922,
    electric: 0.1032,
    water: 6.98,
  },
  wasteHauling,
}

export async function getProjectInput(): Promise<ProjectInput> {
  const products = await getSingleUseItems()
  const singleUseItemsPopulated = singleUseItems.map(item => {
    const product = products.find(p => p.id === item.productId)
    if (!product) {
      throw new Error('Could not find product for productId: ' + item.productId)
    }
    return { ...item, product }
  })
  return { ...project, singleUseItems: singleUseItemsPopulated }
}
