export const SINGLE_USE_CATEGORIES = [
  { id: 0, name: "Beverage Cups & Lids" },
  { id: 1, name: "Takeout Containers & Lids" },
  { id: 2, name: "Condiment Packets" },
  { id: 3, name: "Plates and Bowls (Dinnerware)" },
  { id: 4, name: "Food Cups & Lids" },
  { id: 5, name: "Food Trays" },
  { id: 6, name: "Food Wraps" },
  { id: 7, name: "Napkins" },
  { id: 8, name: "Beverage Accessories" },
  { id: 9, name: "Straws and Stirrers" },
  { id: 10, name: "Utensils" },
  { id: 11, name: "Tooth Picks" },
] as const;

export type SingleUseCategory = typeof SINGLE_USE_CATEGORIES[number]["id"];

export const REUSABLE_CATEGORIES = [
  { id: 0, name: "Dinnerware" },
  { id: 1, name: "Beverageware" },
  { id: 2, name: "Flatware" },
  { id: 3, name: "Dinnerware Accessories" },
  { id: 4, name: "Displayware" },
  { id: 5, name: "Family Style Tableware" },
  { id: 6, name: "Table Service Accessories" },
  { id: 7, name: "Oven to Table Dinnerware" },
  { id: 8, name: "Other" },
] as const;

export type ReusableCategory = typeof REUSABLE_CATEGORIES[number]["id"];

export const WARM_MATERIALS = [
  { name: "LDPE" },
  { name: "PET" },
  { name: "PP" },
  { name: "GPPS" },
  { name: "PLA" },
  { name: "Corrugated Containers" },
  { name: "Office Paper (100% PCR)" },
  { name: "Office Paper (100% Virgin)" },
  { name: "Wood (Dimensional Lumber)" },
  { name: "Aluminum Ingot" },
] as const;

export type WarmMaterialType = typeof WARM_MATERIALS[number]["name"];

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

interface BoxMaterialOption {
  name: BoxMaterial;
  proxy: WarmMaterialType;
  mtco2ePerLb: number;
}

export const BOX_MATERIALS: BoxMaterialOption[] = [
  {
    name: "Paper",
    proxy: "Office Paper (100% Virgin)",
    mtco2ePerLb: -0.004594117,
  },
  {
    name: "Corrugated Cardboard",
    proxy: "Corrugated Containers",
    mtco2ePerLb: -0.0014315,
  },
  {
    name: "Molded Fiber (Paper)",
    proxy: "Office Paper (100% PCR)",
    mtco2ePerLb: -0.004380952,
  },
  {
    name: "Molded Fiber (Plant)",
    proxy: "Office Paper (100% Virgin)",
    mtco2ePerLb: -0.004594117,
  },
  {
    name: "Wood",
    proxy: "Wood (Dimensional Lumber)",
    mtco2ePerLb: -0.000506648,
  },
  { name: "Plastic (#1 PET)", proxy: "PET", mtco2ePerLb: -0.001110657 },
  { name: "Plastic (#5 PP)", proxy: "PP", mtco2ePerLb: -0.000784938 },
  { name: "Plastic (#6 PS)", proxy: "GPPS", mtco2ePerLb: -0.001259256 },
  { name: "Plastic (LDPE)", proxy: "LDPE", mtco2ePerLb: -0.000909504 },
  {
    name: "Compostable Plastic (PLA)",
    proxy: "PLA",
    mtco2ePerLb: -0.000222592,
  },
  { name: "EPS Foam", proxy: "GPPS", mtco2ePerLb: -0.001259256 },
  { name: "Aluminum", proxy: "Aluminum Ingot", mtco2ePerLb: -0.003747236 },
];

export const PRODUCT_SIZES = [];
