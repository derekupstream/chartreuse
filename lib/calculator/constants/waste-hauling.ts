export const WASTE_STREAMS = ['Garbage', 'Recycling', 'Organics', 'Additional Charges'] as const;
export const SERVICE_TYPES = [
  {
    type: 'Bin',
    description:
      'A large collection container or dumpster that is lifted and emptied into a truck and returned to its original location. '
  },
  { type: 'Cart', description: 'Roll container, moved by hand for alley or curbside service' },
  {
    type: 'Roll Off Bin',
    description: 'A large open container or dumpster, that is hauled away entirely at each pick up. '
  },
  { type: 'Additional Charges', description: '' }
] as const;

export type WasteStream = (typeof WASTE_STREAMS)[number];
export type ServiceType = (typeof SERVICE_TYPES)[number]['type'];
