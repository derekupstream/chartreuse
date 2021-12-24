export const OTHER_EXPENSES = [
  {
    id: '1',
    name: 'Dish Machine',
    description: 'Machine purchase, lease, and installation.',
  },
  {
    id: '2',
    name: 'Dishwashing Equipment',
    description: 'Dish racks, drying racks, shelving, tables, storage ventilation equipment, or any other durable equipment purchased specifically to suppor the reusable program.',
  },
  {
    id: '3',
    name: 'Dishwashing Labor',
    description: 'Additional dishwashing labor costs incurred specifically related to the transition from disposable to reusable products.',
  },
  {
    id: '4',
    name: 'Dishwashing Supplies',
    description: 'Detergent, rinse agents, sanitizer, gloves, and other neccessary supplies purchased repeatedly.',
  },
  {
    id: '5',
    name: 'Dishwashing Service',
    description: 'Payments to third-party dishwashing service.',
  },
  {
    id: '6',
    name: 'Construction/Renovation',
    description: 'Cost of any renovations required to accomodate washing and serving reusable products.',
  },
  {
    id: '7',
    name: 'Marketing',
    description: 'Additional marketing dollars related to reusable program that would otherwise not have been spent.',
  },
  {
    id: '8',
    name: 'Other',
    description: 'Please use this for costs that do not fit into the other categories and add details in the description field.',
  },
] as const

export type OtherExpenseCategory = typeof OTHER_EXPENSES[number]['id']

export const OTHER_EXPENSES_FREQUENCIES = [
  { name: 'One Time', annualOccurrence: 0 },
  { name: 'Daily', annualOccurrence: 365 },
  { name: 'Weekly', annualOccurrence: 52 },
  { name: 'Monthly', annualOccurrence: 12 },
  { name: 'Annually', annualOccurrence: 1 },
]

export type AdditionalCostCategories = typeof OTHER_EXPENSES_CATEGORIES[number]

export const OTHER_EXPENSES_CATEGORIES = [
  { name: 'Additional equipment', id: '1' },
  { name: 'Consumable supplies', id: '2' },
  { name: 'Consumable supplies', id: '3' },
  { name: 'Site renovation', id: '4' },
  { name: 'Other', id: '5' },
]
