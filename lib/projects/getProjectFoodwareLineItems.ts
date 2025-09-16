import type { ReusableProduct } from 'lib/inventory/types/products';
import type { SingleUseProduct } from 'lib/inventory/types/products';
import type { EventFoodwareLineItem as PrismaEventFoodwareLineItem } from '@prisma/client';
import prisma from 'lib/prisma';

import { getReusableProductsWithBottleStation } from 'lib/inventory/assets/reusables/getReusableProducts';
import { getSingleUseProducts } from 'lib/inventory/getSingleUseProducts';
import { FoodwareOption, getFoodwareOptions } from 'lib/inventory/assets/event-foodware/getFoodwareOptions';

export type FoodwareLineItem = Pick<
  PrismaEventFoodwareLineItem,
  'id' | 'reusableItemCount' | 'reusableReturnPercentage' | 'projectId' | 'waterUsageGallons'
> & {
  singleUseProduct: SingleUseProduct;
  reusableProduct: ReusableProduct;
  foodwareTitle: string;
};

export async function getProjectFoodwareLineItems(projectId: string): Promise<FoodwareLineItem[]> {
  const { orgId } = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    select: {
      orgId: true
    }
  });
  const [foodwareOptions, singleUseProducts, reusableProducts] = await Promise.all([
    getFoodwareOptions(),
    getSingleUseProducts({ orgId }),
    getReusableProductsWithBottleStation()
  ]);
  const items = await prisma.eventFoodwareLineItem.findMany({
    where: {
      projectId
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  const foodwareItems = items
    .map(item => {
      const foodwareOption = foodwareOptions.find(
        o => o.reusable.id === item.reusableProductId && o.singleuse.id === item.singleUseProductId
      );
      const reusableProduct = reusableProducts.find(p => p.id === item.reusableProductId);
      return {
        ...item,
        foodwareTitle: foodwareOption?.title || reusableProduct?.description || 'N/A',
        singleUseProduct: singleUseProducts.find(p => p.id === item.singleUseProductId)!,
        reusableProduct: reusableProduct!
      };
    })
    // sanity check
    .filter(item => item.reusableProduct && item.singleUseProduct);
  return foodwareItems;
}
