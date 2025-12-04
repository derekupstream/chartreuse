import type { NextApiResponse } from 'next';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';
import prisma from 'lib/prisma';
import { getReusableProducts } from 'lib/inventory/assets/reusables/getReusableProducts';
import type { ImportedReusableLineItem } from 'lib/inventory/importReusableLineItemsFromExcel';

const handler = projectHandler();

handler.post(bulkImportItems);

async function bulkImportItems(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { id: projectId } = req.query;
  const { items }: { items: ImportedReusableLineItem[] } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required and cannot be empty' });
  }

  try {
    // Validate that all products exist in the catalog
    const availableProducts = await getReusableProducts();

    const availableProductIds = new Set(availableProducts.map(p => p.id));

    const productIds = items.map(item => item.productId);
    const invalidProductIds = productIds.filter(id => !availableProductIds.has(id));

    if (invalidProductIds.length > 0) {
      return res.status(400).json({
        error: `Invalid product IDs: ${invalidProductIds.join(', ')}`
      });
    }

    // Create a map of productId to categoryId for setting the categoryId
    const productCategoryMap = new Map(availableProducts.map(p => [p.id, p.category]));

    // Create the line items
    const lineItems = await Promise.all(
      items.map(item =>
        prisma.reusableLineItem.create({
          data: {
            productId: item.productId,
            caseCost: item.caseCost,
            casesPurchased: item.casesPurchased,
            unitsPerCase: item.unitsPerCase,
            annualRepurchasePercentage: item.annualRepurchasePercentage,
            categoryId: productCategoryMap.get(item.productId)?.toString() || null,
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
    console.error('Error bulk importing reusable line items:', error);
    res.status(500).json({ error: 'Failed to import items' });
  }
}

export default handler;
