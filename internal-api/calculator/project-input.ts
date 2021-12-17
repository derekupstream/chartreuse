import { ProjectInput, WasteHaulingService } from './types/projects'
import prisma from 'lib/prisma'
import { getUtilitiesByState } from './constants/utilities'
import { AdditionalCostType } from './constants/additional-costs'
import { Frequency } from './constants/frequency'
import { getProducts } from './datasets/single-use-products'
import { AdditionalCost, SingleUseLineItem, WasteHaulingCost } from '@prisma/client'
import { SingleUseProduct } from './types/products'

export async function getProjectData(projectId: string): Promise<ProjectInput> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
    },
    include: {
      additionalCosts: true,
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
  const USState = 'California' // TODO: request state from user
  const utilityRates = getUtilitiesByState(USState)

  // map db model types to frontend types
  const products = await getProducts()
  const additionalCosts = project.additionalCosts.map(mapAdditionalCosts)
  const singleUseItems = project.singleUseItems.map(item => mapSingleUseItems(item, products))
  const wasteHauling = project.wasteHaulingCosts.map(mapWasteHauling)

  return {
    additionalCosts,
    reusableItems: project.reusableItems,
    singleUseItems,
    state: USState,
    utilityRates,
    wasteHauling,
  }
}

function mapAdditionalCosts(additionalCost: AdditionalCost): ProjectInput['additionalCosts'][number] {
  return {
    ...additionalCost,
    categoryId: additionalCost.categoryId as AdditionalCostType,
    frequency: additionalCost.frequency as Frequency,
  }
}

function mapSingleUseItems(singleUseItem: SingleUseLineItem, products: SingleUseProduct[]): ProjectInput['singleUseItems'][number] {
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
