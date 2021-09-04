// The following is a list of products provided by Upstream. They could also live in a database one day

import { SingleUseProduct } from '../types/products';

const products: SingleUseProduct[] = [
  { id: 1, boxWeight: 1.3, category: 1, type: 1, itemWeight: 0, unitsPerCase: 1000, primaryMaterial: 'Aluminum', primaryMaterialWeightPerUnit: 0.1, secondaryMaterial: 'Aluminum', secondaryMaterialWeightPerUnit: 0.1 }
];

export function getProductById (id: number) {
  return products.find(product => product.id === id);
}