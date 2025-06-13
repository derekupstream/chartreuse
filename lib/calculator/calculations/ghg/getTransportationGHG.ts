import { ProjectInventory } from 'lib/inventory/types/projects';

const cargoTruckCO2PerMile = 0.37037616;

// calculate the GHG emissions for the transportation of reusable items
export function getReusableItemTransportationGHG(project: ProjectInventory): number {
  const itemsWeight = project.reusableItems.reduce((total, item) => total + (item.product?.itemWeight || 0), 0);
  const massInTons = itemsWeight / 2000;
  const distanceInMiles = project.truckTransportationCosts.reduce((total, cost) => total + cost.distanceInMiles, 0);
  return massInTons * cargoTruckCO2PerMile * distanceInMiles;
}
