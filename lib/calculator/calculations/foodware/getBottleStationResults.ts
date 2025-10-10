import type { ProjectInventory } from 'lib/inventory/types/projects';
import { BOTTLE_STATION_PRODUCT_ID } from '../../constants/reusable-product-types';

type BottleStationResults = {
  bottlesSaved: number;
};

export const gallonsUsedPerBottleStation = 27.1515;
const gallonsPerBottle = 0.132;

export function getBottleStationResults(project: ProjectInventory): BottleStationResults {
  const bottleStationProduct = project.foodwareItems.find(
    item => item.reusableProduct.id === BOTTLE_STATION_PRODUCT_ID
  );
  if (!bottleStationProduct) {
    return { bottlesSaved: 0 };
  }
  const waterPerStation = bottleStationProduct.waterUsageGallons ?? 0;
  const totalWaterUsageGallons = waterPerStation * bottleStationProduct.reusableItemCount;
  const bottlesSaved = Math.floor(totalWaterUsageGallons / gallonsPerBottle);
  return { bottlesSaved };
}
