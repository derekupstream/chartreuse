/**
 * Values taken from sheet "Hidden: EPA WARM Model Assumptions"
 * provided by the EPA WARM Model
 */
export const CORRUGATED_CARDBOARD_ID = 1;
export const CORRUGATED_CARDBOARD_GAS = 0.002885;
export const CORRUGATED_CARDBOARD_NAME = 'Corrugated Cardboard';

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
  | 'Aluminum'
  | 'PET';

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
    mtco2ePerLb: 0.004685,
    waterUsageGalPerLb: 0.5978
  },
  {
    id: CORRUGATED_CARDBOARD_ID,
    name: CORRUGATED_CARDBOARD_NAME,
    mtco2ePerLb: CORRUGATED_CARDBOARD_GAS,
    waterUsageGalPerLb: 3.03798
  },
  {
    id: 2,
    name: 'Molded Fiber (Paper)',
    mtco2ePerLb: 0.004545,
    waterUsageGalPerLb: 1.6527
  },
  {
    id: 3,
    name: 'Molded Fiber (Plant)',
    mtco2ePerLb: 0.004685,
    waterUsageGalPerLb: 1.6527
  },
  {
    id: 4,
    name: 'Wood',
    mtco2ePerLb: 0.000595,
    waterUsageGalPerLb: 1.9367
  },
  {
    id: 5,
    name: 'Plastic (#1 PET)',
    mtco2ePerLb: 0.0011,
    waterUsageGalPerLb: 8.1325
  },
  {
    id: 6,
    name: 'Plastic (#5 PP)',
    mtco2ePerLb: 0.000775,
    waterUsageGalPerLb: 3.8735
  },
  {
    id: 7,
    name: 'Plastic (#6 PS)',
    mtco2ePerLb: 0.001265,
    waterUsageGalPerLb: 8.724
  },
  {
    id: 8,
    name: 'Plastic (LDPE)',
    mtco2ePerLb: 0.000915,
    waterUsageGalPerLb: 14.3271
  },
  {
    id: 9,
    name: 'Compostable Plastic (PLA)',
    mtco2ePerLb: 0.00041,
    waterUsageGalPerLb: 20.0946
  },
  {
    id: 10,
    name: 'EPS Foam',
    mtco2ePerLb: 0.001265,
    waterUsageGalPerLb: 15.4898
  },
  {
    id: 11,
    name: 'Aluminum',
    mtco2ePerLb: 0.003755,
    waterUsageGalPerLb: 9.4724
  }
];

// Maybe it would be cleaner to let primaryMaterial be undefined? this is only used for bottle station products
export const NO_MATERIAL_ID = -1;

const LB_TO_MTCO2 = 0.000453592;

export const REUSABLE_MATERIALS = [
  { id: 100, name: 'Glass', mtco2ePerLb: 0.00028, waterUsageGalPerLb: 2.317 },
  { id: 101, name: 'Ceramic', mtco2ePerLb: 0.000807234489390462, waterUsageGalPerLb: 2.601 },
  { id: 102, name: 'Stainless Steel', mtco2ePerLb: 0.00119, waterUsageGalPerLb: 13.86775 },
  { id: 103, name: 'Aluminum', mtco2ePerLb: 0.003085, waterUsageGalPerLb: 10.197 },
  { id: 104, name: 'Polypropylene', mtco2ePerLb: 0.000775, waterUsageGalPerLb: 10.79 },
  { id: 105, name: 'HDPE', mtco2ePerLb: 0.000725, waterUsageGalPerLb: 2.0768 },
  { id: 106, name: 'SAN Plastic', mtco2ePerLb: 0.00098, waterUsageGalPerLb: 9.9297 },
  { id: 107, name: 'Melamine', mtco2ePerLb: 0.000965, waterUsageGalPerLb: 5.9529 },
  { id: 108, name: 'Recycled Stainless Steel', mtco2ePerLb: 1.8065 * LB_TO_MTCO2, waterUsageGalPerLb: 14.94273 },
  { id: 109, name: 'Recycled Aluminum', mtco2ePerLb: 5.935 * LB_TO_MTCO2, waterUsageGalPerLb: 12.6471 },
  { id: 110, name: 'Plastic (#5 PP)', mtco2ePerLb: 0.000775, waterUsageGalPerLb: 3.8735 },
  { id: 111, name: 'Polycarbonate', mtco2ePerLb: 0.00075, waterUsageGalPerLb: 3.03798 }
] as const;

// only Upstream can use Recycled Stainless Steel and Recycled Aluminum
export const UPSTREAM_ONLY_MATERIALS = ['Recycled Stainless Steel', 'Recycled Aluminum'];

// export type ReusableMaterial = (typeof MATERIALS)[number];

export const ALL_MATERIALS = [...MATERIALS, ...REUSABLE_MATERIALS] as const;

export const MATERIAL_MAP = ALL_MATERIALS.reduce(
  (acc, material) => {
    acc[material.id] = material;
    return acc;
  },
  {} as Record<number, { name: string; mtco2ePerLb: number; waterUsageGalPerLb?: number }>
);
