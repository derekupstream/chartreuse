import { STATES } from 'lib/calculator/constants/utilities';
import { VENUE_CATEGORY_OPTIONS } from 'lib/calculator/constants/venue-categories';
import type { RspIngestionInput } from 'lib/rsp/getRspIngestionResults';

import type { FixtureField, FixtureValues } from './projectionsFixture';

/**
 * Flat fixture for the RSP Ingestion Model. Edits org-profile fields plus
 * top-level period info. Per-row usage data lives in the dedicated
 * RspUsageRowsEditor (similar pattern to event foodware items).
 */
export const RSP_FIXTURE_FIELDS: FixtureField[] = [
  {
    key: 'clientAccountName',
    label: 'Client / Venue Name',
    type: 'text',
    helpText: 'The customer this report covers (links to an Account in v2)'
  },
  {
    key: 'venueCategory',
    label: 'Venue Category',
    type: 'select',
    helpText: 'Drives industry benchmarking and venue-type-specific factors',
    options: VENUE_CATEGORY_OPTIONS
  },
  {
    key: 'state',
    label: 'State',
    type: 'select',
    helpText: 'Drives default utility rates',
    options: STATES.map(s => ({ value: s.name, label: s.name }))
  },
  {
    key: 'washFacilityType',
    label: 'Wash Facility Type',
    type: 'select',
    helpText: 'Affects water + energy per cycle',
    options: [
      { value: 'commercial_dishwasher', label: 'Commercial Dishwasher' },
      { value: 'industrial', label: 'Industrial' },
      { value: 'manual', label: 'Manual / Hand Wash' }
    ]
  },
  {
    key: 'washEnergySource',
    label: 'Wash Energy Source',
    type: 'select',
    helpText: 'Drives kg CO2e per kWh of wash energy',
    options: [
      { value: 'grid_electric', label: 'Grid Electric' },
      { value: 'natural_gas', label: 'Natural Gas' },
      { value: 'solar', label: 'Solar' },
      { value: 'hydro', label: 'Hydropower' },
      { value: 'wind', label: 'Wind' }
    ]
  },
  {
    key: 'transportVehicleType',
    label: 'Transport Vehicle',
    type: 'select',
    helpText: 'Per-mile transport emissions',
    options: [
      { value: 'electric_van', label: 'Electric Van' },
      { value: 'gas_van', label: 'Gas Van' },
      { value: 'diesel_truck', label: 'Diesel Truck' },
      { value: 'bike_courier', label: 'Bike Courier' }
    ]
  },
  {
    key: 'avgTransportMilesPerDelivery',
    label: 'Avg Transport Miles / Delivery',
    type: 'number',
    unit: 'miles',
    min: 0
  },
  {
    key: 'defaultSingleUseMaterial',
    label: 'Default Single-Use Replaced',
    type: 'select',
    helpText: 'What disposable item is being displaced when a reusable goes out',
    options: [
      { value: 'polystyrene_foam', label: 'Polystyrene Foam' },
      { value: 'paper', label: 'Paper' },
      { value: 'pet', label: 'PET Plastic' },
      { value: 'pp', label: 'PP Plastic' },
      { value: 'pla', label: 'PLA / Compostable' }
    ]
  },
  {
    key: 'laborCostPerCycle',
    label: 'Labor Cost / Cycle',
    type: 'number',
    unit: '$',
    min: 0
  },
  {
    key: 'transportCostPerMile',
    label: 'Transport Cost / Mile',
    type: 'number',
    unit: '$',
    min: 0
  },
  {
    key: 'periodStart',
    label: 'Period Start',
    type: 'text',
    helpText: 'YYYY-MM-DD'
  },
  {
    key: 'periodEnd',
    label: 'Period End',
    type: 'text',
    helpText: 'YYYY-MM-DD'
  }
];

