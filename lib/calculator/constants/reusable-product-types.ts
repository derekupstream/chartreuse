export const PRODUCT_TYPES = [
  // { id: 0, name: 'Glass Cup' },
  // { id: 1, name: 'Ceramic Mug' },
  // { id: 2, name: 'Melamine Mug' },
  // { id: 3, name: 'Stainless Steel Cup' },
  // { id: 4, name: 'Aluminum Cup' },
  // { id: 5, name: 'Recycled Aluminum Cup' },
  // { id: 6, name: 'Polypropylene Cup' },
  // { id: 7, name: 'SAN Plastic Cup' },
  // { id: 8, name: 'Fork' },
  // { id: 9, name: 'Spoon' },
  // { id: 10, name: 'Knife' },
  // { id: 11, name: 'Recycled Stainless Steel Fork' },
  // { id: 12, name: 'Recycled Stainless Steel Spoon' },
  // { id: 13, name: 'Recycled Stainless Steel Knife' },
  // { id: 14, name: 'Polypropylene Clamshell' },
  // { id: 15, name: 'HDPE Clamshell' },
  // { id: 16, name: 'Polypropylene Plate' },
  // { id: 17, name: 'HDPE Plate' },
  // { id: 18, name: 'Ceramic Plate' },
  // { id: 19, name: 'Stainless Steel Plate' },
  // { id: 20, name: 'SAN Plastic Plate' },
  // { id: 21, name: 'Stainless Steel Food Tray' },
  // { id: 22, name: 'Melamine Plate' },
  // { id: 23, name: 'Recycled Stainless Steel Food Tray' },
  // { id: 24, name: 'Polypropylene Bowl' },
  // { id: 25, name: 'HDPE Bowl' },
  // { id: 26, name: 'Ceramic Bowl' },
  // { id: 27, name: 'Stainless Steel Bowl' },
  // { id: 28, name: 'SAN Plastic Bowl' },
  // { id: 29, name: 'Melamine Bowl' },
  // { id: 30, name: 'Melamine Ramekin' },
  // { id: 31, name: 'Ceramic Ramekin' },
  // { id: 32, name: 'Stainless Steel Ramekin' }

  { id: 0, name: 'Cup' },
  { id: 1, name: 'Mug' },
  { id: 8, name: 'Fork' },
  { id: 9, name: 'Spoon' },
  { id: 10, name: 'Knife' },
  { id: 14, name: 'Clamshell' },
  { id: 16, name: 'Plate' },
  { id: 21, name: 'Food Tray' },
  { id: 24, name: 'Bowl' },
  { id: 30, name: 'Ramekin' },
  { id: 31, name: 'Drinking Water Station' },
  { id: 32, name: 'Bowl Lid' },
  { id: 33, name: 'Pizza Box' },
  { id: 34, name: 'Hot Cup' },
  { id: 35, name: 'Hot Cup Lid' }
] as const;

export const BOTTLE_STATION_PRODUCT_ID = '171';

export const PRODUCT_TYPES_MAP = PRODUCT_TYPES.reduce(
  (acc, product) => {
    acc[product.id] = product.name;
    return acc;
  },
  {} as Record<number, string>
);
