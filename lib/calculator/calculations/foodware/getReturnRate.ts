import { BOTTLE_STATION_PRODUCT_ID } from 'lib/calculator/constants/reusable-product-types';
import type { FoodwareSelection } from 'lib/inventory/types/products';
import { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';

export type ReturnRateSummary = {
  returnRate: number;
  allItemsHaveSamePercentage: boolean;
};

export function getReturnRate({
  foodwareLineItems
}: {
  foodwareLineItems: Pick<FoodwareSelection, 'reusableReturnPercentage' | 'reusableProduct'>[];
}) {
  const foodwareWithoutWaterStation = foodwareLineItems.filter(
    item => item.reusableProduct.id !== BOTTLE_STATION_PRODUCT_ID
  );
  const allItemsHaveSamePercentage = foodwareWithoutWaterStation.every(item =>
    foodwareLineItems.every(i => i.reusableReturnPercentage === item.reusableReturnPercentage)
  );
  const averageReturnPercentage = foodwareWithoutWaterStation.length
    ? foodwareWithoutWaterStation.reduce((acc, item) => acc + item.reusableReturnPercentage, 0) /
      foodwareWithoutWaterStation.length
    : 100;
  const globalReturnRate = allItemsHaveSamePercentage
    ? // consider projects with no items to have a return rate of 100%
      (foodwareWithoutWaterStation?.[0]?.reusableReturnPercentage ?? 100)
    : undefined;

  // these could currently always be the same, but leaving them separate in case logic changes
  const returnRate = globalReturnRate ?? averageReturnPercentage;

  return {
    returnRate,
    shrinkageRate: 100 - returnRate,
    allItemsHaveSamePercentage
  };
}
