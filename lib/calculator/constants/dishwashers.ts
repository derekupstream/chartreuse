export const BTU_TO_KWH = 3413;
export const BTU_TO_THERMS = 100000;
export const DENSITY_OF_WATER = 8.2; // lb/gallon
export const SPECIFIC_HEAT_OF_WATER = 1.0; // Btu/pound/degrees F

export const DISHWASHER_TYPES = [
  { name: 'Under Counter' },
  { name: 'Stationary Single Tank Door' },
  { name: 'Single Tank Conveyer' },
  { name: 'Multi Tank Conveyer' }
  //{ name: 'Pot, Pan, and Utensil' } - details are missing in the original spreadsheet
] as const;

export const FUEL_TYPES = [{ name: 'Electric' }, { name: 'Gas' }] as const;

export const TEMPERATURES = [{ name: 'High' }, { name: 'Low' }] as const;

// See Hidden: Dishwasher calculations: Assumptions
export const BUILDING_WATER_HEATER = {
  electricEfficiency: 0.98,
  gasEfficiency: 0.8,
  tempIncrease: 70, // degrees F
  // calculated below
  electricEnergyUsage: 0, // kWh/gallon
  gasEnergyUsage: 0 // therm/gallon
};

export const BOOSTER_WATER_HEATER = {
  electricEfficiency: 0.98,
  gasEfficiency: 0.8,
  tempIncrease: 40, // degrees F
  // calculated below
  electricEnergyUsage: 0, // kWh/gallon
  gasEnergyUsage: 0 // therm/gallon
};

// See Hidden: Dishwasher calculations: C42, C43, D42, D43
BUILDING_WATER_HEATER.electricEnergyUsage = calculateEnergyUsage(BUILDING_WATER_HEATER.tempIncrease, BUILDING_WATER_HEATER.electricEfficiency);
BUILDING_WATER_HEATER.gasEnergyUsage = calculateEnergyUsage(BUILDING_WATER_HEATER.tempIncrease, BUILDING_WATER_HEATER.gasEfficiency);
BOOSTER_WATER_HEATER.electricEnergyUsage = calculateEnergyUsage(BOOSTER_WATER_HEATER.tempIncrease, BOOSTER_WATER_HEATER.electricEfficiency);
BOOSTER_WATER_HEATER.gasEnergyUsage = calculateEnergyUsage(BOOSTER_WATER_HEATER.tempIncrease, BOOSTER_WATER_HEATER.gasEfficiency);

function calculateEnergyUsage(tempIncrease: number, electricEfficiency: number) {
  return (tempIncrease * SPECIFIC_HEAT_OF_WATER * DENSITY_OF_WATER) / electricEfficiency / BTU_TO_KWH;
}

interface ConsumptionItem {
  type: DishwasherType;
  temperature: TemperatureType;
  energyStar: boolean;
  values: {
    washTimeMinutes: number;
    waterUsePerRack: number; // gallons
    idlePowerDraw: number; // kW
    lifetimeYears: number;
  };
}

export const ANNUAL_DISHWASHER_CONSUMPTION: ConsumptionItem[] = [
  {
    type: 'Under Counter',
    temperature: 'Low',
    energyStar: false,
    values: {
      washTimeMinutes: 2,
      waterUsePerRack: 1.73,
      idlePowerDraw: 0.5,
      lifetimeYears: 10
    }
  },
  {
    type: 'Under Counter',
    temperature: 'Low',
    energyStar: true,
    values: {
      washTimeMinutes: 2,
      waterUsePerRack: 1.19,
      idlePowerDraw: 0.5,
      lifetimeYears: 10
    }
  },
  {
    type: 'Under Counter',
    temperature: 'High',
    energyStar: false,
    values: {
      washTimeMinutes: 2,
      waterUsePerRack: 1.09,
      idlePowerDraw: 0.76,
      lifetimeYears: 10
    }
  },
  {
    type: 'Under Counter',
    temperature: 'High',
    energyStar: true,
    values: {
      washTimeMinutes: 2,
      waterUsePerRack: 0.86,
      idlePowerDraw: 0.5,
      lifetimeYears: 10
    }
  },
  {
    type: 'Stationary Single Tank Door',
    temperature: 'Low',
    energyStar: false,
    values: {
      washTimeMinutes: 1.5,
      waterUsePerRack: 2.1,
      idlePowerDraw: 0.6,
      lifetimeYears: 15
    }
  },
  {
    type: 'Stationary Single Tank Door',
    temperature: 'Low',
    energyStar: true,
    values: {
      washTimeMinutes: 1.5,
      waterUsePerRack: 1.18,
      idlePowerDraw: 0.6,
      lifetimeYears: 15
    }
  },
  {
    type: 'Stationary Single Tank Door',
    temperature: 'High',
    energyStar: false,
    values: {
      washTimeMinutes: 1,
      waterUsePerRack: 1.29,
      idlePowerDraw: 0.87,
      lifetimeYears: 15
    }
  },
  {
    type: 'Stationary Single Tank Door',
    temperature: 'High',
    energyStar: true,
    values: {
      washTimeMinutes: 1,
      waterUsePerRack: 0.89,
      idlePowerDraw: 0.7,
      lifetimeYears: 15
    }
  },
  {
    type: 'Single Tank Conveyer',
    temperature: 'Low',
    energyStar: false,
    values: {
      washTimeMinutes: 0.3,
      waterUsePerRack: 1.31,
      idlePowerDraw: 1.6,
      lifetimeYears: 20
    }
  },
  {
    type: 'Single Tank Conveyer',
    temperature: 'Low',
    energyStar: true,
    values: {
      washTimeMinutes: 0.3,
      waterUsePerRack: 0.79,
      idlePowerDraw: 1.5,
      lifetimeYears: 20
    }
  },
  {
    type: 'Single Tank Conveyer',
    temperature: 'High',
    energyStar: false,
    values: {
      washTimeMinutes: 0.3,
      waterUsePerRack: 0.87,
      idlePowerDraw: 1.93,
      lifetimeYears: 20
    }
  },
  {
    type: 'Single Tank Conveyer',
    temperature: 'High',
    energyStar: true,
    values: {
      washTimeMinutes: 0.3,
      waterUsePerRack: 0.7,
      idlePowerDraw: 1.5,
      lifetimeYears: 20
    }
  },
  {
    type: 'Multi Tank Conveyer',
    temperature: 'Low',
    energyStar: false,
    values: {
      washTimeMinutes: 0.3,
      waterUsePerRack: 1.04,
      idlePowerDraw: 2,
      lifetimeYears: 20
    }
  },
  {
    type: 'Multi Tank Conveyer',
    temperature: 'Low',
    energyStar: true,
    values: {
      washTimeMinutes: 0.3,
      waterUsePerRack: 1.54,
      idlePowerDraw: 2,
      lifetimeYears: 20
    }
  },
  {
    type: 'Multi Tank Conveyer',
    temperature: 'High',
    energyStar: false,
    values: {
      washTimeMinutes: 0.2,
      waterUsePerRack: 0.97,
      idlePowerDraw: 2.59,
      lifetimeYears: 20
    }
  },
  {
    type: 'Multi Tank Conveyer',
    temperature: 'High',
    energyStar: true,
    values: {
      washTimeMinutes: 0.2,
      waterUsePerRack: 0.54,
      idlePowerDraw: 2.25,
      lifetimeYears: 20
    }
  }
];

export type DishwasherType = (typeof DISHWASHER_TYPES)[number]['name'];
export type FuelType = (typeof FUEL_TYPES)[number]['name'];
export type TemperatureType = (typeof TEMPERATURES)[number]['name'];
