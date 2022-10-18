import { SingleUseProduct } from '../lib/calculator/types/products'
import getUpstreamProducts from './assets/upstream/getSingleUseItems'
import getTacoBellProducts from './assets/taco-bell/getSingleUseItems'

function getAllProducts() {
  const collections = [
    getUpstreamProducts(),
    getTacoBellProducts()
  ]
  return Promise.all(collections).then(collections => collections.flat())
}

const assetsByOrg: Record<string, () => Promise<SingleUseProduct[]>> = {
  // Upstream
  '79cb54a3-8b75-4841-93d4-a23fd1c07553': getAllProducts,
  // Taco Bell
  'f09003f8-50bc-487d-8627-0f3e1f3117d9': getTacoBellProducts
}

export default async function getSingleUseItems({ orgId }: { orgId: string }) {

  if (assetsByOrg[orgId]) {
    const result = await assetsByOrg[orgId]();
    console.log('Retrieved custom inventory for org', { count: result.length, orgId })
    return result
  }

  return getAllProducts()
}
