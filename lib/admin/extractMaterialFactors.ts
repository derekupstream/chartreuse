/**
 * Pulls material factors out of a product table.
 *
 * Reference spreadsheets usually carry the factors denormalised onto every product
 * row (each row repeats its material's GHG and water factor, typically via a lookup).
 * That is convenient to author but easy to get wrong: one mis-filled row gives a
 * material two different factor values. So this extractor groups by material and
 * reports disagreement rather than silently taking the first or last value.
 *
 * A real example this catches: in the data scientist's July test sheet the ketchup's
 * aluminium lining carried the LDPE factor (0.000915 instead of 0.003755).
 */

export type FactorColumnGuess = {
  materialColumn?: string;
  ghgColumn?: string;
  waterColumn?: string;
};

export type ExtractedMaterial = {
  material: string;
  ghg: number | null;
  water: number | null;
  /** How many product rows referenced this material */
  rowCount: number;
  /** Distinct values seen, when rows disagree */
  ghgConflicts: number[];
  waterConflicts: number[];
  hasConflict: boolean;
};

export type ExtractionResult = {
  materials: ExtractedMaterial[];
  conflictCount: number;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Best-effort guess at which columns hold the material name and its factors. */
export function guessFactorColumns(headers: string[]): FactorColumnGuess {
  const find = (predicate: (h: string, n: string) => boolean) => headers.find(h => predicate(h, norm(h)));

  const materialColumn =
    find((_h, n) => n.includes('primarymaterial') && !n.includes('weight') && !n.includes('original')) ??
    find((_h, n) => n === 'material' || n.includes('materialdescription')) ??
    find((_h, n) => n.includes('material') && !n.includes('weight') && !n.includes('secondary'));

  const ghgColumn = find(
    (_h, n) =>
      (n.includes('ghg') || n.includes('co2') || n.includes('mtco2e') || n.includes('emission')) &&
      !n.includes('total') &&
      !n.includes('secondary') &&
      !n.includes('cardboard') &&
      !n.includes('box')
  );

  const waterColumn = find(
    (_h, n) =>
      n.includes('water') &&
      !n.includes('total') &&
      !n.includes('secondary') &&
      !n.includes('cardboard') &&
      !n.includes('usage') &&
      !n.includes('station')
  );

  return { materialColumn, ghgColumn, waterColumn };
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const cleaned = String(v).replace(/[^0-9.eE+-]/g, '');
  if (cleaned.trim() === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Values are equal if they agree to ~6 significant figures — tolerates spreadsheet rounding. */
function sameValue(a: number, b: number): boolean {
  if (a === b) return true;
  const scale = Math.max(Math.abs(a), Math.abs(b));
  return scale === 0 ? true : Math.abs(a - b) / scale < 1e-6;
}

export function extractMaterialFactors(
  rows: Record<string, unknown>[],
  columns: { materialColumn: string; ghgColumn?: string; waterColumn?: string }
): ExtractionResult {
  const byMaterial = new Map<string, { ghg: number[]; water: number[]; rowCount: number }>();

  for (const row of rows) {
    const material = String(row[columns.materialColumn] ?? '').trim();
    if (!material) continue;

    const entry = byMaterial.get(material) ?? { ghg: [], water: [], rowCount: 0 };
    entry.rowCount += 1;

    const ghg = columns.ghgColumn ? toNumber(row[columns.ghgColumn]) : null;
    if (ghg !== null && !entry.ghg.some(v => sameValue(v, ghg))) entry.ghg.push(ghg);

    const water = columns.waterColumn ? toNumber(row[columns.waterColumn]) : null;
    if (water !== null && !entry.water.some(v => sameValue(v, water))) entry.water.push(water);

    byMaterial.set(material, entry);
  }

  const materials: ExtractedMaterial[] = Array.from(byMaterial.entries())
    .map(([material, e]) => {
      const ghgConflicts = e.ghg.length > 1 ? e.ghg.slice().sort((a, b) => a - b) : [];
      const waterConflicts = e.water.length > 1 ? e.water.slice().sort((a, b) => a - b) : [];
      return {
        material,
        // A single agreed value, or null when rows disagree — never guess between them.
        ghg: e.ghg.length === 1 ? e.ghg[0] : null,
        water: e.water.length === 1 ? e.water[0] : null,
        rowCount: e.rowCount,
        ghgConflicts,
        waterConflicts,
        hasConflict: ghgConflicts.length > 0 || waterConflicts.length > 0
      };
    })
    .sort((a, b) => a.material.localeCompare(b.material));

  return { materials, conflictCount: materials.filter(m => m.hasConflict).length };
}
