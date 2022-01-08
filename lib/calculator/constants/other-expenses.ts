export const OTHER_EXPENSES = [
  {
    id: '1',
    name: 'Equipment',
    description:
      'Machine purchase, lease, and installation. Dish racks, drying racks, shelving, tables, storage ventilation equipment, or any other durable equipment purchased specifically to suppor the reusable program.',
  },
  {
    id: '2',
    name: 'Supplies',
    description: 'Detergent, rinse agents, sanitizer, gloves, and other neccessary supplies purchased repeatedly.',
  },
  {
    id: '3',
    name: 'Vendors',
    description: 'Dishwasher external vendors, payments to third-party dishwashing service, linen service, etc.',
  },
  {
    id: '4',
    name: 'Renovation',
    description: 'Cost of any renovations required to accomodate washing and serving reusable products.',
  },
  {
    id: '5',
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
  { name: 'Equipment', id: '1' },
  { name: 'Supplies', id: '2' },
  { name: 'Vendors', id: '3' },
  { name: 'Renovation', id: '4' },
  { name: 'Other', id: '5' },
]
