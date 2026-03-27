import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { CALCULATOR_REGISTRY } from 'lib/admin/calculatorRegistry';
import { scanCalculatorFunctions } from 'lib/admin/calculatorScan';
import { LINEAGE_MAP } from 'lib/admin/lineageMap';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  let rawFunctions: ReturnType<typeof scanCalculatorFunctions> = [];
  try {
    rawFunctions = scanCalculatorFunctions();
  } catch {
    // source files may not be accessible in serverless environments (e.g. Vercel)
  }

  let enriched;
  if (rawFunctions.length > 0) {
    enriched = rawFunctions.map(fn => {
      const lineageEntry = LINEAGE_MAP.find(entry => entry.calculatorFunction.startsWith(fn.name));
      return {
        ...fn,
        outputMetrics: lineageEntry?.outputMetrics ?? [],
        metricCategory: lineageEntry?.metricCategory ?? null,
        lineageFile: lineageEntry?.calculatorFile ?? null
      };
    });
  } else {
    // Fallback: use static registry when source files aren't on disk (e.g. Vercel)
    enriched = CALCULATOR_REGISTRY.map(fn => ({
      name: fn.name,
      filePath: fn.filePath,
      outputMetrics: fn.outputMetrics,
      metricCategory: fn.metricCategory,
      lineageFile: fn.filePath
    }));
  }

  res.json({ functions: enriched, scannedAt: new Date().toISOString(), total: enriched.length });
});
