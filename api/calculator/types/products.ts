export interface SingleUseProduct {
  id: string
  //boxMaterial: Material; it is always corrugated cardboard, and wasnt used in the spreadsheet
  boxWeight: number // pounds
  itemWeight: number // pounds
  primaryMaterial: number
  primaryMaterialWeightPerUnit: number // pounds
  secondaryMaterial: number
  secondaryMaterialWeightPerUnit: number // pounds
  unitsPerCase: number // eg 'case count'
  category: number
  type: number
  size: string
  // grossCaseWeightPounds: number; // pounds
  // description?: string;
  title: string
}
