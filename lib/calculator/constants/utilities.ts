const WATER_NATIONAL_AVERAGE = 6.98

// Commercial electric rate ($/kWh)	Commercial gas rate ($/therm)
// U.S. average	$0.10	$0.92

export const STATES = [
  { name: 'Alabama', electric: 0.11, gas: 0.92 },
  { name: 'Alaska', electric: 0.17, gas: 0.92 },
  { name: 'Arizona', electric: 0.09, gas: 0.92 },
  { name: 'Arkansas', electric: 0.07, gas: 0.92 },
  { name: 'California', electric: 0.13, gas: 0.92 },
  { name: 'Colorado', electric: 0.1, gas: 0.92 },
  { name: 'Connecticut', electric: 0.16, gas: 0.92 },
  { name: 'Delaware', electric: 0.12, gas: 0.92 },
  { name: 'District of Columbia', electric: 0.13, gas: 0.92 },
  { name: 'Florida', electric: 0.1, gas: 0.92 },
  { name: 'Georgia', electric: 0.11, gas: 0.92 },
  { name: 'Hawaii', electric: 0.35, gas: 0.92 },
  { name: 'Idaho', electric: 0.07, gas: 0.92 },
  { name: 'Illinois', electric: 0.08, gas: 0.92 },
  { name: 'Indiana', electric: 0.1, gas: 0.92 },
  { name: 'Iowa', electric: 0.08, gas: 0.92 },
  { name: 'Kansas', electric: 0.09, gas: 0.92 },
  { name: 'Kentucky', electric: 0.09, gas: 0.92 },
  { name: 'Louisiana', electric: 0.09, gas: 0.92 },
  { name: 'Maine', electric: 0.14, gas: 0.92 },
  { name: 'Maryland', electric: 0.12, gas: 0.92 },
  { name: 'Massachusetts', electric: 0.15, gas: 0.92 },
  { name: 'Michigan', electric: 0.11, gas: 0.92 },
  { name: 'Minnesota', electric: 0.09, gas: 0.92 },
  { name: 'Mississippi', electric: 0.11, gas: 0.92 },
  { name: 'Missouri', electric: 0.08, gas: 0.92 },
  { name: 'Montana', electric: 0.09, gas: 0.92 },
  { name: 'Nebraska', electric: 0.08, gas: 0.92 },
  { name: 'Nevada', electric: 0.09, gas: 0.92 },
  { name: 'New Hampshire', electric: 0.15, gas: 0.92 },
  { name: 'New Jersey', electric: 0.14, gas: 0.92 },
  { name: 'New Mexico', electric: 0.1, gas: 0.92 },
  { name: 'New York', electric: 0.17, gas: 0.92 },
  { name: 'North Carolina', electric: 0.09, gas: 0.92 },
  { name: 'North Dakota', electric: 0.08, gas: 0.92 },
  { name: 'Ohio', electric: 0.1, gas: 0.92 },
  { name: 'Oklahoma', electric: 0.08, gas: 0.92 },
  { name: 'Oregon', electric: 0.09, gas: 0.92 },
  { name: 'Pennsylvania', electric: 0.1, gas: 0.92 },
  { name: 'Rhode Island', electric: 0.16, gas: 0.92 },
  { name: 'South Carolina', electric: 0.1, gas: 0.92 },
  { name: 'South Dakota', electric: 0.08, gas: 0.92 },
  { name: 'Tennessee', electric: 0.1, gas: 0.92 },
  { name: 'Texas', electric: 0.08, gas: 0.92 },
  { name: 'Utah', electric: 0.08, gas: 0.92 },
  { name: 'Vermont', electric: 0.14, gas: 0.92 },
  { name: 'Virginia', electric: 0.08, gas: 0.92 },
  { name: 'Washington', electric: 0.08, gas: 0.92 },
  { name: 'West Virginia', electric: 0.08, gas: 0.92 },
  { name: 'Wisconsin', electric: 0.11, gas: 0.92 },
  { name: 'Wyoming', electric: 0.09, gas: 0.92 },
] as const

export type USState = typeof STATES[number]['name']

export type UtilityRates = { gas: number; electric: number; water: number }

export function getUtilitiesByState(state: USState): UtilityRates {
  const localRates = STATES.find(s => s.name === state)
  if (!localRates) {
    throw new Error(`No utilities rates for state ${state}`)
  }
  return {
    ...localRates,
    water: WATER_NATIONAL_AVERAGE,
  }
}
