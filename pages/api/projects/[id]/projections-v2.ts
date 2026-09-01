import type { NextApiResponse } from 'next';

import { computeCombinedModel } from 'lib/calculator/v2/combinedModel';
import type { ModelOutputs } from 'lib/calculator/v2/combinedModel';
import { buildModelInputs, loadModelTables } from 'lib/calculator/v2/projectToModelInputs';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';

/**
 * The project computed under Methodology 2.0 (the Combined Model over the Data Release
 * tables). `available: false` when the release isn't loaded in this environment — the
 * dashboard falls back to v1 silently rather than showing an error for a data-ops gap.
 */
export type ProjectionsV2Response =
  | { available: false; reason: string }
  | {
      available: true;
      outputs: ModelOutputs;
      unmatchedSingleUse: number;
      unmatchedReusables: number;
      excluded: string[];
    };

const handler = projectHandler();

handler.get(async (req: NextApiRequestWithUser, res: NextApiResponse<ProjectionsV2Response>) => {
  const projectId = req.query.id;
  if (typeof projectId !== 'string') return res.status(400).json({ available: false, reason: 'No project id' });

  const tables = await loadModelTables();
  if (!tables) {
    return res.json({ available: false, reason: 'Data Release 2.0 tables are not loaded in this environment' });
  }

  const mapping = await buildModelInputs(projectId, tables);
  if (!mapping) return res.status(404).json({ available: false, reason: 'Project not found' });

  // Methodology 2.0 IS Madhavi's Combined Model, verbatim — including its known box-water
  // lookup quirk. The product reproduces her model exactly; the correction ships later as a
  // versioned change she approves (tracked as a data-health notification + feedback #1),
  // never as a silent default that makes our numbers differ from hers.
  const outputs = computeCombinedModel(mapping.inputs, tables, { replicateWorkbookBoxLookup: true });
  res.json({
    available: true,
    outputs,
    unmatchedSingleUse: mapping.unmatchedSingleUse,
    unmatchedReusables: mapping.unmatchedReusables,
    excluded: mapping.excluded
  });
});

export default handler;
