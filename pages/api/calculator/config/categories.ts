
export const SINGLE_USE_CATEGORIES = [
  { id: 0, name: "Beverage Cups & Lids" },
  { id: 1, name: "Takeout Containers & Lids" },
  { id: 2, name: "Condiment Packets" },
  { id: 3, name: "Plates and Bowls (Dinnerware)" },
  { id: 4, name: "Food Cups & Lids" },
  { id: 5, name: "Food Trays" },
  { id: 6, name: "Food Wraps" },
  { id: 7, name: "Napkins" },
  { id: 8, name: "Beverage Accessories" },
  { id: 9, name: "Straws and Stirrers" },
  { id: 10, name: "Utensils" },
  { id: 11, name: "Tooth Picks" }
] as const;

export type SingleUseCategory = typeof SINGLE_USE_CATEGORIES[number]['id'];

export const REUSABLE_CATEGORIES = [
  { id: 0, name: "Dinnerware" },
  { id: 1, name: "Beverageware" },
  { id: 2, name: "Flatware" },
  { id: 3, name: "Dinnerware Accessories" },
  { id: 4, name: "Displayware" },
  { id: 5, name: "Family Style Tableware" },
  { id: 6, name: "Table Service Accessories" },
  { id: 7, name: "Oven to Table Dinnerware" },
  { id: 8, name: "Other" }
] as const;

export type ReusableCategory = typeof REUSABLE_CATEGORIES[number]['id'];