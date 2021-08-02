import { USState } from "./utility-rates";
import { AdditionalCostType } from "./additional-costs";
import { DishwasherType, FuelType, TemperatureType } from "./dishwasher";

export const FREQUENCIES = [
  { name: "Daily", annualOccurence: 365 },
  { name: "Weekly", annualOccurence: 52 },
  { name: "Monthly", annualOccurence: 12 },
  { name: "Annually", annualOccurence: 1 }
];

type Frequency = typeof FREQUENCIES[number]["name"];

export interface Project {
  state: USState;
}

export interface SingleUseLineItem {
  caseCost: number;
  casesPurchased: number;
  productId: string;
  frequency: Frequency;
};

export interface ReusableLineItem {
  casesPurchased: number;
  reusableProductId: string;
  singleUseProductId: string;
  annualRepurchasePercentage: number; // how much do they replace for lost, broken, etc.
};

export interface AdditionalCost {
  type: AdditionalCostType;
}

export interface DishWasher {
  type: DishwasherType;
  boosterWaterHeater: boolean;
  boosterWaterHeaterFuelType: FuelType;
  buildingWaterHeaterFuelType: FuelType;
  energyStarCertified: boolean;
  operatingDays: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  additionalRacksPerDay: number; // reusables need additional racks
  temperature: TemperatureType;
}