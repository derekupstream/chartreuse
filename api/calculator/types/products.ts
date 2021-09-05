import { MaterialName } from '../constants/materials';

export interface SingleUseProduct {
  id: number;
  //boxMaterial: Material; it is always corrugated cardboard, and wasnt used in the spreadsheet
  boxWeight: number; // pounds
  itemWeight: number; // pounds
  primaryMaterial: MaterialName;
  primaryMaterialWeightPerUnit: number; // pounds
  secondaryMaterial: MaterialName;
  secondaryMaterialWeightPerUnit: number; // pounds
  unitsPerCase: number; // eg 'case count'
  category: number;
  type: number;
  // grossCaseWeightPounds: number; // pounds
  // description?: string;
  // title: string;
  // size: string;
}

// case count and cost are used to determine one-time costs
export interface ReusableProduct {
  id: string;
  caseCount: number; // units per case
  caseCost: number;
  title: string;
}
