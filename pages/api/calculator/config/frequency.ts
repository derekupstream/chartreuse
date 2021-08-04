export const FREQUENCIES = [
  { name: "Daily", annualOccurence: 365 },
  { name: "Weekly", annualOccurence: 52 },
  { name: "Monthly", annualOccurence: 12 },
  { name: "Annually", annualOccurence: 1 },
];

export type Frequency = typeof FREQUENCIES[number]["name"];
