import type { NextApiResponse } from 'next';

import { getSchemaRegistry, NODE_TO_MODELS } from 'lib/admin/schemaRegistry';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import prisma from 'lib/prisma';

/**
 * GET /api/admin/data-map/sample?nodeId=projects&take=5
 *
 * Returns sample rows for the Prisma model(s) mapped to a Data Map node.
 * Uses the schema registry to auto-derive safe scalar selects.
 * Supports optional `id` param to fetch a single record by primary key.
 */

// Allowlist of models we permit sampling — must match NODE_TO_MODELS values
const ALLOWED_MODELS = new Set(Object.values(NODE_TO_MODELS).flat().filter(Boolean));

// Fields to always exclude from sample output (sensitive data)
const EXCLUDED_FIELDS = new Set(['keyHash', 'rawPayload', 'password', 'secret']);

/** Build a Prisma select object from the schema registry for a model (scalar fields only). */
function buildSelect(modelName: string): { select: Record<string, boolean>; hasCreatedAt: boolean } {
  const registry = getSchemaRegistry();
  const model = registry.models.find(m => m.name === modelName);
  if (!model) return { select: {}, hasCreatedAt: false };

  const select: Record<string, boolean> = {};
  let hasCreatedAt = false;

  for (const field of model.fields) {
    if (field.isRelation) continue; // Skip relations — just scalar fields
    if (EXCLUDED_FIELDS.has(field.name)) continue;
    select[field.name] = true;
    if (field.name === 'createdAt') hasCreatedAt = true;
  }

  return { select, hasCreatedAt };
}

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  try {
    const nodeId = req.query.nodeId as string | undefined;
    const recordId = req.query.id as string | undefined;
    const take = Math.min(parseInt(req.query.take as string, 10) || 5, 20);

    if (!nodeId) {
      return res.status(400).json({ error: 'nodeId query parameter is required' });
    }

    const modelNames = NODE_TO_MODELS[nodeId];
    if (!modelNames || modelNames.length === 0) {
      return res.json({ nodeId, models: [] });
    }

    const results: Array<{ model: string; rows: Record<string, unknown>[]; total: number }> = [];

    for (const modelName of modelNames) {
      if (!ALLOWED_MODELS.has(modelName)) continue;

      // Access prisma delegate dynamically
      const delegate = (prisma as unknown as Record<string, unknown>)[
        modelName.charAt(0).toLowerCase() + modelName.slice(1)
      ] as
        | {
            findMany: (args: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
            findUnique: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
            count: () => Promise<number>;
          }
        | undefined;

      if (!delegate) continue;

      const { select, hasCreatedAt } = buildSelect(modelName);
      const hasFields = Object.keys(select).length > 0;

      if (recordId) {
        // Single record lookup
        const row = await delegate.findUnique({
          where: { id: recordId },
          ...(hasFields ? { select } : {})
        });
        const total = row ? 1 : 0;
        results.push({ model: modelName, rows: row ? [row] : [], total });
      } else {
        // Sample rows — order by createdAt if the model has it
        const [rows, total] = await Promise.all([
          delegate.findMany({
            ...(hasFields ? { select } : {}),
            ...(hasCreatedAt ? { orderBy: { createdAt: 'desc' } } : {}),
            take
          }),
          delegate.count()
        ]);
        results.push({ model: modelName, rows: rows as Record<string, unknown>[], total });
      }
    }

    return res.json({ nodeId, models: results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Sample API error:', { message });
    return res.status(500).json({ error: message });
  }
});
