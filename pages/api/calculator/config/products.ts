import { BoxMaterial } from "./materials";
import { SingleUseCategory, ReusableCategory } from "./categories";

export interface SingleUseItem {
  id: string;
  boxMaterial: BoxMaterial;
  boxWeight: number; // pounds
  caseCount: number; // units per case
  category: SingleUseCategory;
  grossCaseWeight: number; // pounds
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
