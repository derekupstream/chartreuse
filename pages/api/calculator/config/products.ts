import { ProductMaterial } from "./materials";
import { SingleUseCategory, ReusableCategory } from "./categories";

export interface SingleUseItem {
  id: string;
  caseCost: number;
  caseCount: number; // units per case
  category: SingleUseCategory;
  netCaseWeight: number; // pounds
  description?: string;
  material: ProductMaterial;
  title: string;
  size: string;
}

export interface ReusableItem {
  id: string;
  caseCount: number; // units per case
  caseCost: number;
  category: ReusableCategory;
  title: string;
}
