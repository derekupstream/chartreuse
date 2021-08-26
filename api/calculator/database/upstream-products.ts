// The following is a list of products provided by Upstream. They could also live in a database one day

import { SingleUseItem } from '../types/products';

const products: SingleUseItem[] = [
  { id: 1, boxWeight: 1.3, secondaryMaterial: 'Aluminum', secondaryMaterialWeightPerUnit: 0.1 },
  { id: 2, boxWeight: 1.53, secondaryMaterial: 'Aluminum', secondaryMaterialWeightPerUnit: 0.1 }
];

export function getProductById (id: number) {
  return products.find(product => product.id === id);
}