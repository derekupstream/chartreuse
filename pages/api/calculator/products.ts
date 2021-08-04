import { BoxMaterial } from "./config/materials";
import { SingleUseCategory, ReusableCategory } from "./config/categories";

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

export interface ReusableItem {
  id: string;
  caseCount: number; // units per case
  caseCost: number;
  category: ReusableCategory;
  title: string;
}
