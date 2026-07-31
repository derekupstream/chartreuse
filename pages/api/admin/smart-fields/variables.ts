import type { NextApiResponse } from 'next';

import type { SmartVariable } from 'lib/smartFields/variables';
import { KNOWN_INPUTS, KNOWN_INTERMEDIATES, cellRef, toVariableKey } from 'lib/smartFields/variables';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();
handler.use(requireUpstream);

type Column = { key: string; label?: string; type?: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Identifier and bookkeeping columns are numbers but not factors. */
const isIdentifierColumn = (column: Column) => {
  const n = norm(column.label ?? column.key);
  return (
    n === 'id' ||
    n.endsWith('id') ||
    n.includes('rowindex') ||
    n.includes('productrows') ||
    n.includes('casecount') ||
    n.includes('unitspercase')
  );
};

/**
 * Turns every numeric cell in the uploaded databases into a addressable variable, so an
 * equation can reference a real factor and we can point back at the row it came from.
 *
 * Factor tables (few columns, one value per row) become one variable per row.
 * Product tables are exposed as their numeric columns, since a product-level variable
 * only makes sense once a specific product is chosen on a calculator.
 */
handler.get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const databases = await prisma.factorDatabase.findMany({
    where: { isActive: true },
    include: { rows: { orderBy: { rowIndex: 'asc' } } }
  });

  const variables: SmartVariable[] = [...KNOWN_INPUTS, ...KNOWN_INTERMEDIATES];
  const usedKeys = new Set(variables.map(v => v.key));

  for (const database of databases) {
    const columns = (database.columns as unknown as Column[]) ?? [];
    const nameColumn = columns.find(c => ['name', 'material', 'factor', 'productid'].includes(norm(c.key)));
    const numericColumns = columns.filter(
      c => c.type === 'number' && c.key !== nameColumn?.key && !isIdentifierColumn(c)
    );
    const isFactorTable = /factor|rate/i.test(database.name) && !!nameColumn && numericColumns.length <= 4;

    if (isFactorTable && nameColumn) {
      // One variable per row, e.g. "Ceramic → GHG"
      for (const row of database.rows) {
        const data = row.data as Record<string, unknown>;
        const rowName = String(data[nameColumn.key] ?? '').trim();
        if (!rowName) continue;

        for (const column of numericColumns) {
          const raw = data[column.key];
          const value = Number(String(raw ?? '').replace(/[^0-9.eE+-]/g, ''));
          if (!Number.isFinite(value)) continue;

          const suffix = numericColumns.length > 1 ? ` ${column.label ?? column.key}` : '';
          let key = toVariableKey(`${rowName}${suffix}`);
          while (usedKeys.has(key)) key = `${key}_`;
          usedKeys.add(key);

          variables.push({
            key,
            label: `${rowName}${suffix}`,
            category: 'Factors',
            unit: column.label?.match(/\(([^)]+)\)/)?.[1] ?? undefined,
            value,
            description: `${rowName} from ${database.name}`,
            source: {
              database: database.name,
              databaseId: database.id,
              table: database.sourceName || database.name,
              cell: cellRef(
                columns.findIndex(c => c.key === column.key),
                row.rowIndex
              ),
              rowIndex: row.rowIndex,
              columnKey: column.key,
              version: `v${database.version}`
            }
          });
        }
      }
    } else {
      // Product-style table: expose its numeric columns as product variables
      for (const column of numericColumns) {
        let key = toVariableKey(column.label ?? column.key);
        while (usedKeys.has(key)) key = `${key}_`;
        usedKeys.add(key);

        variables.push({
          key,
          label: column.label ?? column.key,
          category: 'Products',
          value: undefined, // resolved once a product is chosen
          description: `${column.label ?? column.key} from ${database.name}, per product row`,
          source: {
            database: database.name,
            databaseId: database.id,
            table: database.sourceName || database.name,
            cell: `${cellRef(
              columns.findIndex(c => c.key === column.key),
              0
            )}…`,
            rowIndex: 0,
            columnKey: column.key,
            version: `v${database.version}`
          }
        });
      }
    }
  }

  // Published smart fields can be reused inside other smart fields
  const published = await prisma.smartField.findMany({ where: { isPublished: true } });
  for (const field of published) {
    let key = toVariableKey(field.name);
    while (usedKeys.has(key)) key = `${key}_`;
    usedKeys.add(key);
    variables.push({
      key,
      label: field.name,
      category: 'Outputs',
      unit: field.unit ?? undefined,
      description: field.description ?? 'A published smart field'
    });
  }

  res.json({ variables });
});

export default handler;
