import type { ProjectInventory } from 'lib/inventory/types/projects';
import { BOTTLE_STATION_PRODUCT_ID } from '../../constants/reusable-product-types';

type BottleStationResults = {
  bottlesSaved: number;
};

export function getBottleCountForBottleStation(stationsPurchased: number): number {
  return Math.round((stationsPurchased * gallonsUsedPerBottleStation) / gallonsPerBottle);
}

export const gallonsUsedPerBottleStation = 27.1515;
const gallonsPerBottle = 0.132;

export function getBottleStationResults(project: ProjectInventory): BottleStationResults {
  const bottleStationProduct = project.foodwareItems.find(
    item => item.reusableProduct.id === BOTTLE_STATION_PRODUCT_ID
  );
  const waterUsageGallons = bottleStationProduct?.waterUsageGallons ?? 0;
  const bottlesSaved = Math.round(waterUsageGallons / gallonsPerBottle);
  return { bottlesSaved };
}
