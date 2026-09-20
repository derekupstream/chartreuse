/**
 * Resolves the factors the calculator uses back to the DATABASE ROWS that document them,
 * along with any row-level reference the table carries (a "source" column) — so the
 * answer to "where does this number come from?" ends at evidence a reviewer can open and
 * verify, not at "it's in the code" (Derek, 2026-09-20).
 *
 * Matching is by name: a factor named "Corrugated Cardboard" finds the GHG Factors row
 * of the same name; a few drawer names differ from their row's name and are mapped in
 * ALIASES. The reference changes PROVENANCE ONLY — the engine's value stays exactly what
 * it computes with, so attaching a reference can never change a number.
 */
import type { CalculatorExplanation, FactorProvenance } from 'lib/calculator/trace/explainOutputs';
import prisma from 'lib/prisma';

export type FactorReference = {
  database: string;
  databaseId: string;
  rowIndex: number;
  /** Row-level citation (a "source"/"reference" column), or the database's own source name */
  sourceNote?: string;
  /** Row-level link (a "url"/"link" column), or the database's own source URL */
  sourceUrl?: string;
};

const norm = (s: string) => s.trim().toLowerCase();

/** Drawer factor names that differ from the database row that documents them. */
const ALIASES: Record<string, string> = {
  'transportation co2 (overseas cargo)': 'waterborne craft',
  'ocean freight': 'waterborne craft',
  'corrugated cardboard ghg': 'corrugated cardboard',
  'corrugated cardboard (shipping box)': 'corrugated cardboard'
};

/** Reads every factor table that documents calculator factors, keyed by row name. */
export async function loadFactorReferences(): Promise<Map<string, FactorReference>> {
  const databases = await prisma.factorDatabase.findMany({
    where: {
      isActive: true,
      name: { in: ['GHG Factors', 'Water Factors', 'Transport Factors', 'Dishwasher Factors', 'Utility Rates'] }
    },
    include: { rows: { orderBy: { rowIndex: 'asc' } } }
  });

  const references = new Map<string, FactorReference>();
  for (const database of databases) {
    const columns = (database.columns as unknown as { key: string; label?: string }[]) ?? [];
    const nameColumn = columns.find(c => ['material', 'mode', 'name', 'factor', 'machine'].includes(norm(c.key)))?.key;
    const sourceColumn = columns.find(c => /source|reference|citation/i.test(c.key))?.key;
    const urlColumn = columns.find(c => /url|link/i.test(c.key))?.key;
    if (!nameColumn) continue;

    for (const row of database.rows) {
      const data = row.data as Record<string, string | number | null>;
      const rowName = String(data[nameColumn] ?? '').trim();
      if (!rowName) continue;
      references.set(norm(rowName), {
        database: database.name,
        databaseId: database.id,
        rowIndex: row.rowIndex,
        sourceNote:
          (sourceColumn && data[sourceColumn] ? String(data[sourceColumn]) : undefined) ??
          database.sourceName ??
          undefined,
        sourceUrl:
          (urlColumn && data[urlColumn] ? String(data[urlColumn]) : undefined) ?? database.sourceUrl ?? undefined
      });
    }
  }
  return references;
}

/**
 * Attaches database references to every factor an explanation lists. A factor whose name
 * (or alias) matches a documented row becomes origin 'database' with a note and a row to
 * open; anything unmatched keeps its origin — the drawer then labels it an Upstream
 * default still waiting for a database home.
 */
export function attachFactorReferences(
  explanation: CalculatorExplanation,
  references: Map<string, FactorReference>
): void {
  const resolve = (factor: FactorProvenance) => {
    const lookup = norm(factor.name);
    const reference = references.get(ALIASES[lookup] ?? lookup);
    if (!reference) return;
    factor.origin = 'database';
    factor.database = reference.database;
    factor.databaseId = reference.databaseId;
    factor.rowIndex = reference.rowIndex;
    factor.sourceNote = reference.sourceNote;
    factor.sourceUrl = reference.sourceUrl;
  };
  for (const output of explanation.outputs) {
    output.factorsUsed.forEach(resolve);
  }
}
