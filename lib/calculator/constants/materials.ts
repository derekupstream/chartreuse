/**
 * Values taken from sheet "Hidden: EPA WARM Model Assumptions"
 * provided by the EPA WARM Model
 */
export const CORRUGATED_CARDBOARD_GAS = 0.0014315;
export const CORRUGATED_CARDBOARD_NAME = 'Corrugated Cardboard';

// MTCO2e/lb by WARM Material
const GAS_USAGE = {
  LDPE: 0.000909504,
  PET: 0.001110657,
  PP: 0.000784938,
  GPPS: 0.001259256,
  PLA: 0.000222592,
  'Corrugated Containers': CORRUGATED_CARDBOARD_GAS,
  'Office Paper (100% Virgin)': 0.004594117,
  'Office Paper (100% PCR)': 0.004380952,
  'Wood (Dimensional Lumber)': 0.000506648,
  'Aluminum Ingot': 0.003747236
};

type MaterialName =
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

type MaterialOption = {
  id: number;
  name: MaterialName;
  mtco2ePerLb: number;
  waterUsageGalPerLb: number | undefined; // annual usage per lb
};

// Source: HIDDEN: EPA WARM Assumptions, !$B$4:$D$15
export const MATERIALS: MaterialOption[] = [
  {
    id: 0,
    name: 'Paper',
    mtco2ePerLb: GAS_USAGE['Office Paper (100% Virgin)'],
    waterUsageGalPerLb: 0.5978
  },
  {
    id: 1,
    name: CORRUGATED_CARDBOARD_NAME,
    mtco2ePerLb: GAS_USAGE['Corrugated Containers'],
    waterUsageGalPerLb: 3.03798
  },
  {
    id: 2,
    name: 'Molded Fiber (Paper)',
    mtco2ePerLb: GAS_USAGE['Office Paper (100% PCR)'],
    waterUsageGalPerLb: 1.6527
  },
  {
    id: 3,
    name: 'Molded Fiber (Plant)',
    mtco2ePerLb: GAS_USAGE['Office Paper (100% Virgin)'],
    waterUsageGalPerLb: 1.6527
  },
  {
    id: 4,
    name: 'Wood',
    mtco2ePerLb: GAS_USAGE['Wood (Dimensional Lumber)'],
    waterUsageGalPerLb: 1.9367
  },
  {
    id: 5,
    name: 'Plastic (#1 PET)',
    mtco2ePerLb: GAS_USAGE['PET'],
    waterUsageGalPerLb: 8.1325
  },
  {
    id: 6,
    name: 'Plastic (#5 PP)',
    mtco2ePerLb: GAS_USAGE['PP'],
    waterUsageGalPerLb: 3.8735
  },
  {
    id: 7,
    name: 'Plastic (#6 PS)',
    mtco2ePerLb: GAS_USAGE['GPPS'],
    waterUsageGalPerLb: 8.724
  },
  {
    id: 8,
    name: 'Plastic (LDPE)',
    mtco2ePerLb: GAS_USAGE['LDPE'],
    waterUsageGalPerLb: 14.3271
  },
  {
    id: 9,
    name: 'Compostable Plastic (PLA)',
    mtco2ePerLb: GAS_USAGE['PLA'],
    waterUsageGalPerLb: 20.0946
  },
  {
    id: 10,
    name: 'EPS Foam',
    mtco2ePerLb: GAS_USAGE['GPPS'],
    waterUsageGalPerLb: 15.4898
  },
  {
    id: 11,
    name: 'Aluminum',
    mtco2ePerLb: GAS_USAGE['Aluminum Ingot'],
    waterUsageGalPerLb: 9.4724
  }
];

const LB_TO_MTCO2 = 0.000453592;

export const REUSABLE_MATERIALS = [
  { id: 100, name: 'Glass', mtco2ePerLb: 1.14 * LB_TO_MTCO2, waterUsageGalPerLb: 2.317 },
  { id: 101, name: 'Ceramic', mtco2ePerLb: 3.18 * LB_TO_MTCO2, waterUsageGalPerLb: 2.601 },
  { id: 102, name: 'Stainless Steel', mtco2ePerLb: 3.87 * LB_TO_MTCO2, waterUsageGalPerLb: 13.86775 },
  { id: 103, name: 'Aluminum', mtco2ePerLb: 14.22 * LB_TO_MTCO2, waterUsageGalPerLb: 10.197 },
  { id: 104, name: 'Polypropylene', mtco2ePerLb: 2.22 * LB_TO_MTCO2, waterUsageGalPerLb: 10.79 },
  { id: 105, name: 'HDPE', mtco2ePerLb: 2.02 * LB_TO_MTCO2, waterUsageGalPerLb: 2.0768 },
  { id: 106, name: 'SAN Plastic', mtco2ePerLb: 4.0165 * LB_TO_MTCO2, waterUsageGalPerLb: 9.9297 },
  { id: 107, name: 'Melamine', mtco2ePerLb: 3.1055 * LB_TO_MTCO2, waterUsageGalPerLb: 5.9529 },
  { id: 108, name: 'Recycled Stainless Steel', mtco2ePerLb: 1.8065 * LB_TO_MTCO2, waterUsageGalPerLb: 14.94273 },
  { id: 109, name: 'Recycled Aluminum', mtco2ePerLb: 5.935 * LB_TO_MTCO2, waterUsageGalPerLb: 12.6471 },
  { id: 110, name: 'Plastic (#5 PP)', mtco2ePerLb: GAS_USAGE['PP'], waterUsageGalPerLb: 3.8735 }
] as const;

export type ReusableMaterial = (typeof MATERIALS)[number];

export const ALL_MATERIALS = [...MATERIALS, ...REUSABLE_MATERIALS] as const;

export const MATERIAL_MAP = ALL_MATERIALS.reduce(
  (acc, material) => {
    acc[material.id] = material.name;
    return acc;
  },
  {} as Record<number, string>
);
