import { CALCULATOR_STEPS, StepType } from './steps';
import { ProjectCategory } from '@prisma/client';

type Category = {
  type: ProjectCategory;
  name: string;
  steps: (typeof CALCULATOR_STEPS)[StepType];
  productDatabase: 'eugene' | 'default';
  dishwashingUsage: 'fixed' | 'simple' | 'advanced';
  projections: 'default' | 'environmental_only';
};

export const categories: Category[] = [
  {
    type: ProjectCategory.default,
    name: 'Standard',
    steps: CALCULATOR_STEPS.advanced,
    productDatabase: 'default',
    dishwashingUsage: 'advanced',
    projections: 'default'
  },
  {
    type: ProjectCategory.event,
    name: 'Event',
    steps: CALCULATOR_STEPS.simple,
    productDatabase: 'default',
    dishwashingUsage: 'simple',
    projections: 'environmental_only'
  },
  {
    type: ProjectCategory.eugene,
    name: 'Eugene',
    steps: CALCULATOR_STEPS.simple,
    productDatabase: 'eugene',
    dishwashingUsage: 'fixed',
    projections: 'environmental_only'
  }
];

export const categoryByType = (type: ProjectCategory) => {
  const category = categories.find(category => category.type === type);

  if (!category) {
    throw new Error(`Category type "${type}" not found`);
  }

  return category;
};

export function hasAccessToCategory(org: { isUpstream: boolean }) {
  return org.isUpstream;
}
