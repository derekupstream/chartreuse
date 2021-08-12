import { USState } from "./constants/utility-rates";
import {
  AdditionalCost,
  DishWasher,
  ReusableLineItem,
  SingleUseLineItem,
  UtilitiesAndCosts,
  WasteHaulingService,
} from "./models/projects";

/**
 *
 * Input single-use, reusable items and additional costs per project required to generate outputs
 *
 * */
export interface CalculatorInput {
  state: USState;
  additionalCosts: AdditionalCost[];
  reusableItems: ReusableLineItem[];
  singleUseItems: SingleUseLineItem[];
  dishwasher?: DishWasher;
  utilityRates: {
    gas: number;
    electric: number;
    water: number;
  };
  utilities?: UtilitiesAndCosts;
  newUtilities?: UtilitiesAndCosts;
  wasteHauling: WasteHaulingService[];
  newWasteHauling: WasteHaulingService[];
}
