import { round } from '../utils'

export const POUND_TO_KILOGRAM = 0.453592
export const POUND_TO_TONNE = 0.000453592 // metric tons

// us tons
export function poundsToTons(number: number) {
  return round(number / 2000, 2)
}
