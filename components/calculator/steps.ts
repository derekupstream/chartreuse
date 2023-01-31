export const CALCULATOR_STEPS = [
  { path: '/setup', title: 'Project settings' },
  { path: '/single-use-items', title: 'Single-Use purchasing' },
  { path: '/reusable-items', title: 'Reusables purchasing' },
  { path: '/additional-costs', title: 'Additional costs' },
  { path: '/projections', title: 'Savings projections' },
  { path: '/purchasing-updates', title: 'Purchasing updates' }
];

export type ProjectPath = (typeof CALCULATOR_STEPS)[number]['path'];
