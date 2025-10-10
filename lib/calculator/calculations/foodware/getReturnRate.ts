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
    ? (foodwareWithReusables.reduce((acc, item) => acc + item.reusableReturnCount, 0) * 100) /
      foodwareWithReusables.reduce((acc, item) => acc + item.reusableItemCount, 0)
    : 1;

  const returnRate = allItemsHaveSamePercentage
    ? // consider projects with no items to have a return rate of 100%
      (foodwareWithoutWaterStation?.[0]?.reusableReturnPercentage ?? 100)
    : averageReturnPercentage;
  const shrinkageRate = 1 - returnRate;
  // round to 2 decimal places if rounded is true
  const formattedReturnRate = rounded ? formatPercentage(returnRate) : returnRate;
  const formattedShrinkageRate = rounded ? formatPercentage(shrinkageRate) : shrinkageRate;
  return {
    returnRate: formattedReturnRate,
    shrinkageRate: formattedShrinkageRate,
    allItemsHaveSamePercentage
  };
}

const formatPercentage = (percentage: number) => {
  return parseFloat(percentage.toFixed(2).replace(/0+$/, ''));
};
