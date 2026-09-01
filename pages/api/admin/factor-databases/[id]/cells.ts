/**
 * Cell edits from the spreadsheet view. A batch of edits is one change: one changelog row,
 * one version step — the same policy as an upload (factors tables auto-bump and cut a
 * methodology snapshot; reference tables record the change without a bump).
 */
import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import { FORMULAS_KEY, evaluateFormula, isFormula } from 'lib/admin/formula';
import { loadDatabaseResolver, recomputeAllFormulas } from 'lib/admin/formulaServer';
import prisma from 'lib/prisma';
import { bumpVersion } from 'pages/api/admin/factor-databases/index';

const handler = handlerWithUser();
handler.use(requireUpstream);

export type CellEdit = { rowIndex: number; column: string; value: string | number | null };
export type CellEditResponse = {
  versionBefore: string;
  versionAfter: string;
  rowsUpdated: number;
  columnsTouched: string[];
  /** Formula cells elsewhere that were re-evaluated because this data changed */
  refreshedFormulaCells: number;
};

async function patch(req: NextApiRequestWithUser, res: NextApiResponse) {
  const edits: CellEdit[] = Array.isArray(req.body?.edits) ? req.body.edits : [];
  if (!edits.length) return res.status(400).json({ error: 'No edits provided' });

  const database = await prisma.factorDatabase.findUnique({ where: { id: req.query.id as string } });
  if (!database) return res.status(404).json({ error: 'Not found' });

  const columnKeys = new Set(((database.columns as unknown as { key: string }[]) ?? []).map(c => c.key));
  const badColumn = edits.find(e => !columnKeys.has(e.column));
  if (badColumn) return res.status(400).json({ error: `Unknown column "${badColumn.column}"` });

  const rowIndexes = Array.from(new Set(edits.map(e => e.rowIndex)));
  const rows = await prisma.factorDatabaseRow.findMany({
    where: { databaseId: database.id, rowIndex: { in: rowIndexes } }
  });
  if (rows.length !== rowIndexes.length) {
    return res.status(400).json({ error: 'An edited row no longer exists — reload and try again' });
  }

  // Formula edits ("= 12 * @{…}") evaluate against the live databases before storing: the
  // cell keeps the computed number (what every consumer reads) plus the formula itself.
  const hasFormulaEdit = edits.some(e => isFormula(e.value));
  const resolve = hasFormulaEdit ? await loadDatabaseResolver() : null;

  for (const row of rows) {
    const data = { ...(row.data as Record<string, unknown>) };
    const formulas = { ...((data[FORMULAS_KEY] as Record<string, string> | undefined) ?? {}) };
    for (const edit of edits) {
      if (edit.rowIndex !== row.rowIndex) continue;
      if (isFormula(edit.value)) {
        const result = evaluateFormula(edit.value, resolve!);
        if (!result.ok) {
          return res.status(400).json({ error: `Row ${row.rowIndex + 1}, ${edit.column}: ${result.error}` });
        }
        data[edit.column] = result.value;
        formulas[edit.column] = String(edit.value).trim();
      } else {
        data[edit.column] = edit.value;
        delete formulas[edit.column]; // a plain value replaces any formula the cell had
      }
    }
    if (Object.keys(formulas).length) data[FORMULAS_KEY] = formulas;
    else delete data[FORMULAS_KEY];
    await prisma.factorDatabaseRow.update({ where: { id: row.id }, data: { data: data as object } });
  }

  // Data changed — every formula anywhere that references it must catch up.
  const refreshedFormulaCells = await recomputeAllFormulas();

  const versionBefore = database.version;
  const versionAfter = database.kind === 'factors' ? bumpVersion(versionBefore) : versionBefore;
  const columnsTouched = Array.from(new Set(edits.map(e => e.column)));

  await prisma.factorDatabase.update({
    where: { id: database.id },
    data: { version: versionAfter, updatedAt: new Date() }
  });

  // The "why" behind the edit: the admin's note, plus the change-request id when this
  // edit implements one — the version history and the CR log then reference each other.
  const changeRequestId = typeof req.body?.changeRequestId === 'string' ? req.body.changeRequestId : null;
  const noteText = typeof req.body?.note === 'string' && req.body.note ? req.body.note : 'Cell edit (spreadsheet view)';
  const sourceNote = changeRequestId ? `${noteText} [CR:${changeRequestId.slice(0, 8)}]` : noteText;

  const rowCountAfter = await prisma.factorDatabaseRow.count({ where: { databaseId: database.id } });
  await prisma.factorDatabaseChange.create({
    data: {
      databaseId: database.id,
      changedBy: req.user.id,
      action: 'edit',
      versionBefore,
      versionAfter,
      rowsAdded: 0,
      rowsUpdated: rowIndexes.length,
      rowsRemoved: 0,
      rowCountAfter,
      columnsTouched: columnsTouched as unknown as object,
      sourceNote
    }
  });

  if (changeRequestId) {
    await prisma.changeRequest
      .update({
        where: { id: changeRequestId },
        data: {
          status: 'implemented',
          implementedBy: req.user.id,
          implementedAt: new Date(),
          reviewNotes: `Implemented via spreadsheet edit on "${database.name}" (${versionBefore} → ${versionAfter}): ${noteText}`
        }
      })
      .catch(() => undefined); // a stale/deleted CR must not fail the data edit
  }

  // Factors changes alter what calculations produce → cut the automatic snapshot.
  if (database.kind === 'factors' && versionAfter !== versionBefore) {
    const allDatabases = await prisma.factorDatabase.findMany({
      select: { name: true, version: true, kind: true },
      orderBy: { name: 'asc' }
    });
    await prisma.methodologySnapshot.create({
      data: {
        createdBy: req.user.id,
        name: `Data Release ${versionAfter} — ${database.name}`,
        notes: `Auto-captured: "${database.name}" ${versionBefore} → ${versionAfter} (cell edit: ${columnsTouched.join(', ')} on ${rowIndexes.length} row${rowIndexes.length === 1 ? '' : 's'})`,
        status: 'published',
        publishedAt: new Date(),
        databaseVersionsJson: allDatabases as unknown as object
      }
    });
  }

  const response: CellEditResponse = {
    versionBefore,
    versionAfter,
    rowsUpdated: rowIndexes.length,
    columnsTouched,
    refreshedFormulaCells
  };
  res.json(response);
}

handler.patch(patch);

export default handler;
