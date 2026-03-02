import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { LINEAGE_MAP } from 'lib/admin/lineageMap';
import prisma from 'lib/prisma';

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { factorId, hypotheticalValue } = req.body as { factorId: string; hypotheticalValue: number };
  if (!factorId || typeof hypotheticalValue !== 'number') {
    return res.status(400).json({ error: 'factorId and hypotheticalValue are required' });
  }

  const factor = await prisma.factor.findUnique({
    where: { id: factorId },
    select: {
      id: true,
      name: true,
      currentValue: true,
      unit: true,
      calculatorConstantKey: true,
      category: { select: { name: true } }
    }
  });

  if (!factor) return res.status(404).json({ error: 'Factor not found' });
  if (!factor.calculatorConstantKey) {
    return res.status(400).json({ error: 'Factor has no calculatorConstantKey — cannot trace lineage' });
  }

  const lineage = LINEAGE_MAP.find(entry => entry.pattern.test(factor.calculatorConstantKey!));
  if (!lineage) {
    return res.status(400).json({ error: 'Factor has no lineage mapping' });
  }

  const currentValue = factor.currentValue;
  const ratio = hypotheticalValue / currentValue;
  const percentChange = (ratio - 1) * 100;

  const estimatedChanges = lineage.outputMetrics.map(metric => ({
    metric,
    percentChange: Math.round(percentChange * 100) / 100,
    direction: percentChange > 0 ? 'increase' : percentChange < 0 ? 'decrease' : 'no change',
    isLinear: true
  }));

  return res.status(200).json({
    factor: {
      id: factor.id,
      name: factor.name,
      currentValue,
      unit: factor.unit,
      calculatorConstantKey: factor.calculatorConstantKey,
      categoryName: factor.category?.name ?? null
    },
    lineage: {
      calculatorFunction: lineage.calculatorFunction,
      calculatorFile: lineage.calculatorFile,
      metricCategory: lineage.metricCategory
    },
    hypotheticalValue,
    percentChange: Math.round(percentChange * 100) / 100,
    estimatedChanges,
    disclaimer:
      'Estimates assume a linear relationship between this factor and output metrics. Actual results may vary for non-linear models.'
  });
});
