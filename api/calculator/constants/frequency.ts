export const FREQUENCIES = [
  { name: 'Daily', annualOccurence: 365 },
  { name: 'Weekly', annualOccurence: 52 },
  { name: 'Monthly', annualOccurence: 12 },
  { name: 'Annually', annualOccurence: 1 },
] as const

export type Frequency = typeof FREQUENCIES[number]['name']

export function getAnnualOccurence(frequency: Frequency) {
  return FREQUENCIES.find(f => f.name === frequency)!.annualOccurence
}
