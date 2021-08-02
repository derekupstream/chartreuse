
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
  { name: "Aluminum Ingot" }
] as const;

export type WarmMaterialType = typeof WARM_MATERIALS[number]['name'];

export type ProductMaterial = "Paper" | "Corrugated Cardboard" | "Molded Fiber (Paper)" | "Molded Fiber (Plant)" | "Wood" | "Plastic (#1 PET)" | "Plastic (#5 PP)" | "Plastic (#6 PS)" | "Plastic (LDPE)" | "Compostable Plastic (PLA)" | "EPS Foam" | "Aluminum";

interface ProductMaterialOption {
  name: ProductMaterial;
  proxy: WarmMaterialType;
  mtco2ePerLb: number
}

export const PRODUCT_MATERIALS: ProductMaterialOption[] = [
  { name: "Paper", proxy: "Office Paper (100% Virgin)", mtco2ePerLb: -0.004594117 },
  { name: "Corrugated Cardboard", proxy: "Corrugated Containers", mtco2ePerLb: -0.0014315 },
  { name: "Molded Fiber (Paper)", proxy: "Office Paper (100% PCR)", mtco2ePerLb: -0.004380952 },
  { name: "Molded Fiber (Plant)", proxy: "Office Paper (100% Virgin)", mtco2ePerLb: -0.004594117 },
  { name: "Wood", proxy: "Wood (Dimensional Lumber)", mtco2ePerLb: -0.000506648 },
  { name: "Plastic (#1 PET)", proxy: "PET", mtco2ePerLb: -0.001110657 },
  { name: "Plastic (#5 PP)", proxy: "PP", mtco2ePerLb: -0.000784938 },
  { name: "Plastic (#6 PS)", proxy: "GPPS", mtco2ePerLb: -0.001259256 },
  { name: "Plastic (LDPE)", proxy: "LDPE", mtco2ePerLb: -0.000909504 },
  { name: "Compostable Plastic (PLA)", proxy: "PLA", mtco2ePerLb: -0.000222592 },
  { name: "EPS Foam", proxy: "GPPS", mtco2ePerLb: -0.001259256 },
  { name: "Aluminum", proxy: "Aluminum Ingot", mtco2ePerLb: -0.003747236 }
];

export const PRODUCT_SIZES = [

];