export function extractRspFixtureValues(input: RspIngestionInput): FixtureValues {
  return {
    clientAccountName: input.client?.accountName ?? '',
    venueCategory: input.client?.venueCategory ?? 'Other',
    state: input.state ?? 'California',
    washFacilityType: input.orgProfile?.washFacilityType ?? 'commercial_dishwasher',
    washEnergySource: input.orgProfile?.washEnergySource ?? 'grid_electric',
    transportVehicleType: input.orgProfile?.transportVehicleType ?? 'electric_van',
    avgTransportMilesPerDelivery: input.orgProfile?.avgTransportMilesPerDelivery ?? 0,
    defaultSingleUseMaterial: input.orgProfile?.defaultSingleUseMaterial ?? 'polystyrene_foam',
    laborCostPerCycle: input.orgProfile?.laborCostPerCycle ?? 0,
    transportCostPerMile: input.orgProfile?.transportCostPerMile ?? 0,
    periodStart: input.period?.dateMin ?? '',
    periodEnd: input.period?.dateMax ?? ''
  };
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function applyRspFixtureValues(reference: RspIngestionInput, values: FixtureValues): RspIngestionInput {
  const next: RspIngestionInput = JSON.parse(JSON.stringify(reference));
  next.state = (values.state as string) || next.state;
  next.client = {
    accountId: reference.client?.accountId ?? null,
    accountName: (values.clientAccountName as string) || reference.client?.accountName || '',
    venueCategory: (values.venueCategory as string) || reference.client?.venueCategory || 'Other'
  };
  next.orgProfile = {
    ...next.orgProfile,
    washFacilityType:
      (values.washFacilityType as RspIngestionInput['orgProfile']['washFacilityType']) ??
      next.orgProfile.washFacilityType,
    washEnergySource:
      (values.washEnergySource as RspIngestionInput['orgProfile']['washEnergySource']) ??
      next.orgProfile.washEnergySource,
    transportVehicleType:
      (values.transportVehicleType as RspIngestionInput['orgProfile']['transportVehicleType']) ??
      next.orgProfile.transportVehicleType,
    avgTransportMilesPerDelivery: num(
      values.avgTransportMilesPerDelivery,
      next.orgProfile.avgTransportMilesPerDelivery
    ),
    defaultSingleUseMaterial:
      (values.defaultSingleUseMaterial as RspIngestionInput['orgProfile']['defaultSingleUseMaterial']) ??
      next.orgProfile.defaultSingleUseMaterial,
    laborCostPerCycle: num(values.laborCostPerCycle, next.orgProfile.laborCostPerCycle),
    transportCostPerMile: num(values.transportCostPerMile, next.orgProfile.transportCostPerMile)
  };
  next.period = {
    dateMin: (values.periodStart as string) || next.period.dateMin,
    dateMax: (values.periodEnd as string) || next.period.dateMax
  };
  return next;
}

export function applyRspUsageRowEdit(
  input: RspIngestionInput,
  index: number,
  patch: Partial<{
    reusableType: string;
    materialType: string;
    weightLbsPerItem: number;
    inWarehouseEvents: number;
    outWarehouseEvents: number;
    deliveriesCount: number;
    singleUseMaterial: string;
  }>
): RspIngestionInput {
  const next: RspIngestionInput = JSON.parse(JSON.stringify(input));
  const row = next.usageRows?.[index];
  if (!row) return next;
  Object.assign(row, patch);
  return next;
}

export function buildSampleRspInput(): RspIngestionInput {
  return {
    period: { dateMin: '2026-04-01', dateMax: '2026-04-30' },
    state: 'California',
    client: {
      accountId: null,
      accountName: 'Bay Area Tech Corp HQ',
      venueCategory: 'Corporate Office'
    },
    orgProfile: {
      washFacilityType: 'commercial_dishwasher',
      washEnergySource: 'grid_electric',
      avgTransportMilesPerDelivery: 18,
      transportVehicleType: 'electric_van',
      defaultSingleUseMaterial: 'polystyrene_foam',
      laborCostPerCycle: 1.5,
      transportCostPerMile: 1.25
    },
    usageRows: [
      {
        reusableType: 'cup',
        materialType: 'polypropylene',
        weightLbsPerItem: 0.09,
        inWarehouseEvents: 9750,
        outWarehouseEvents: 10000,
        deliveriesCount: 22
      },
      {
        reusableType: 'container',
        materialType: 'polypropylene',
        weightLbsPerItem: 0.18,
        inWarehouseEvents: 5800,
        outWarehouseEvents: 6000,
        deliveriesCount: 22
      },
      {
        reusableType: 'plate',
        materialType: 'melamine',
        weightLbsPerItem: 0.57,
        inWarehouseEvents: 1900,
        outWarehouseEvents: 2000,
        deliveriesCount: 14
      }
    ]
  };
}
