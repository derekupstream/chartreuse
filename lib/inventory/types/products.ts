export interface SingleUseProduct {
  id: string;
  //boxMaterial: Material; it is always corrugated cardboard, and wasnt used in the spreadsheet
  boxWeight: number; // pounds
  boxWeightPerItem: number; // pounds
  description: string;
  itemWeight: number; // pounds
  primaryMaterial: number;
  primaryMaterialWeightPerUnit: number; // pounds
  secondaryMaterial?: number;
  secondaryMaterialWeightPerUnit: number; // pounds
  //unitsPerCase: number; // eg 'case count'
  category: string;
  type: number;
  size: string;
  reusableItemCountPerRack?: number;
}

export type ReusableProduct = Omit<SingleUseProduct, 'boxWeightPerItem'>;

export type FoodwareSelection = {
  id: string;
  createdAt: Date;
  projectId: string;
  reusableItemCount: number;
  reusableReturnPercentage: number;
  singleUseProduct: SingleUseProduct;
  reusableProduct: ReusableProduct;
};
