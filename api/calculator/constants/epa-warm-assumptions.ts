

/**
 * Values taken from sheet "Hidden: EPA WARM Model Assumptions"
 *
 * */

import { BoxMaterial } from "../types/products";

// data provided by the EPA WARM Model
export const CORRUGATED_CARDBOARD = -0.0014315;
export const WARM_MATERIALS = [
  { name: "LDPE", mtco2ePerLb: -0.000909504 },
  { name: "PET", mtco2ePerLb: -0.001110657 },
  { name: "PP", mtco2ePerLb: -0.000784938 },
  { name: "GPPS", mtco2ePerLb: -0.001259256 },
  { name: "PLA", mtco2ePerLb: -0.000222592 },
  { name: "Corrugated Containers", mtco2ePerLb: CORRUGATED_CARDBOARD },
  { name: "Office Paper (100% Virgin)", mtco2ePerLb: -0.004594117 },
  { name: "Office Paper (100% PCR)", mtco2ePerLb: -0.004380952 },
  { name: "Wood (Dimensional Lumber)", mtco2ePerLb: -0.000506648 },
  { name: "Aluminum Ingot", mtco2ePerLb: -0.003747236 }
] as const;

export type WARMMaterialType = typeof WARM_MATERIALS[number]["name"];

interface BoxMaterialOption {
  name: BoxMaterial;
  proxy: WARMMaterialType;
  mtco2ePerLb: number;
}

// Source: HIDDEN: EPA WARM Assumptions, !$B$4:$D$15
export const BOX_MATERIALS: BoxMaterialOption[] = (<Pick<BoxMaterialOption, 'name' | 'proxy'>[]> [
  {
    name: "Paper",
    proxy: "Office Paper (100% Virgin)"
  },
  {
    name: "Corrugated Cardboard",
    proxy: "Corrugated Containers"
  },
  {
    name: "Molded Fiber (Paper)",
    proxy: "Office Paper (100% PCR)"
  },
  {
    name: "Molded Fiber (Plant)",
    proxy: "Office Paper (100% Virgin)"
  },
  {
    name: "Wood",
    proxy: "Wood (Dimensional Lumber)"
  },
  { name: "Plastic (#1 PET)", proxy: "PET" },
  { name: "Plastic (#5 PP)", proxy: "PP" },
  { name: "Plastic (#6 PS)", proxy: "GPPS" },
  { name: "Plastic (LDPE)", proxy: "LDPE" },
  {
    name: "Compostable Plastic (PLA)",
    proxy: "PLA"
  },
  { name: "EPS Foam", proxy: "GPPS" },
  { name: "Aluminum", proxy: "Aluminum Ingot" },
]).map(material => ({
  ...material,
  mtco2ePerLb: WARM_MATERIALS.find(warmMaterial => warmMaterial.name === material.proxy)!.mtco2ePerLb
}));
