// export const CALCULATOR_STEPS = [
//   { path: '/single-use-items', title: 'Single-Use purchasing' },
//   { path: '/reusable-items', title: 'Reusables purchasing' },
//   { path: '/additional-costs', title: 'Additional costs' },
//   { path: '/projections', title: 'Savings projections' },
//   { path: '/purchasing-updates', title: 'Purchasing updates' }
// ];
export const CALCULATOR_STEPS = [
  { path: '/projections', title: 'Dashboard', width: '17%' },
  { path: '/single-use-items', title: 'Single-Use purchasing', width: '23%' },
  { path: '/reusable-items', title: 'Reusables purchasing', width: '23%' },
  { path: '/dishwashing', title: 'Dishwashing', width: '17%' },
  { path: '/additional-costs', title: 'Additional costs', width: '20%' }
];

export type ProjectPath = (typeof CALCULATOR_STEPS)[number]['path'];
