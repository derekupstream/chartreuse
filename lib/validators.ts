import { ADDITIONAL_COSTS } from 'internal-api/calculator/constants/additional-costs'
import { FREQUENCIES } from 'internal-api/calculator/constants/frequency'
import { LABOR_CATEGORIES } from 'internal-api/calculator/constants/labor-categories'
import { SERVICE_TYPES, WASTE_STREAMS } from 'internal-api/calculator/constants/waste-hauling'
import { z } from 'zod'

export const CreateAdditionalCostValidator = z.object({
  projectId: z.string().nonempty(),
  categoryId: z.string().nonempty().refine(validateCategory(ADDITIONAL_COSTS), {
    message: 'invalid value for frequency',
  }),
  frequency: z.string().nonempty().refine(validateFrequency(), {
    message: 'invalid value for frequency',
  }),
  cost: z.number(),
})

export const CreateWasteHaulingCostValidator = z.object({
  projectId: z.string().nonempty(),
  monthlyCost: z.number(),
  serviceType: z.string().nonempty().refine(isOneOf(SERVICE_TYPES), {
    message: 'invalid value for serviceType',
  }),
  wasteStream: z.string().nonempty().refine(isOneOf(WASTE_STREAMS), {
    message: 'invalid value for wasteStream',
  }),
  description: z.string(),
})

export const CreateLaborCostValidator = z.object({
  projectId: z.string().nonempty(),
  categoryId: z.string().nonempty().refine(validateCategory(LABOR_CATEGORIES)),
  description: z.string(),
  frequency: z.string().nonempty().refine(validateFrequency(), {
    message: 'invalid value for frequency',
  }),
  cost: z.number(),
})

export const DishWasherValidator = z.object({
  additionalRacksPerDay: z.number().nonnegative(),
  boosterWaterHeaterFuelType: z.string(),
  buildingWaterHeaterFuelType: z.string().nonempty(),
  energyStarCertified: z.boolean(),
  operatingDays: z.number().nonnegative(),
  projectId: z.string().nonempty(),
  temperature: z.string().nonempty(),
  type: z.string().nonempty(),
})

function validateCategory(categories: readonly { id: string }[]) {
  return isOneOf(categories.map(f => f.id))
}

function validateFrequency() {
  return isOneOf(FREQUENCIES.map(f => f.name))
}

function isOneOf(values: readonly string[]) {
  return function (value: string) {
    return values.includes(value)
  }
}
