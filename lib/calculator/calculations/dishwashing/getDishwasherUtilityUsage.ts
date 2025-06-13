import type { DishWasherStatic, DishWasherOptions } from 'lib/inventory/types/projects';
import {
  ANNUAL_DISHWASHER_CONSUMPTION,
  BUILDING_WATER_HEATER,
  BOOSTER_WATER_HEATER
} from '../../constants/dishwashers';
import { DishwasherSimple } from '@prisma/client';

// Hidden: dishwasher calulcations: C85, C86
export function dishwasherUtilityUsage(dishwasher: DishWasherStatic, options: DishWasherOptions) {
  const washerProfile = ANNUAL_DISHWASHER_CONSUMPTION.find(conf => {
    return (
      dishwasher.temperature === conf.temperature &&
      dishwasher.type === conf.type &&
      dishwasher.energyStarCertified === conf.energyStar
    );
  });

  if (!washerProfile) {
    throw new Error(
      'Unidentified dishwasher configuration: ' + dishwasher.type + ', ' + dishwasher.temperature + ' temp'
    );
  }

  const racksUsed = options.calculatedRacksUsed || options.racksPerDay * options.operatingDays;
  const waterUsage = washerProfile.values.waterUsePerRack * racksUsed; // gallons per year

  // Hidden: dishwasher calulcations: C85, C86
  let electricUsage = 0;
  let gasUsage = 0;

  if (dishwasher.buildingWaterHeaterFuelType === 'Electric') {
    electricUsage = waterUsage * BUILDING_WATER_HEATER.electricEnergyUsage; // kWh per year
    // add booster energy, if applicable
    if (dishwasher.temperature === 'High') {
      const boosterConsumption = waterUsage * BOOSTER_WATER_HEATER.electricEnergyUsage;
      electricUsage += boosterConsumption;
    }
  } else if (dishwasher.buildingWaterHeaterFuelType === 'Gas') {
    gasUsage = waterUsage * BUILDING_WATER_HEATER.gasEnergyUsage; // therm per year
    // add booster energy, if applicable
    if (dishwasher.temperature === 'High') {
      const boosterConsumption = waterUsage * BOOSTER_WATER_HEATER.gasEnergyUsage;
      gasUsage += boosterConsumption;
    }
  }

  return { electricUsage, gasUsage, waterUsage };
}
