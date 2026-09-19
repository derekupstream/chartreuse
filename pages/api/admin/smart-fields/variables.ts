import type { NextApiResponse } from 'next';

import { buildVariableCatalog } from 'lib/smartFields/catalogServer';
import { toVariableKey } from 'lib/smartFields/variables';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();
handler.use(requireUpstream);

/** The smart-field variable catalog — built in lib/smartFields/catalogServer.ts. */
handler.get(async (_req: NextApiRequestWithUser, res: NextApiResponse) => {
  res.json({ variables: await buildVariableCatalog() });
});

/**
 * Create a new user-input variable. It is stored as a row of the Data Dictionary
 * (Authority "User"), so defining a variable and documenting it are the same act —
 * the dictionary page and the variable catalog both pick it up immediately
 * (Derek, 2026-09-19).
 */
handler.post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const {
    label,
    key: rawKey,
    unit,
    description
  } = req.body as {
    label?: string;
    key?: string;
    unit?: string;
    description?: string;
  };
  if (!label?.trim()) return res.status(400).json({ error: 'The variable needs a name' });
  const key = (rawKey?.trim() || toVariableKey(label)).replace(/[^A-Za-z0-9_]/g, '');
  if (!/^[A-Za-z_]/.test(key)) return res.status(400).json({ error: 'The key must start with a letter' });

  const existingInCatalog = (await buildVariableCatalog()).some(v => v.key === key);
  if (existingInCatalog) return res.status(409).json({ error: `“${key}” already exists as a variable` });

  const dictionary = await prisma.factorDatabase.findUnique({
    where: { name: 'Data Dictionary' },
    include: { rows: { orderBy: { rowIndex: 'desc' }, take: 1 } }
  });
  if (!dictionary) return res.status(500).json({ error: 'The Data Dictionary database is not loaded' });

  await prisma.factorDatabaseRow.create({
    data: {
      databaseId: dictionary.id,
      rowIndex: (dictionary.rows[0]?.rowIndex ?? -1) + 1,
      data: {
        Field: key,
        Type: 'number',
        Unit: unit?.trim() || 'none',
        Authority: 'User',
        'Role / Definition': description?.trim() || label.trim(),
        Requirement: 'Optional'
      }
    }
  });
  // Best-effort changelog: legacy user ids aren't UUIDs and changedBy is — the variable
  // must still be created even when the history row can't carry the author.
  await prisma.factorDatabaseChange
    .create({
      data: {
        databaseId: dictionary.id,
        changedBy: req.user.id,
        action: 'add',
        versionBefore: dictionary.version,
        versionAfter: dictionary.version,
        rowsAdded: 1,
        rowCountAfter: (dictionary.rows[0]?.rowIndex ?? -1) + 2,
        columnsTouched: ['Field', 'Unit', 'Authority'] as unknown as object,
        sourceNote: `New user-input variable “${key}” created from the Smart Field Builder`
      }
    })
    .catch(() => undefined);

  res.json({
    variable: {
      key,
      label: label.trim(),
      category: 'Inputs',
      unit: unit?.trim() || undefined,
      description: description?.trim() || undefined
    }
  });
});

export default handler;
