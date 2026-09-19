import type { NextApiResponse } from 'next';

import type { ModelInputs } from 'lib/calculator/v2/combinedModel';
import { buildModelInputs, loadModelTables } from 'lib/calculator/v2/projectToModelInputs';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

/**
 * Model Console: a project's inputs exactly as the 2.0 engine receives them
 * (lib/calculator/v2/projectToModelInputs.buildModelInputs) — for editing and re-running
 * in the console without touching the project.
 */
export type ConsoleProjectInputsResponse =
  | { ok: false; reason: string }
  | {
      ok: true;
      project: { id: string; name: string };
      inputs: ModelInputs;
      unmatchedSingleUse: number;
      unmatchedReusables: number;
      excluded: string[];
    };

const handler = handlerWithUser();
handler.use(requireUpstream);

handler.get(async (req: NextApiRequestWithUser, res: NextApiResponse<ConsoleProjectInputsResponse>) => {
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : null;
  if (!projectId) return res.status(400).json({ ok: false, reason: 'projectId is required' });

  const tables = await loadModelTables();
  if (!tables) return res.json({ ok: false, reason: 'Data Release 2.0 tables are not loaded in this environment' });

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } });
  if (!project) return res.status(404).json({ ok: false, reason: 'No project with that id' });

  const mapping = await buildModelInputs(projectId, tables);
  if (!mapping) return res.status(404).json({ ok: false, reason: 'That project produced no model inputs' });

  res.json({
    ok: true,
    project,
    inputs: mapping.inputs,
    unmatchedSingleUse: mapping.unmatchedSingleUse,
    unmatchedReusables: mapping.unmatchedReusables,
    excluded: mapping.excluded
  });
});

export default handler;
