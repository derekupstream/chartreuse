/**
 * Lets the Databases area supply the material factors the calculator uses, instead of
 * the values compiled into `constants/materials.ts`.
 *
 * How it works: `MATERIAL_MAP` is exposed as a Proxy that consults this registry first,
 * so every existing call site picks up an override without changing. Overrides are keyed
 * by material NAME (the stable identifier a spreadsheet carries), not by numeric id.
 *
 * Deliberate constraints:
 *  - Only fields actually supplied are overridden; anything missing keeps the code value.
 *  - A material not present in an override table is untouched, so a partial table is safe.
 *  - Overrides are process-global, matching the fact that factors are global rather than
 *    per-organisation. They are refreshed on a TTL by `loadMaterialFactorOverrides()`.
 *  - If nothing is loaded, behaviour is byte-identical to the compiled constants.
 */

export type MaterialFactorOverride = {
  mtco2ePerLb?: number;
  waterUsageGalPerLb?: number;
  /** Which database supplied this, for provenance in the UI */
  source: string;
};

const overridesByName = new Map<string, MaterialFactorOverride>();
let lastLoadedAt: number | null = null;

const key = (name: string) => name.trim().toLowerCase();

export function setMaterialFactorOverrides(entries: (MaterialFactorOverride & { name: string })[]): void {
  overridesByName.clear();
  for (const entry of entries) {
    if (!entry?.name?.trim()) continue;
    const hasValue = Number.isFinite(entry.mtco2ePerLb) || Number.isFinite(entry.waterUsageGalPerLb);
    if (!hasValue) continue;
    overridesByName.set(key(entry.name), {
      mtco2ePerLb: Number.isFinite(entry.mtco2ePerLb) ? entry.mtco2ePerLb : undefined,
      waterUsageGalPerLb: Number.isFinite(entry.waterUsageGalPerLb) ? entry.waterUsageGalPerLb : undefined,
      source: entry.source
    });
  }
  lastLoadedAt = Date.now();
}

export function clearMaterialFactorOverrides(): void {
  overridesByName.clear();
  lastLoadedAt = null;
}

export function getMaterialFactorOverride(name: string): MaterialFactorOverride | undefined {
  return overridesByName.get(key(name));
}

export function hasMaterialFactorOverrides(): boolean {
  return overridesByName.size > 0;
}

export function overrideStatus(): { count: number; lastLoadedAt: number | null; names: string[] } {
  return { count: overridesByName.size, lastLoadedAt, names: Array.from(overridesByName.keys()) };
}

type Material = { id: number; name: string; mtco2ePerLb: number; waterUsageGalPerLb?: number };

/** Returns the material with any override applied. Never mutates the input. */
export function applyOverride<T extends Material>(material: T): T {
  const override = overridesByName.get(key(material.name));
  if (!override) return material;
  return {
    ...material,
    mtco2ePerLb: override.mtco2ePerLb ?? material.mtco2ePerLb,
    waterUsageGalPerLb: override.waterUsageGalPerLb ?? material.waterUsageGalPerLb
  };
}
