import { getProducts } from './datasets/single-use-products'
import { ProjectInput } from './types/projects'
import { AdditionalCost, DishWasher, ReusableLineItem, SingleUseLineItem, WasteHaulingService } from './types/projects'

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

const additionalCosts: AdditionalCost[] = [
  { projectId, cost: 80, frequency: 'Daily', categoryId: '3' },
  { projectId, cost: 5000, frequency: 'One Time', categoryId: '2' },
  { projectId, cost: 5000, frequency: 'One Time', categoryId: '6' },
]

const dishwasher: DishWasher = {
  additionalRacksPerDay: 80,
  boosterWaterHeaterFuelType: 'Electric',
  buildingWaterHeaterFuelType: 'Electric',
  energyStarCertified: true,
  operatingDays: 7,
  projectId,
  temperature: 'High',
  type: 'Under Counter',
}

const wasteHauling: WasteHaulingService[] = [
  {
    monthlyCost: 125,
    projectId,
    wasteStream: 'Garbage',
    serviceType: 'Bin'
  },
  {
    monthlyCost: 85,
    projectId,
    wasteStream: 'Garbage',
    serviceType: 'Bin'
  },
]

const newWasteHauling: WasteHaulingService[] = [
  {
    monthlyCost: 85,
    projectId,
    wasteStream: 'Garbage',
    serviceType: 'Bin'
  },
  {
    monthlyCost: 85,
    projectId,
    wasteStream: 'Garbage',
    serviceType: 'Bin'
  },
]

const project: ProjectInput = {
  state: 'California',
  singleUseItems: [],
  additionalCosts,
  reusableItems,
  dishwasher,
  utilityRates: {
    gas: 0.922,
    electric: 0.1032,
    water: 6.98,
  },
  wasteHauling,
  newWasteHauling,
}

export async function getProjectInput(): Promise<ProjectInput> {
  const products = await getProducts()
  const singleUseItemsPopulated = singleUseItems.map(item => {
    const product = products.find(p => p.id === item.productId)
    if (!product) {
      throw new Error('Could not find product for productId: ' + item.productId)
    }
    return { ...item, product }
  })
  return { ...project, singleUseItems: singleUseItemsPopulated }
}
