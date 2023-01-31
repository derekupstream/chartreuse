import type { DishwasherType, FuelType, TemperatureType } from 'lib/calculator/constants/dishwashers';
import type { Frequency } from 'lib/calculator/constants/frequency';
import type { LaborCostCategory } from 'lib/calculator/constants/labor-categories';
import type { OtherExpenseCategory } from 'lib/calculator/constants/other-expenses';
import type { USState } from 'lib/calculator/constants/utilities';
import type { ServiceType, WasteStream } from 'lib/calculator/constants/waste-hauling';

import type { SingleUseProduct } from './products';

/**
 *
 * Data including single-use, reusable items and additional costs per project required to generate outputs
 *
 * */
export interface ProjectInventory {
  state: USState;
  laborCosts: LaborCost[];
  otherExpenses: OtherExpense[];
  reusableItems: ReusableLineItem[];
  singleUseItems: SingleUseLineItemPopulated[];
  dishwashers: DishWasher[];
  utilityRates: {
    gas: number;
    electric: number;
    water: number;
  };
  wasteHauling: WasteHaulingService[];
}

export interface Project {
  id: string;
  state: USState;
  useDishwasherUtilities: boolean; // capture if they want to calculate utilities instead of putting in themselves
  gasRate: number;
  electricRate: number;
  waterRate: number;
}

// single-use products are recurring
export interface SingleUseLineItem {
  id: string;
  categoryName: string;
  caseCost: number;
  casesPurchased: number;
  projectId: string;
  frequency: Frequency;
  productId: SingleUseProduct['id'];
  // these could be in another DB, but at the moment we just need a single new set of values
  newCaseCost: number;
  newCasesPurchased: number;
  unitsPerCase: number;
}

export interface SingleUseLineItemRecord {
  entryDate: string;
  caseCost: number;
  casesPurchased: number;
  totalCost: number;
  totalUnits: number;
  unitsPerCase: number;
}

export interface SingleUseLineItemPopulated extends SingleUseLineItem {
  createdAt: Date;
  totalCost: number;
  totalUnits: number;
  product: SingleUseProduct;
  records: SingleUseLineItemRecord[];
}

// recurring products are purchased once except for lost or broken items that need repurchase
export interface ReusableLineItem {
  id?: string | null;
  categoryId: string;
  annualRepurchasePercentage: number;
  caseCost: number;
  casesPurchased: number;
  projectId: string;
  productName: string;
  unitsPerCase: number;
}

export interface OtherExpense {
  projectId: string;
  categoryId: OtherExpenseCategory;
  cost: number;
  frequency: Frequency | 'One Time';
}

export interface LaborCost {
  projectId: string;
  categoryId: LaborCostCategory;
  cost: number;
  frequency: Frequency | 'One Time';
}

export interface DishWasherStatic {
  temperature: TemperatureType;
  type: DishwasherType;
  energyStarCertified: boolean;
  boosterWaterHeaterFuelType: FuelType; // a booster is included for high temp models
  buildingWaterHeaterFuelType: FuelType;
}

export interface DishWasherOptions {
  racksPerDay: number;
  operatingDays: number;
}

export interface DishWasher extends DishWasherStatic {
  projectId: string;
  racksPerDay: number; // reusables need additional racks
  newRacksPerDay: number; // reusables need additional racks
  operatingDays: number;
  newOperatingDays: number;
}

// monthly utilities and costs
export interface UtilitiesAndCosts {
  gasCost: number;
  gasUsage: number;
  electricCost: number;
  electricUsage: number;
  projectId: string;
  waterCost: number;
  waterUsage: number;
}

export interface WasteHaulingService {
  id: string;
  monthlyCost: number; // used for calculating financial results
  newMonthlyCost: number;
  wasteStream: WasteStream;
  serviceType: ServiceType;
  description: string;
  projectId: string;
}
