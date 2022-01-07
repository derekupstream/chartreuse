import { USState } from '../constants/utilities'
import { OtherExpenseCategory } from '../constants/other-expenses'
import { Frequency } from '../constants/frequency'
import { DishwasherType, FuelType, TemperatureType } from '../constants/dishwashers'
import { SingleUseProduct } from './products'
import { LaborCostCategory } from '../constants/labor-categories'
import { ServiceType, WasteStream } from '../constants/waste-hauling'

/**
 *
 * Data including single-use, reusable items and additional costs per project required to generate outputs
 *
 * */
export interface ProjectInput {
  state: USState
  laborCosts: LaborCost[]
  otherExpenses: OtherExpense[]
  reusableItems: ReusableLineItem[]
  singleUseItems: SingleUseLineItemPopulated[]
  dishwasher?: DishWasher
  utilityRates: {
    gas: number
    electric: number
    water: number
  }
  wasteHauling: WasteHaulingService[]
}

export interface Project {
  id: string
  state: USState
  useDishwasherUtilities: boolean // capture if they want to calculate utilities instead of putting in themselves
  gasRate: number
  electricRate: number
  waterRate: number
}

// single-use products are recurring
export interface SingleUseLineItem {
  id: string
  caseCost: number
  casesPurchased: number
  projectId: string
  frequency: Frequency
  productId: SingleUseProduct['id']
  // these could be in another DB, but at the moment we just need a single new set of values
  newCaseCost: number
  newCasesPurchased: number
  unitsPerCase: number
}

export interface SingleUseLineItemPopulated extends SingleUseLineItem {
  product: SingleUseProduct
}

// recurring products are purchased once except for lost or broken items that need repurchase
export interface ReusableLineItem {
  id?: string
  categoryId: string
  annualRepurchasePercentage: number
  caseCost: number
  casesPurchased: number
  projectId: string
  productName: string
}

export interface OtherExpense {
  projectId: string
  categoryId: OtherExpenseCategory
  cost: number
  frequency: Frequency | 'One Time'
}

export interface LaborCost {
  projectId: string
  categoryId: LaborCostCategory
  cost: number
  frequency: Frequency | 'One Time'
}

export interface DishWasher {
  additionalRacksPerDay: number // reusables need additional racks
  boosterWaterHeaterFuelType: FuelType // a booster is included for high temp models
  buildingWaterHeaterFuelType: FuelType
  energyStarCertified: boolean
  operatingDays: 1 | 2 | 3 | 4 | 5 | 6 | 7
  projectId: string
  temperature: TemperatureType
  type: DishwasherType
}

// monthly utilities and costs
export interface UtilitiesAndCosts {
  gasCost: number
  gasUsage: number
  electricCost: number
  electricUsage: number
  projectId: string
  waterCost: number
  waterUsage: number
}

export interface WasteHaulingService {
  monthlyCost: number // used for calculating financial results
  newMonthlyCost: number
  wasteStream: WasteStream
  serviceType: ServiceType
  description: string
  projectId: string
}
