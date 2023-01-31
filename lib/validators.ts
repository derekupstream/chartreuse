import { z } from 'zod';

import { FREQUENCIES_WITH_ONE_TIME } from 'lib/calculator/constants/frequency';
import { LABOR_CATEGORIES } from 'lib/calculator/constants/labor-categories';
import { OTHER_EXPENSES, OTHER_EXPENSES_FREQUENCIES } from 'lib/calculator/constants/other-expenses';
import { SERVICE_TYPES, WASTE_STREAMS } from 'lib/calculator/constants/waste-hauling';

const serviceTypeList = SERVICE_TYPES.map(f => f.type);

export const CreateOtherExpenseValidator = z.object({
  projectId: z.string().nonempty(),
  categoryId: z.string().nonempty().refine(validateCategory(OTHER_EXPENSES), {
    message: 'invalid value for category'
  }),
  frequency: z.string().nonempty().refine(validateFrequency(OTHER_EXPENSES_FREQUENCIES), {
    message: 'invalid value for frequency'
  }),
  cost: z.number()
});

export const CreateWasteHaulingCostValidator = z.object({
  projectId: z.string().nonempty(),
  monthlyCost: z.number(),
  serviceType: z.string().nonempty().refine(isOneOf(serviceTypeList), {
    message: 'invalid value for serviceType'
  }),
  wasteStream: z.string().nonempty().refine(isOneOf(WASTE_STREAMS), {
    message: 'invalid value for wasteStream'
  }),
  description: z.string()
});

export const CreateLaborCostValidator = z.object({
  projectId: z.string().nonempty(),
  categoryId: z.string().nonempty().refine(validateCategory(LABOR_CATEGORIES)),
  description: z.string(),
  frequency: z.string().nonempty().refine(validateFrequency(FREQUENCIES_WITH_ONE_TIME), {
    message: 'invalid value for frequency'
  }),
  cost: z.number()
});

export const DishWasherValidator = z.object({
  racksPerDay: z.number().nonnegative(),
  newRacksPerDay: z.number().nonnegative(),
  boosterWaterHeaterFuelType: z.string(),
  buildingWaterHeaterFuelType: z.string().nonempty(),
  energyStarCertified: z.boolean(),
  operatingDays: z.number().nonnegative(),
  newOperatingDays: z.number().nonnegative(),
  projectId: z.string().nonempty(),
  temperature: z.string().nonempty(),
  type: z.string().nonempty()
});

function validateCategory(categories: readonly { id: string }[]) {
  return isOneOf(categories.map(f => f.id));
}

function validateFrequency(frequencies: readonly { name: string }[]) {
  return isOneOf(frequencies.map(f => f.name));
}

function isOneOf(values: readonly string[]) {
  return function (value: string) {
    return values.includes(value);
  };
}
