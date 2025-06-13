import type { ReusableProduct } from 'lib/inventory/types/products';
import type { SingleUseProduct } from 'lib/inventory/types/products';
import type { EventFoodwareLineItem as PrismaEventFoodwareLineItem } from '@prisma/client';
import prisma from 'lib/prisma';

import { getReusableProductsWithBottleStation } from 'lib/inventory/assets/reusables/getReusableProducts';
import { getSingleUseProducts } from 'lib/inventory/getSingleUseProducts';

export type FoodwareLineItem = Pick<
  PrismaEventFoodwareLineItem,
  'id' | 'reusableItemCount' | 'reusableReturnPercentage' | 'projectId'
> & {
  singleUseProduct: SingleUseProduct;
  reusableProduct: ReusableProduct;
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
  const [singleUseProducts, reusableProducts] = await Promise.all([
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
    .map(item => ({
      ...item,
      singleUseProduct: singleUseProducts.find(p => p.id === item.singleUseProductId)!,
      reusableProduct: reusableProducts.find(p => p.id === item.reusableProductId)!
    }))
    // sanity check
    .filter(item => item.reusableProduct && item.singleUseProduct);
  return foodwareItems;
}
