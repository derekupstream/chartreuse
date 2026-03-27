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
    // Fallback: derive functions from LINEAGE_MAP when source files aren't on disk
    const seen = new Set<string>();
    enriched = LINEAGE_MAP.reduce<
      Array<{
        name: string;
        filePath: string;
        outputMetrics: string[];
        metricCategory: string | null;
        lineageFile: string | null;
      }>
    >((acc, entry) => {
      const name = entry.calculatorFunction.replace(/\(\)$/, '');
      if (!seen.has(name)) {
        seen.add(name);
        acc.push({
          name,
          filePath: entry.calculatorFile,
          outputMetrics: entry.outputMetrics,
          metricCategory: entry.metricCategory,
          lineageFile: entry.calculatorFile
        });
      }
      return acc;
    }, []);
  }

  res.json({ functions: enriched, scannedAt: new Date().toISOString(), total: enriched.length });
});
