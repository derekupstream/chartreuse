import type { NextApiResponse } from 'next';

import { explainOutputs } from 'lib/calculator/trace/explainOutputs';
import type { CalculatorExplanation } from 'lib/calculator/trace/explainOutputs';
import { getProjectInventory } from 'lib/inventory/getProjectInventory';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();
handler.use(requireUpstream);

export type CalculatorInputOverride = {
  /** Line item id to adjust */
  id: string;
  casesPurchased?: number;
  unitsPerCase?: number;
  caseCost?: number;
  newCasesPurchased?: number;
};

export type ExplainRequest = {
  projectId: string;
  /** Live edits applied on top of the project's real data, never persisted */
  singleUse?: CalculatorInputOverride[];
  reusable?: CalculatorInputOverride[];
};

export type ExplainResponse = CalculatorExplanation & {
  projectName: string;
  lineItems: {
    kind: 'single-use' | 'reusable';
    id: string;
    label: string;
    casesPurchased: number;
    unitsPerCase: number;
    caseCost: number;
    newCasesPurchased: number;
  }[];
};

const applyOverrides = (items: any[], overrides?: CalculatorInputOverride[]) =>
  items.map(item => {
    const override = overrides?.find(o => o.id === item.id);
    if (!override) return item;
    return {
      ...item,
      casesPurchased: override.casesPurchased ?? item.casesPurchased,
      unitsPerCase: override.unitsPerCase ?? item.unitsPerCase,
      caseCost: override.caseCost ?? item.caseCost,
      newCasesPurchased: override.newCasesPurchased ?? item.newCasesPurchased
    };
  });

handler.post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const { projectId, singleUse, reusable } = req.body as ExplainRequest;
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const inventory = await getProjectInventory(projectId);
  const adjusted = {
    ...inventory,
    singleUseItems: applyOverrides(inventory.singleUseItems as any[], singleUse),
    reusableItems: applyOverrides(inventory.reusableItems as any[], reusable)
  };

  const explanation = explainOutputs(adjusted as typeof inventory);

  const response: ExplainResponse = {
    ...explanation,
    projectName: project.name,
    lineItems: [
      ...(adjusted.singleUseItems as any[]).map(i => ({
        kind: 'single-use' as const,
        id: i.id,
        label: i.product?.description?.trim() || `Product ${i.productId}`,
        casesPurchased: i.casesPurchased,
        unitsPerCase: i.unitsPerCase,
        caseCost: i.caseCost,
        newCasesPurchased: i.newCasesPurchased ?? 0
      })),
      ...(adjusted.reusableItems as any[])
        .filter(i => i.product)
        .map(i => ({
          kind: 'reusable' as const,
          id: i.id ?? i.productId,
          label: i.product?.description?.trim() || `Product ${i.productId}`,
          casesPurchased: i.casesPurchased,
          unitsPerCase: i.unitsPerCase,
          caseCost: i.caseCost,
          newCasesPurchased: i.newCasesPurchased ?? 0
        }))
    ]
  };

  res.json(response);
});

export default handler;
