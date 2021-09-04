
export type BoxMaterial =
  | "Paper"
  | "Corrugated Cardboard"
  | "Molded Fiber (Paper)"
  | "Molded Fiber (Plant)"
  | "Wood"
  | "Plastic (#1 PET)"
  | "Plastic (#5 PP)"
  | "Plastic (#6 PS)"
  | "Plastic (LDPE)"
  | "Compostable Plastic (PLA)"
  | "EPS Foam"
  | "Aluminum";

export interface SingleUseProduct {
  id: number;
  //boxMaterial: BoxMaterial;
  boxWeight: number; // pounds
  itemWeight: number; // pounds
  primaryMaterial: BoxMaterial;
  primaryMaterialWeightPerUnit: number; // pounds
  secondaryMaterial: BoxMaterial;
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
