import type { SingleUseProduct } from 'lib/inventory/types/products';

import { getSingleUseProducts as getTacoBellProducts } from './assets/taco-bell/getSingleUseProducts';
import { getSingleUseProducts as getUpstreamProducts } from './assets/upstream/getSingleUseProducts';

function getAllProducts() {
  const collections = [getUpstreamProducts(), getTacoBellProducts()];
  return Promise.all(collections).then(collections => collections.flat());
}

const assetsByOrg: Record<string, () => Promise<SingleUseProduct[]>> = {
  // Upstream
  '79cb54a3-8b75-4841-93d4-a23fd1c07553': getAllProducts,
  // Taco Bell
  'f09003f8-50bc-487d-8627-0f3e1f3117d9': getTacoBellProducts
};

export async function getSingleUseProducts({ orgId }: { orgId: string }) {
  return getAllProducts();
  if (assetsByOrg[orgId]) {
    const result = await assetsByOrg[orgId]();
    console.log('Retrieved custom inventory for org', { count: result.length, orgId });
    return result;
  }

  return getUpstreamProducts();
}
