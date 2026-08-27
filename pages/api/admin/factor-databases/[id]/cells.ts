/**
 * Cell edits from the spreadsheet view. A batch of edits is one change: one changelog row,
 * one version step — the same policy as an upload (factors tables auto-bump and cut a
 * methodology snapshot; reference tables record the change without a bump).
 */
import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
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

  for (const row of rows) {
    const data = { ...(row.data as Record<string, unknown>) };
    for (const edit of edits) {
      if (edit.rowIndex === row.rowIndex) data[edit.column] = edit.value;
    }
    await prisma.factorDatabaseRow.update({ where: { id: row.id }, data: { data: data as object } });
  }

  const versionBefore = database.version;
  const versionAfter = database.kind === 'factors' ? bumpVersion(versionBefore) : versionBefore;
  const columnsTouched = Array.from(new Set(edits.map(e => e.column)));

  await prisma.factorDatabase.update({
    where: { id: database.id },
    data: { version: versionAfter, updatedAt: new Date() }
  });

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
      sourceNote: typeof req.body?.note === 'string' && req.body.note ? req.body.note : 'Cell edit (spreadsheet view)'
    }
  });

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
    columnsTouched
  };
  res.json(response);
}

handler.patch(patch);

export default handler;
