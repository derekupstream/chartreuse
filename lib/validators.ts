import { z } from 'zod'

export const CreateAdditionalCostValidator = z.object({
  projectId: z.string().nonempty(),
  categoryId: z.string().nonempty(),
  frequency: z.string().nonempty(),
  cost: z.number(),
})

export const CreateWasteHaulingCostValidator = z.object({
  projectId: z.string().nonempty(),
  categoryId: z.string().nonempty(),
  frequency: z.string().nonempty(),
  cost: z.number(),
})

export const CreateLaborCostValidator = z.object({
  projectId: z.string().nonempty(),
  categoryId: z.string().nonempty(),
  describe: z.string(),
  frequency: z.string().nonempty(),
  cost: z.number(),
})

export const DishWasherValidator = z.object({
  additionalRacksPerDay: z.number().nonnegative(),
  boosterWaterHeaterFuelType: z.string().nonempty(),
  buildingWaterHeaterFuelType: z.string().nonempty(),
  energyStarCertified: z.boolean(),
  operatingDays: z.number().nonnegative(),
  projectId: z.string().nonempty(),
  temperature: z.string().nonempty(),
  type: z.string().nonempty(),
})
