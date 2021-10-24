import { USState } from "../constants/utilities";
import { AdditionalCostType } from "../constants/additional-costs";
import { Frequency } from "../constants/frequency";
import {
  DishwasherType,
  FuelType,
  TemperatureType,
} from "../constants/dishwashers";
import { SingleUseProduct } from "./products";

/**
 *
 * Data including single-use, reusable items and additional costs per project required to generate outputs
 *
 * */
export interface ProjectInput {
  state: USState;
  additionalCosts: AdditionalCost[];
  reusableItems: ReusableLineItem[];
  singleUseItems: SingleUseLineItemPopulated[];
  dishwasher?: DishWasher;
  utilityRates: {
    gas: number;
    electric: number;
    water: number;
  };
  wasteHauling: WasteHaulingService[];
  newWasteHauling: WasteHaulingService[];
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

export interface SingleUseLineItemPopulated extends SingleUseLineItem {
  product: SingleUseProduct;
}

// recurring products are purchased once except for lost or broken items that need repurchase
export interface ReusableLineItem {
  annualRepurchasePercentage: number;
  caseCost: number;
  casesPurchased: number;
  projectId: string;
  //productId: string;
}

export interface AdditionalCost {
  projectId: string;
  category: AdditionalCostType;
  cost: number;
  frequency: Frequency | "One Time";
}

export interface DishWasher {
  additionalRacksPerDay: number; // reusables need additional racks
  boosterWaterHeaterFuelType: FuelType; // a booster is included for high temp models
  buildingWaterHeaterFuelType: FuelType;
  energyStarCertified: boolean;
  operatingDays: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  projectId: string;
  temperature: TemperatureType;
  type: DishwasherType;
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

type WasteStream = "Garbage" | "Recycling" | "Organics" | "Additional Charges";
type ServiceType = "Bin" | "Cart" | "Roll Off Bin" | "Additional Charges";

export interface WasteHaulingService {
  collectionTimesPerWeek: number;
  monthlyCost: number; // used for calculating financial results
  size: number;
  unitCount: number;
  wasteStream: WasteStream;
  serviceType: ServiceType;
  projectId: string;
}
