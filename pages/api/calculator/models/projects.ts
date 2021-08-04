import { USState } from "../config/utility-rates";
import { AdditionalCostType } from "../config/additional-costs";
import { Frequency } from "../config/frequency";
import {
  DishwasherType,
  FuelType,
  TemperatureType,
} from "../config/dishwashers";
import { SingleUseItem } from "./products";

export interface ProjectCalculatorInput {
  state: USState;
  additionalCosts: AdditionalCost[];
  reusableItems: SingleUseItem[];
  singleUseItems: SingleUseItem[];
}

export interface Project {
  state: USState;
}

// single-use products are recurring
export interface SingleUseLineItem {
  caseCost: number;
  casesPurchased: number;
  projectId: string;
  frequency: Frequency;
  singleUseProductId: string;
}

// recurring products are purchased once except for lost or broken items that need repurchase
export interface ReusableLineItem {
  annualRepurchasePercentage: number;
  casesPurchased: number;
  projectId: string;
  reusableProductId: string;
  singleUseProductId: string;
}

export interface AdditionalCost {
  projectId: string;
  recurringAnnually: boolean;
  type: AdditionalCostType;
}

export interface DishWasher {
  additionalRacksPerDay: number; // reusables need additional racks
  boosterWaterHeater: boolean;
  boosterWaterHeaterFuelType: FuelType;
  buildingWaterHeaterFuelType: FuelType;
  energyStarCertified: boolean;
  operatingDays: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  projectId: string;
  temperature: TemperatureType;
  type: DishwasherType;
}
