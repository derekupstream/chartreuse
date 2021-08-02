
export const DISHWASHER_TYPES = [
  { name: "Under Counter" },
  { name: "Stationary Single Tank Door" },
  { name: "Single Tank Conveyer" },
  { name: "Multi Tank Conveyer" },
  { name: "Pot, Pan, and Utensil" }
] as const;

export const FUEL_TYPES = [
  { name: "Electric" },
  { name: "Gas" }
];

export const TEMPERATURES = [
  { name: "High" },
  { name: "Low" }
];

export type DishwasherType = typeof DISHWASHER_TYPES[number]["name"];
export type FuelType = typeof FUEL_TYPES[number]["name"];
export type TemperatureType = typeof TEMPERATURES[number]["name"];
