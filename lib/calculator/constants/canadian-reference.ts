/**
 * Reference values shown as guidance on Canadian projects.
 *
 * None of these numbers enter a calculation — labor and waste hauling costs are always
 * entered by the user — they exist so a Canadian user can pick realistic numbers instead
 * of guessing from US figures. Every value is citable; sources are noted inline and the
 * full derivation lives in docs/CANADIAN-REFERENCE-DATA.md.
 *
 * Vintage: September 2026. Minimum wages change often (five provinces raise theirs on
 * October 1, 2026 — those announced rates are included); refresh this file annually.
 */

/**
 * Bank of Canada annual average USD→CAD exchange rate for 2025 (series FXAUSDCAD,
 * bankofcanada.ca/rates/exchange/annual-average-exchange-rates). Use when a USD-sourced
 * figure needs a documented conversion to Canadian dollars.
 */
export const USD_TO_CAD_ANNUAL_AVERAGE_2025 = 1.3978;

export type CanadianWageReference = {
  /** General adult minimum wage, C$/hour, in effect September 2026. */
  minimumWage: number;
  /** When the current minimum took effect. */
  effective: string;
  /** Already-announced next increase, if any. */
  announcedIncrease?: string;
  /**
   * Median hourly wage for dishwashing/kitchen staff (Job Bank, NOC 65201 "food counter
   * attendants, kitchen helpers and related support occupations", LFS 2023–2024,
   * updated Nov 2025). In most provinces this equals the minimum wage — kitchen-helper
   * jobs typically pay at or near the legal floor.
   */
  kitchenStaffMedian: number;
};

/**
 * Sources: provincial/territorial government employment-standards pages and the federal
 * minimum wage announcement (canada.ca), September 2026; kitchen-staff medians from
 * Job Bank (jobbank.gc.ca/marketreport/wages-occupation/17215/ca).
 */
export const CANADIAN_WAGES: Record<string, CanadianWageReference> = {
  'British Columbia': { minimumWage: 18.25, effective: 'June 2026', kitchenStaffMedian: 18.25 },
  Alberta: { minimumWage: 15.0, effective: 'October 2018', kitchenStaffMedian: 16.0 },
  Saskatchewan: {
    minimumWage: 15.35,
    effective: 'October 2025',
    announcedIncrease: '$15.70 on October 1, 2026',
    kitchenStaffMedian: 15.35
  },
  Manitoba: {
    minimumWage: 16.0,
    effective: 'October 2025',
    announcedIncrease: '$16.40 on October 1, 2026',
    kitchenStaffMedian: 16.0
  },
  Ontario: {
    minimumWage: 17.6,
    effective: 'October 2025',
    announcedIncrease: '$17.95 on October 1, 2026',
    kitchenStaffMedian: 17.6
  },
  Quebec: { minimumWage: 16.6, effective: 'May 2026', kitchenStaffMedian: 16.6 },
  'New Brunswick': { minimumWage: 15.9, effective: 'April 2026', kitchenStaffMedian: 15.9 },
  'Nova Scotia': {
    minimumWage: 16.75,
    effective: 'April 2026',
    announcedIncrease: '$17.00 on October 1, 2026',
    kitchenStaffMedian: 16.75
  },
  'Prince Edward Island': {
    minimumWage: 17.0,
    effective: 'April 2026',
    announcedIncrease: '$17.30 on October 1, 2026',
    kitchenStaffMedian: 17.0
  },
  'Newfoundland and Labrador': { minimumWage: 16.35, effective: 'April 2026', kitchenStaffMedian: 16.35 },
  Yukon: { minimumWage: 18.51, effective: 'April 2026', kitchenStaffMedian: 20.0 },
  'Northwest Territories': { minimumWage: 17.2, effective: 'September 2026', kitchenStaffMedian: 20.0 },
  Nunavut: { minimumWage: 20.17, effective: 'September 2026', kitchenStaffMedian: 25.9 }
};

export function getCanadianWageReference(region: string | null | undefined): CanadianWageReference | null {
  if (!region) return null;
  return CANADIAN_WAGES[region] ?? null;
}

export type TippingFeeReference = {
  city: string;
  region: string;
  /** Commercial garbage tipping fee for small loads, C$ per tonne. */
  garbagePerTonne: number;
  /** Anything the single number hides (taxes, load-size tiers). */
  note?: string;
  /** Year the published schedule takes effect. */
  vintage: string;
};

/**
 * Landfill/transfer-station tipping fees from published 2025–2026 municipal fee
 * schedules (each city's bylaw or rates page). There is no current national tipping-fee
 * survey to cite, so these are city-level references — commercial hauling bills also
 * depend on bin size and pickup frequency, which private haulers price by contract.
 */
export const CANADIAN_TIPPING_FEES: TippingFeeReference[] = [
  {
    city: 'Metro Vancouver',
    region: 'British Columbia',
    garbagePerTonne: 182,
    note: 'loads under 1 tonne; larger loads pay less per tonne',
    vintage: '2026'
  },
  { city: 'Kelowna', region: 'British Columbia', garbagePerTonne: 106, vintage: '2026' },
  { city: 'Calgary', region: 'Alberta', garbagePerTonne: 113, vintage: '2026' },
  { city: 'Edmonton', region: 'Alberta', garbagePerTonne: 102, vintage: '2026' },
  { city: 'Winnipeg', region: 'Manitoba', garbagePerTonne: 99, vintage: '2026' },
  { city: 'Toronto', region: 'Ontario', garbagePerTonne: 189.86, vintage: '2026' },
  { city: 'Ottawa', region: 'Ontario', garbagePerTonne: 172.7, vintage: '2026' },
  { city: 'Halifax', region: 'Nova Scotia', garbagePerTonne: 135.5, note: 'plus HST', vintage: '2025–26' }
];

/** The spread across the cities above — used when a province has no surveyed city. */
export const CANADIAN_TIPPING_FEE_RANGE = { low: 99, high: 190 } as const;

export function getTippingFeesForRegion(region: string | null | undefined): TippingFeeReference[] {
  if (!region) return [];
  return CANADIAN_TIPPING_FEES.filter(fee => fee.region === region);
}
