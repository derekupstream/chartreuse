import {
  BoxMaterial,
  SingleUseCategory,
  ReusableCategory,
} from "../constants/products";

export interface SingleUseItem {
  id: number;
  //boxMaterial: BoxMaterial;
  boxWeight: number; // pounds
  itemWeight: number; // pounds
  primaryMaterial: BoxMaterial;
  primaryMaterialWeightPerUnit: number; // pounds
  secondaryMaterial: BoxMaterial;
  secondaryMaterialWeightPerUnit: number; // pounds
  unitsPerCase: number; // eg 'case count'
  // category: SingleUseCategory;
  // grossCaseWeightPounds: number; // pounds
  // description?: string;
  // material: string;
  // title: string;
  // size: string;
}

// case count and cost are used to determine one-time costs
export interface ReusableItem {
  id: string;
  caseCount: number; // units per case
  caseCost: number;
  category: ReusableCategory;
  title: string;
}
