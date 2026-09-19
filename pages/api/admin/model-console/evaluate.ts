import type { NextApiResponse } from 'next';

import { evaluateFormula, isFormula, parseTokens } from 'lib/admin/formula';
import { loadDatabaseResolver } from 'lib/admin/formulaServer';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';

/**
 * Model Console scratchpad: evaluate a formula against the LIVE databases — the same
 * evaluator and @{Database.column:rowkey} resolution the spreadsheet cells use, with
 * nothing stored.
 */
export type ConsoleEvaluateResponse =
  | { ok: true; value: number; tokens: { raw: string; resolved: number | null }[] }
  | { ok: false; error: string };

const handler = handlerWithUser();
handler.use(requireUpstream);

handler.post(async (req: NextApiRequestWithUser, res: NextApiResponse<ConsoleEvaluateResponse>) => {
  const formula = typeof req.body?.formula === 'string' ? req.body.formula : '';
  if (!isFormula(formula)) {
    return res
      .status(400)
      .json({ ok: false, error: 'A formula starts with "=" — e.g. = 2 * @{Purchase Frequency.Annual_Factor:weekly}' });
  }
  const resolve = await loadDatabaseResolver();
  // Report each token's resolution alongside the result, so a wrong rowkey is debuggable.
  const tokens = parseTokens(formula).map(token => ({ raw: token.raw, resolved: resolve(token) }));
  const result = evaluateFormula(formula, resolve);
  if (!result.ok) return res.status(422).json({ ok: false, error: result.error });
  res.json({ ok: true, value: result.value, tokens });
});

export default handler;
