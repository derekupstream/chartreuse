export type ImpactFactors = {
  co2AvoidedKg: number;
  waterSavedGal: number;
  wasteDivertedLbs: number;
};

// Per-unit impact when one reusable item replaces one single-use item
// Values represent avoided impact (net: single-use avoided minus washing cost)
export const RSP_IMPACT_FACTORS: Record<string, ImpactFactors> = {
  plate: { co2AvoidedKg: 0.014, waterSavedGal: 0.5, wasteDivertedLbs: 0.04 },
  cup: { co2AvoidedKg: 0.009, waterSavedGal: 0.3, wasteDivertedLbs: 0.02 },
  bowl: { co2AvoidedKg: 0.018, waterSavedGal: 0.6, wasteDivertedLbs: 0.05 },
  container: { co2AvoidedKg: 0.022, waterSavedGal: 0.7, wasteDivertedLbs: 0.06 },
  utensils: { co2AvoidedKg: 0.004, waterSavedGal: 0.1, wasteDivertedLbs: 0.01 },
  fork: { co2AvoidedKg: 0.003, waterSavedGal: 0.08, wasteDivertedLbs: 0.008 },
  knife: { co2AvoidedKg: 0.003, waterSavedGal: 0.08, wasteDivertedLbs: 0.008 },
  spoon: { co2AvoidedKg: 0.003, waterSavedGal: 0.08, wasteDivertedLbs: 0.008 },
  tray: { co2AvoidedKg: 0.03, waterSavedGal: 0.9, wasteDivertedLbs: 0.08 },
  glass: { co2AvoidedKg: 0.011, waterSavedGal: 0.35, wasteDivertedLbs: 0.025 },
  default: { co2AvoidedKg: 0.012, waterSavedGal: 0.4, wasteDivertedLbs: 0.03 }
};

export function calcImpact(
  reusableType: string,
  outWarehouseEvents: number
): { co2AvoidedKg: number; waterSavedGallons: number; wasteDivertedLbs: number } {
  const factors = RSP_IMPACT_FACTORS[reusableType.toLowerCase()] ?? RSP_IMPACT_FACTORS.default;
  return {
    co2AvoidedKg: factors.co2AvoidedKg * outWarehouseEvents,
    waterSavedGallons: factors.waterSavedGal * outWarehouseEvents,
    wasteDivertedLbs: factors.wasteDivertedLbs * outWarehouseEvents
  };
}
