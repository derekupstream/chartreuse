export const PRODUCT_TYPES = [
  { id: 0, name: 'Bowl' },
  { id: 1, name: 'Box' },
  { id: 2, name: 'Chopsticks' },
  { id: 3, name: 'Clamshell' },
  { id: 4, name: 'Cold Cup' },
  { id: 5, name: 'Cold Cup Lid' },
  { id: 7, name: 'Spoon' },
  { id: 9, name: 'Creamer' },
  { id: 10, name: 'Dinner Napkin' },
  { id: 12, name: 'Fork' },
  // { id: 10, name: 'Dinner Napkin (Single Ply)' },
  // { id: 11, name: 'Dinner Napkin (Two Ply)' },
  // { id: 12, name: 'Fork (Heavy Weight)' },
  // { id: 13, name: 'Fork (Medium Weight)' },
  { id: 14, name: 'Food Tray' },
  { id: 15, name: 'Hot Cup' },
  { id: 16, name: 'Hot Cup Lid' },
  { id: 17, name: 'Ketchup' },
  // { id: 18, name: 'Knife (Heavy Weight)' },
  { id: 19, name: 'Mayonaise' },
  { id: 20, name: 'Mustard' },
  { id: 21, name: 'Napkin' },
  // { id: 21, name: 'Napkin (Single Ply)' },
  { id: 22, name: 'Pepper' },
  { id: 23, name: 'Plate' },
  { id: 24, name: 'Portion Cup' },
  { id: 25, name: 'Portion Cup Lid' },
  { id: 26, name: 'Salt Packet' },
  { id: 27, name: 'Sleeve' },
  { id: 28, name: 'Soup or Ice Cream Cup' },
  { id: 29, name: 'Soup or Ice Cream Cup Lid' },
  { id: 30, name: 'Soup Spoon' },
  { id: 31, name: 'Soy Sauce' },
  { id: 32, name: 'Stir Stick' },
  { id: 33, name: 'Straw' },
  { id: 34, name: 'Sugar' },
  { id: 35, name: 'Tasting Spoon' },
  { id: 36, name: 'Teaspoon' },
  { id: 37, name: 'Tooth Picks' },
  { id: 38, name: 'Wrap (Wax Lined Paper)' },
  { id: 39, name: 'Knife' },
  // { id: 39, name: 'Knife (Medium Weight)' },
  { id: 40, name: 'Bag' }, // added for Taco Bell,
  { id: 41, name: 'Drink Tray' }, // added for Taco Bell
  { id: 42, name: 'Misc.' } // added for Taco Bell
] as const;

export const PRODUCT_TYPES_MAP = PRODUCT_TYPES.reduce(
  (acc, product) => {
    acc[product.id] = product.name;
    return acc;
  },
  {} as Record<number, string>
);
