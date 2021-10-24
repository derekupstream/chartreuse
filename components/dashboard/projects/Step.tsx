import Setup from './steps/setup'
import SingleUsePurchasing from './steps/single-use'
import { DashboardUser } from 'components/dashboard'
import { Project } from '@prisma/client'

/* eslint-disable react/display-name */
export const stepsMap = {
  SETUP: Setup,
  SINGLE_USE: SingleUsePurchasing,
  RESUSABLE: () => <div>Reusable purchasing</div>,
  ADDITIONAL_COSTS: () => <div>Additional costs</div>,
  SAVING_PROJECTIONS: () => <div>Saving projections</div>,
}

const STEPS = Object.keys(stepsMap) as (keyof typeof stepsMap)[]

export const getStepByIndex = (index: number) => {
  return STEPS[index]
}

export const getStepIndex = (step: string) => {
  return STEPS.findIndex(s => s === step)
}

export type StepProps = {
  step: keyof typeof stepsMap
  user: DashboardUser
  project?: Project
  onComplete: (id?: string) => void
}

const Step = ({ step, user, ...props }: StepProps) => {
  const StepComponent = stepsMap[step as keyof typeof stepsMap]

  // @ts-ignore - this is a hack because project is sometimes required, sometimes not
  return StepComponent ? <StepComponent {...props} user={user} /> : null
}

export default Step
