import { USState } from "./utility-rates";

export interface Project {
  state: USState;
}

export interface SingleUseLineItem {
  productId: string;
};

export interface ReusableLineItem {
  productId: string;
};

type AdditionalCostType = 'dishwashing';

export interface AdditionalCost {
  type: AdditionalCostType;
}