export const ADDITIONAL_COSTS = [
  {
    name: "Dish Machine",
    description: "Machine purchase, lease, and installation.",
  },
  {
    name: "Dishwashing Equipment",
    description:
      "Dish racks, drying racks, shelving, tables, storage ventilation equipment, or any other durable equipment purchased specifically to suppor the reusable program.",
  },
  {
    name: "Dishwashing Labor",
    description:
      "Additional dishwashing labor costs incurred specifically related to the transition from disposable to reusable products.",
  },
  {
    name: "Dishwashing Supplies",
    description:
      "Detergent, rinse agents, sanitizer, gloves, and other neccessary supplies purchased repeatedly.",
  },
  {
    name: "Dishwashing Service",
    description: "Payments to third-party dishwashing service.",
  },
  {
    name: "Construction/Renovation",
    description:
      "Cost of any renovations required to accomodate washing and serving reusable products.",
  },
  {
    name: "Marketing",
    description:
      "Additional marketing dollars related to reusable program that would otherwise not have been spent.",
  },
  {
    name: "Other",
    description:
      "Please use this for costs that do not fit into the other categories and add details in the description field.",
  },
] as const;

export type AdditionalCostType = typeof ADDITIONAL_COSTS[number]["name"];

export const ADDITIONAL_COST_FREQUENCIES = [
  { name: "One Time", annualOccurrence: 0 },
  { name: "Daily", annualOccurence: 365 },
  { name: "Weekly", annualOccurence: 52 },
  { name: "Monthly", annualOccurence: 12 },
  { name: "Annually", annualOccurence: 1 },
];
