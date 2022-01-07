export const WASTE_STREAMS = ['Garbage', 'Recycling', 'Organics', 'Additional Charges'] as const
export const SERVICE_TYPES = ['Bin', 'Cart', 'Roll Off Bin', 'Additional Charges'] as const

export type WasteStream = typeof WASTE_STREAMS[number]
export type ServiceType = typeof SERVICE_TYPES[number]
