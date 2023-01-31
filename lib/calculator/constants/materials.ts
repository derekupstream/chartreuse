/**
 * Values taken from sheet "Hidden: EPA WARM Model Assumptions"
 *
 * */

// data provided by the EPA WARM Model
export const CORRUGATED_CARDBOARD = 0.0014315;
export const CORRUGATED_CARDBOARD_NAME = 'Corrugated Cardboard';
export const WARM_MATERIALS = [
  { name: 'LDPE', mtco2ePerLb: -0.000909504 },
  { name: 'PET', mtco2ePerLb: -0.001110657 },
  { name: 'PP', mtco2ePerLb: -0.000784938 },
  { name: 'GPPS', mtco2ePerLb: -0.001259256 },
  { name: 'PLA', mtco2ePerLb: -0.000222592 },
  { name: 'Corrugated Containers', mtco2ePerLb: CORRUGATED_CARDBOARD },
  { name: 'Office Paper (100% Virgin)', mtco2ePerLb: -0.004594117 },
  { name: 'Office Paper (100% PCR)', mtco2ePerLb: -0.004380952 },
  { name: 'Wood (Dimensional Lumber)', mtco2ePerLb: -0.000506648 },
  { name: 'Aluminum Ingot', mtco2ePerLb: -0.003747236 }
] as const;

export type WARMMaterialType = (typeof WARM_MATERIALS)[number]['name'];

export type MaterialName =
  | 'Paper'
  | 'Corrugated Cardboard'
  | 'Molded Fiber (Paper)'
  | 'Molded Fiber (Plant)'
  | 'Wood'
  | 'Plastic (#1 PET)'
  | 'Plastic (#5 PP)'
  | 'Plastic (#6 PS)'
  | 'Plastic (LDPE)'
  | 'Compostable Plastic (PLA)'
  | 'EPS Foam'
  | 'Aluminum';

interface MaterialOption {
  id: number;
  name: MaterialName;
  proxy: WARMMaterialType;
  mtco2ePerLb: number;
}

// Source: HIDDEN: EPA WARM Assumptions, !$B$4:$D$15
export const MATERIALS: MaterialOption[] = (<Omit<MaterialOption, 'mtco2ePerLb'>[]>[
  {
    id: 0,
    name: 'Paper',
    proxy: 'Office Paper (100% Virgin)'
  },
  {
    id: 1,
    name: 'Corrugated Cardboard',
    proxy: 'Corrugated Containers'
  },
  {
    id: 2,
    name: 'Molded Fiber (Paper)',
    proxy: 'Office Paper (100% PCR)'
  },
  {
    id: 3,
    name: 'Molded Fiber (Plant)',
    proxy: 'Office Paper (100% Virgin)'
  },
  {
    id: 4,
    name: 'Wood',
    proxy: 'Wood (Dimensional Lumber)'
  },
  { id: 5, name: 'Plastic (#1 PET)', proxy: 'PET' },
  { id: 6, name: 'Plastic (#5 PP)', proxy: 'PP' },
  { id: 7, name: 'Plastic (#6 PS)', proxy: 'GPPS' },
  { id: 8, name: 'Plastic (LDPE)', proxy: 'LDPE' },
  {
    id: 9,
    name: 'Compostable Plastic (PLA)',
    proxy: 'PLA'
  },
  { id: 10, name: 'EPS Foam', proxy: 'GPPS' },
  { id: 11, name: 'Aluminum', proxy: 'Aluminum Ingot' }
]).map(material => ({
  ...material,
  // TODO: check we need -1
  mtco2ePerLb: WARM_MATERIALS.find(warmMaterial => warmMaterial.name === material.proxy)!.mtco2ePerLb * -1
}));
