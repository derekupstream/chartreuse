import { ProjectInput, WasteHaulingService } from './types/projects'
import prisma from 'lib/prisma'
import { getUtilitiesByState, USState } from './constants/utilities'
import { OtherExpenseCategory } from './constants/other-expenses'
import { Frequency } from './constants/frequency'
import { getProducts } from './datasets/single-use-products'
import { LaborCost, OtherExpense, SingleUseLineItem, WasteHaulingCost } from '@prisma/client'
import { SingleUseProduct } from './types/products'
import { LaborCostCategory } from './constants/labor-categories'

export async function getProjectData(projectId: string): Promise<ProjectInput> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
    },
    include: {
      account: true,
      otherExpenses: true,
      laborCosts: true,
      singleUseItems: true,
      reusableItems: true,
      dishwasher: true,
      wasteHaulingCosts: true,
    },
  })
  if (!project) {
    throw new Error('Project not found. Project Id: ' + projectId)
  }

  // get utility rates
  const state = project.account.USState as USState
  const utilityRates = getUtilitiesByState(state)

  // map db model types to frontend types
  const products = await getProducts()
  const laborCosts = project.laborCosts.map(mapLaborCost)
  const otherExpenses = project.otherExpenses.map(mapAdditionalCost)
  const singleUseItems = project.singleUseItems.map(item => mapSingleUseItem(item, products))
  const wasteHauling = project.wasteHaulingCosts.map(mapWasteHauling)

  return {
    laborCosts,
    otherExpenses,
    reusableItems: project.reusableItems,
    singleUseItems,
    state,
    utilityRates,
    wasteHauling,
  }
}

function mapLaborCost(expense: LaborCost): ProjectInput['laborCosts'][number] {
  return {
    ...expense,
    categoryId: expense.categoryId as LaborCostCategory,
    frequency: expense.frequency as Frequency,
  }
}

function mapAdditionalCost(expense: OtherExpense): ProjectInput['otherExpenses'][number] {
  return {
    ...expense,
    categoryId: expense.categoryId as OtherExpenseCategory,
    frequency: expense.frequency as Frequency,
  }
}

function mapSingleUseItem(singleUseItem: SingleUseLineItem, products: SingleUseProduct[]): ProjectInput['singleUseItems'][number] {
  const product = products.find(product => product.id === singleUseItem.productId)
  if (!product) {
    throw new Error('Product not found. Product Id: ' + singleUseItem.productId)
  }
  return {
    ...singleUseItem,
    frequency: singleUseItem.frequency as Frequency,
    product,
  }
}

function mapWasteHauling(wasteHaulingCost: WasteHaulingCost): ProjectInput['wasteHauling'][number] {
  return {
    ...wasteHaulingCost,
    serviceType: wasteHaulingCost.serviceType as WasteHaulingService['serviceType'],
    wasteStream: wasteHaulingCost.wasteStream as WasteHaulingService['wasteStream'],
  }
}
