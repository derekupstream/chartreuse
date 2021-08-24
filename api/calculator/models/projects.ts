import { USState } from "../constants/utilities";
import { AdditionalCostType } from "../constants/additional-costs";
import { Frequency } from "../constants/frequency";
import {
  DishwasherType,
  FuelType,
  TemperatureType,
} from "../constants/dishwashers";

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
  caseCount: number;
  projectId: string;
  frequency: Frequency;
  singleUseProductId: string;
  // these could be in another DB, but at the moment we just need one new set of values
  newCaseCost: number;
  newCaseCount: number;
}

// recurring products are purchased once except for lost or broken items that need repurchase
export interface ReusableLineItem {
  annualRepurchasePercentage: number;
  caseCost: number;
  caseCount: number;
  projectId: string;
  reusableProductId: string;
  // singleUseProductId: string; not sure we need to link these
}

export interface AdditionalCost {
  projectId: string;
  cost: number;
  frequency: Frequency | "One Time";
  type: AdditionalCostType;
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
