
export const DISHWASHER_TYPES = [
  { name: 'Under Counter' },
  { name: 'Stationary Single Tank Door' },
  { name: 'Single Tank Conveyer' },
  { name: 'Multi Tank Conveyer' },
  { name: 'Pot, Pan, and Utensil' }
] as const;

export interface DishWasher {
  type: typeof DISHWASHER_TYPES[number]['name'];
}