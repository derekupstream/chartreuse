import type { NextApiResponse } from 'next';

import { getSchemaRegistry, MODEL_TO_NODE, NODE_TO_MODELS } from 'lib/admin/schemaRegistry';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  try {
    const registry = getSchemaRegistry();

    // If ?nodeId=xxx is provided, return only the models mapped to that node
    const nodeId = req.query.nodeId as string | undefined;
    if (nodeId) {
      const modelNames = NODE_TO_MODELS[nodeId];
      if (!modelNames || modelNames.length === 0) {
        return res.json({ models: [], nodeId });
      }
      const models = registry.models.filter(m => modelNames.includes(m.name));
      return res.json({ models, nodeId });
    }

    // Full registry + reverse model→node map for FK edge resolution
    return res.json({ ...registry, modelToNode: MODEL_TO_NODE });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Schema API error:', { message, stack: err instanceof Error ? err.stack : undefined });
    return res.status(500).json({ error: message });
  }
});
