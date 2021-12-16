export const LABOR_CATEGORIES = [
  { id: 0, name: 'Dishwashing staff' },
  { id: 1, name: 'Janitorial' },
  { id: 2, name: 'Procurement' },
  { id: 3, name: 'Other staff' },
] as const

export type LaborCostCategory = typeof LABOR_CATEGORIES[number]['id']
