import { useGET } from './helpers';
import type { ReusableProduct, SingleUseProduct } from 'lib/inventory/types/products';
import { FoodwareOption } from 'lib/inventory/assets/event-foodware/getFoodwareOptions';

export function useGetFoodwareOptions() {
  return useGET<FoodwareOption[]>('/api/inventory/foodware-options');
}

// note this does not return bottle station products
export function useGetReusableProducts() {
  return useGET<ReusableProduct[]>('/api/inventory/reusable-products');
}

export function useGetSingleUseProducts() {
  return useGET<SingleUseProduct[]>('/api/inventory/single-use-products');
}
