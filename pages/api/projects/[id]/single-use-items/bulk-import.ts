import type { NextApiResponse } from 'next';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';
import prisma from 'lib/prisma';
import { getSingleUseProducts } from 'lib/inventory/getSingleUseProducts';
import type { ImportedSingleUseLineItem } from 'lib/inventory/importSingleUseLineItemsFromExcel';

const handler = projectHandler();

handler.post(bulkImportItems);

async function bulkImportItems(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { id: projectId } = req.query;
  const { items }: { items: ImportedSingleUseLineItem[] } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required and cannot be empty' });
  }

  try {
    // Get the project to access orgId for product validation
    const project = await prisma.project.findUnique({
      where: { id: projectId as string },
      select: { orgId: true }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate that all products exist in the catalog
    const availableProducts = await getSingleUseProducts({ orgId: project.orgId });

    const availableProductIds = new Set(availableProducts.map(p => p.id));

    const productIds = items.map(item => item.productId);
    const invalidProductIds = productIds.filter(id => !availableProductIds.has(id));

    if (invalidProductIds.length > 0) {
      return res.status(400).json({
        error: `Invalid product IDs: ${invalidProductIds.join(', ')}`
      });
    }

    // Create the line items
    const lineItems = await Promise.all(
      items.map(item =>
        prisma.singleUseLineItem.create({
          data: {
            productId: item.productId,
            caseCost: item.caseCost,
            casesPurchased: item.casesPurchased,
            unitsPerCase: item.unitsPerCase,
            frequency: item.frequency,
            // Set new values to be the same as current values initially
            newCaseCost: item.caseCost,
            newCasesPurchased: 0,
            projectId: projectId as string
          }
        })
      )
    );

    res.status(200).json({
      success: true,
      importedCount: lineItems.length,
      lineItems
    });
  } catch (error) {
    console.error('Error bulk importing single-use line items:', error);
    res.status(500).json({ error: 'Failed to import items' });
  }
}

export default handler;
