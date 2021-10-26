import { z } from 'zod'

export const CreateAdditionalCostValidator = z.object({
  projectId: z.string().nonempty(),
  categoryId: z.string().nonempty(),
  frequency: z.string().nonempty(),
  cost: z.number(),
})
