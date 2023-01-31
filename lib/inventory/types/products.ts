export interface SingleUseProduct {
  id: string;
  //boxMaterial: Material; it is always corrugated cardboard, and wasnt used in the spreadsheet
  boxWeight: number; // pounds
  description: string;
  itemWeight: number; // pounds
  primaryMaterial: number;
  primaryMaterialWeightPerUnit: number; // pounds
  secondaryMaterial: number;
  secondaryMaterialWeightPerUnit: number; // pounds
  unitsPerCase: number; // eg 'case count'
  category: string;
  type: number;
  size: string;
}
