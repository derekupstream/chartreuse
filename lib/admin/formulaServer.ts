/**
 * Server side of cell formulas: evaluate against the live databases, and re-evaluate every
 * stored formula whenever any database changes — that's what keeps an @variable reference
 * dynamic instead of a copied number. Consumers (the 2.0 engine included) only ever read
 * the stored plain values; formulas live alongside them under __formulas.
 */
import prisma from 'lib/prisma';

import { FORMULAS_KEY, evaluateFormula, makeTableResolver, rowFormulas } from './formula';
import type { ResolveVariable } from './formula';

/** A resolver over the current contents of every active database. */
export async function loadDatabaseResolver(): Promise<ResolveVariable> {
  const databases = await prisma.factorDatabase.findMany({
    where: { isActive: true },
    include: { rows: { orderBy: { rowIndex: 'asc' } } }
  });
  const tables = new Map(
    databases.map(d => [
      d.name,
      {
        keyColumn: d.keyColumn || (Array.isArray(d.columns) ? String((d.columns as any[])[0]?.key ?? '') : ''),
        rows: d.rows.map(r => r.data as Record<string, unknown>)
      }
    ])
  );
  return makeTableResolver(tables);
}

/**
 * Re-evaluates every stored formula across all databases and writes back any value that
 * changed. Called after any data write (cell edits, uploads, restores). Returns how many
 * cells were refreshed.
 */
export async function recomputeAllFormulas(): Promise<number> {
  const databases = await prisma.factorDatabase.findMany({
    where: { isActive: true },
    include: { rows: true }
  });
  const hasAnyFormula = databases.some(d => d.rows.some(r => Object.keys(rowFormulas(r.data as any)).length > 0));
  if (!hasAnyFormula) return 0;

  const resolve = await loadDatabaseResolver();
  let refreshed = 0;

  for (const database of databases) {
    for (const row of database.rows) {
      const data = row.data as Record<string, unknown>;
      const formulas = rowFormulas(data);
      const columns = Object.keys(formulas);
      if (!columns.length) continue;
      let changed = false;
      for (const column of columns) {
        const result = evaluateFormula(formulas[column], resolve);
        // An unresolvable formula keeps its last good value — visible in the cell inspector.
        if (result.ok && data[column] !== result.value) {
          data[column] = result.value;
          changed = true;
          refreshed += 1;
        }
      }
      if (changed) {
        await prisma.factorDatabaseRow.update({ where: { id: row.id }, data: { data: data as object } });
      }
    }
  }
  return refreshed;
}

export { FORMULAS_KEY };
