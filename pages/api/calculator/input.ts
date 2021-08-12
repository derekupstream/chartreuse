import { USState, UTILITY_RATE_SELECTION } from "./constants/utilities";
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

// TODO: retrieve project data from database
export async function getCalculatorInput(
  projectId: string
): Promise<CalculatorInput> {
  return {
    additionalCosts: [],
    reusableItems: [],
    singleUseItems: [],
    state: "California",
    utilityRates: {
      gas: UTILITY_RATE_SELECTION.gas,
      electric: UTILITY_RATE_SELECTION.electric,
      water: UTILITY_RATE_SELECTION.water,
    },
    wasteHauling: [],
    newWasteHauling: [],
  };
}
