import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { scanCalculatorFunctions } from 'lib/admin/calculatorScan';
import { LINEAGE_MAP } from 'lib/admin/lineageMap';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  let rawFunctions: ReturnType<typeof scanCalculatorFunctions> = [];
  try {
    rawFunctions = scanCalculatorFunctions();
  } catch {
    // source files may not be accessible in all deployment environments
  }

  // Enrich with lineage data where available
  const enriched = rawFunctions.map(fn => {
    const lineageEntry = LINEAGE_MAP.find(entry => entry.calculatorFunction.startsWith(fn.name));
    return {
      ...fn,
      outputMetrics: lineageEntry?.outputMetrics ?? [],
      metricCategory: lineageEntry?.metricCategory ?? null,
      lineageFile: lineageEntry?.calculatorFile ?? null
    };
  });

  res.json({ functions: enriched, scannedAt: new Date().toISOString(), total: enriched.length });
});
