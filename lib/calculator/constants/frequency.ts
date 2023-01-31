export const FREQUENCIES = [
  { name: 'Daily', annualOccurrence: 365 },
  { name: 'Weekly', annualOccurrence: 52 },
  { name: 'Monthly', annualOccurrence: 12 },
  { name: 'Annually', annualOccurrence: 1 }
] as const;

export const FREQUENCIES_WITH_ONE_TIME = [{ name: 'One Time', annualOccurrence: 0 }, ...FREQUENCIES];

export type Frequency = (typeof FREQUENCIES)[number]['name'];

export function getannualOccurrence(frequency: Frequency) {
  return FREQUENCIES.find(f => f.name === frequency)!.annualOccurrence;
}
