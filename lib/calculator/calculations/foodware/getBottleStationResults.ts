import type { ProjectInventory } from 'lib/inventory/types/projects';
import { BOTTLE_STATION_PRODUCT_ID } from 'lib/inventory/assets/reusables/getReusableProducts';

type BottleStationResults = {
  bottlesSaved: number;
};

export function getBottleCountForBottleStation(stationsPurchased: number): number {
  return Math.round((stationsPurchased * gallonsUsedPerBottleStation) / gallonsPerBottle);
}

const gallonsUsedPerBottleStation = 27.1515;
const gallonsPerBottle = 0.132;

export function getBottleStationResults(project: ProjectInventory): BottleStationResults {
  const bottleStationProduct = project.foodwareItems.find(
    item => item.reusableProduct.id === BOTTLE_STATION_PRODUCT_ID
  );
  const stationsPurchased = bottleStationProduct?.reusableItemCount ?? 0;
  const bottlesSaved = getBottleCountForBottleStation(stationsPurchased);
  return { bottlesSaved };
}
