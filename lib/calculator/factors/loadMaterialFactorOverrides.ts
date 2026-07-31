/**
 * Loads material factors from the Databases area into the override registry, so the
 * calculator's numbers come from data rather than from values compiled into the code.
 *
 * Which tables are used: any active FactorDatabase whose name ends in "Material Factors"
 * and which has a material-name column plus a GHG or water column. Column matching is
 * lenient about naming so a table uploaded from a spreadsheet works without renaming.
 *
 * Called from getProjectInventory(), i.e. before any projection is computed. Results are
 * cached briefly so a page rendering many projects doesn't re-query per project.
 */
import prisma from 'lib/prisma';

import { setMaterialFactorOverrides } from './materialFactorOverrides';

const CACHE_MS = 30_000;
let lastLoadAttempt = 0;
let inFlight: Promise<void> | null = null;

type Column = { key: string; label?: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function pickColumn(columns: Column[], matches: (n: string) => boolean): string | undefined {
  return columns.find(c => matches(norm(c.key)) || (c.label ? matches(norm(c.label)) : false))?.key;
}

function toNumber(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(/[^0-9.eE+-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

async function load(): Promise<void> {
  const databases = await prisma.factorDatabase.findMany({
    where: { isActive: true, name: { endsWith: 'Material Factors' } },
    include: { rows: { orderBy: { rowIndex: 'asc' } } }
  });

  const entries: { name: string; mtco2ePerLb?: number; waterUsageGalPerLb?: number; source: string }[] = [];

  for (const database of databases) {
    const columns = (database.columns as unknown as Column[]) ?? [];
    const nameCol = pickColumn(columns, n => n === 'name' || n === 'material' || n.includes('materialname'));
    const ghgCol = pickColumn(columns, n => n.includes('mtco2e') || n.includes('ghg') || n.includes('co2'));
    const waterCol = pickColumn(columns, n => n.includes('water') || n.includes('galperlb'));
    if (!nameCol || (!ghgCol && !waterCol)) continue;

    for (const row of database.rows) {
      const data = row.data as Record<string, unknown>;
      const name = String(data[nameCol] ?? '').trim();
      if (!name) continue;
      entries.push({
        name,
        mtco2ePerLb: ghgCol ? toNumber(data[ghgCol]) : undefined,
        waterUsageGalPerLb: waterCol ? toNumber(data[waterCol]) : undefined,
        source: database.name
      });
    }
  }

  setMaterialFactorOverrides(entries);
}

/**
 * Refreshes the override registry, at most once per cache window. Never throws: if the
 * database is unreachable the calculator keeps using its compiled defaults.
 */
export async function loadMaterialFactorOverrides(options?: { force?: boolean }): Promise<void> {
  const now = Date.now();
  if (!options?.force && now - lastLoadAttempt < CACHE_MS) return;
  if (inFlight) return inFlight;

  lastLoadAttempt = now;
  inFlight = load()
    .catch(err => {
      console.error('Could not load material factor overrides; using compiled defaults', err);
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
