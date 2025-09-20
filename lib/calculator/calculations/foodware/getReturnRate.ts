import { BOTTLE_STATION_PRODUCT_ID } from 'lib/calculator/constants/reusable-product-types';
import type { FoodwareSelection } from 'lib/inventory/types/products';
import { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';

export type ReturnRateSummary = {
  returnRate: number;
  allItemsHaveSamePercentage: boolean;
};

export function getReturnRate({
  foodwareLineItems,
  rounded = false
}: {
  foodwareLineItems: Pick<
    FoodwareSelection,
    'reusableReturnPercentage' | 'reusableReturnCount' | 'reusableItemCount' | 'reusableProduct'
  >[];
  rounded?: boolean;
}) {
  const foodwareWithoutWaterStation = foodwareLineItems.filter(
    item => item.reusableProduct.id !== BOTTLE_STATION_PRODUCT_ID
  );
  const allItemsHaveSamePercentage = foodwareWithoutWaterStation.every(item =>
    foodwareLineItems.every(
      i => i.reusableReturnPercentage > 0 && i.reusableReturnPercentage === item.reusableReturnPercentage
    )
  );
  const foodwareWithReusables = foodwareWithoutWaterStation.filter(
    item => item.reusableItemCount && item.reusableReturnCount
  );
  const averageReturnPercentage = foodwareWithReusables.length
    ? foodwareWithReusables.reduce((acc, item) => {
        const returnPercentage = Math.round((item.reusableReturnCount * 100) / item.reusableItemCount);
        return acc + returnPercentage;
      }, 0) / foodwareWithReusables.length
    : 100;
  const globalReturnRate = allItemsHaveSamePercentage
    ? // consider projects with no items to have a return rate of 100%
      (foodwareWithoutWaterStation?.[0]?.reusableReturnPercentage ?? 100)
    : undefined;

  // these could currently always be the same, but leaving them separate in case logic changes
  const returnRate = globalReturnRate ?? averageReturnPercentage;
  // round to 2 decimal places if rounded is true
  const formattedReturnRate = rounded ? Math.round(returnRate * 100) / 100 : returnRate;

  return {
    returnRate: formattedReturnRate,
    shrinkageRate: Math.round((100 - formattedReturnRate) * 100) / 100,
    allItemsHaveSamePercentage
  };
}
