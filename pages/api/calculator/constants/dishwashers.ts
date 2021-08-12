export const DISHWASHER_TYPES = [
  { name: "Under Counter" },
  { name: "Stationary Single Tank Door" },
  { name: "Single Tank Conveyer" },
  { name: "Multi Tank Conveyer" },
  { name: "Pot, Pan, and Utensil" },
] as const;

export const FUEL_TYPES = [{ name: "Electric" }, { name: "Gas" }] as const;

export const TEMPERATURES = [{ name: "High" }, { name: "Low" }] as const;

interface ConsumptionItem {
  type: DishwasherType;
  temperature: TemperatureType;
  energyStar: boolean;
  electric: number;
  gas: number;
  water: number;
}

export const ANNUAL_DISHWASHER_CONSUMPTION: ConsumptionItem[] = [
  {
    type: "Under Counter",
    temperature: "Low",
    energyStar: false,
    electric: 8645,
    gas: 0,
    water: 50378,
  },
  {
    type: "Under Counter",
    temperature: "Low",
    energyStar: true,
    electric: 5947,
    gas: 0,
    water: 34653,
  },
  {
    type: "Under Counter",
    temperature: "High",
    energyStar: false,
    electric: 5447,
    gas: 0,
    water: 31741,
  },
  {
    type: "Under Counter",
    temperature: "High",
    energyStar: true,
    electric: 4298,
    gas: 0,
    water: 25043,
  },

  {
    type: "Stationary Single Tank Door",
    temperature: "Low",
    energyStar: false,
    electric: 10494,
    gas: 0,
    water: 61152,
  },
  {
    type: "Stationary Single Tank Door",
    temperature: "Low",
    energyStar: true,
    electric: 5897,
    gas: 0,
    water: 34362,
  },
  {
    type: "Stationary Single Tank Door",
    temperature: "High",
    energyStar: false,
    electric: 10130,
    gas: 0,
    water: 37565,
  },
  {
    type: "Stationary Single Tank Door",
    temperature: "High",
    energyStar: true,
    electric: 6989,
    gas: 0,
    water: 25917,
  },

  {
    type: "Single Tank Conveyer",
    temperature: "Low",
    energyStar: false,
    electric: 6547,
    gas: 0,
    water: 38147,
  },
  {
    type: "Single Tank Conveyer",
    temperature: "Low",
    energyStar: true,
    electric: 3948,
    gas: 0,
    water: 23005,
  },
  {
    type: "Single Tank Conveyer",
    temperature: "High",
    energyStar: false,
    electric: 6832,
    gas: 0,
    water: 25334,
  },
  {
    type: "Single Tank Conveyer",
    temperature: "High",
    energyStar: true,
    electric: 5497,
    gas: 0,
    water: 20384,
  },

  {
    type: "Multi Tank Conveyer",
    temperature: "Low",
    energyStar: false,
    electric: 5197,
    gas: 0,
    water: 30285,
  },
  {
    type: "Multi Tank Conveyer",
    temperature: "Low",
    energyStar: true,
    electric: 2699,
    gas: 0,
    water: 15725,
  },
  {
    type: "Multi Tank Conveyer",
    temperature: "High",
    energyStar: false,
    electric: 7617,
    gas: 0,
    water: 28246,
  },
  {
    type: "Multi Tank Conveyer",
    temperature: "High",
    energyStar: true,
    electric: 4241,
    gas: 0,
    water: 15725,
  },

  {
    type: "Pot, Pan, and Utensil",
    temperature: "High",
    energyStar: false,
    electric: 5497,
    gas: 0,
    water: 20384,
  },
  {
    type: "Pot, Pan, and Utensil",
    temperature: "High",
    energyStar: true,
    electric: 4555,
    gas: 0,
    water: 16890,
  },
];

export type DishwasherType = typeof DISHWASHER_TYPES[number]["name"];
export type FuelType = typeof FUEL_TYPES[number]["name"];
export type TemperatureType = typeof TEMPERATURES[number]["name"];
