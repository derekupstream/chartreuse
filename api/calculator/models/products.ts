import {
  BoxMaterial,
  SingleUseCategory,
  ReusableCategory,
} from "../constants/products";

export interface SingleUseItem {
  id: string;
  boxMaterial: BoxMaterial;
  boxWeightPounds: number; // pounds
  caseCount: number; // units per case
  category: SingleUseCategory;
  grossCaseWeightPounds: number; // pounds
  description?: string;
  material: string;
  title: string;
  size: string;
}

// case count and cost are used to determine one-time costs
export interface ReusableItem {
  id: string;
  caseCount: number; // units per case
  caseCost: number;
  category: ReusableCategory;
  title: string;
}
