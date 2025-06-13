export type StepType = 'simple' | 'advanced';

export const CALCULATOR_STEPS: Record<StepType, { path: string; title: string; width: string }[]> = {
  simple: [
    { path: '/projections', title: 'Dashboard', width: '20%' },
    { path: '/foodware', title: 'Foodware', width: '20%' },
    { path: '/usage', title: 'Usage', width: '20%' },
    { path: '/dishwashing', title: 'Dishwashing', width: '20%' },
    { path: '/transportation', title: 'Transportation', width: '20%' }
  ],
  advanced: [
    { path: '/projections', title: 'Dashboard', width: '17%' },
    { path: '/single-use-items', title: 'Single-Use purchasing', width: '23%' },
    { path: '/reusable-items', title: 'Reusables purchasing', width: '23%' },
    { path: '/dishwashing', title: 'Dishwashing', width: '17%' },
    { path: '/additional-costs', title: 'Additional costs', width: '20%' }
  ]
};

export type ProjectPath = (typeof CALCULATOR_STEPS)[StepType][number]['path'];
