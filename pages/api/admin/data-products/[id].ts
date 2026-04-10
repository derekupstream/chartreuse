import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query as { id: string };
    const product = await prisma.dataProductDefinition.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Data product not found' });
    res.json(product);
  })
  .patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query as { id: string };
    const existing = await prisma.dataProductDefinition.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Data product not found' });

    const {
      name,
      description,
      productType,
      audience,
      projectType,
      status,
      inputSchemaJson,
      outputSchemaJson,
      flowDefinitionJson,
      executionCode,
      methodologyDocumentId,
      isPublic
    } = req.body;

    const updated = await prisma.dataProductDefinition.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(productType !== undefined && { productType }),
        ...(audience !== undefined && { audience }),
        ...(projectType !== undefined && { projectType }),
        ...(status !== undefined && { status }),
        ...(inputSchemaJson !== undefined && { inputSchemaJson }),
        ...(outputSchemaJson !== undefined && { outputSchemaJson }),
        ...(flowDefinitionJson !== undefined && { flowDefinitionJson }),
        ...(executionCode !== undefined && { executionCode }),
        ...(methodologyDocumentId !== undefined && { methodologyDocumentId }),
        ...(isPublic !== undefined && { isPublic }),
        updatedByUserId: req.user.id
      }
    });
    res.json(updated);
  })
  .delete(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query as { id: string };
    const updated = await prisma.dataProductDefinition.update({
      where: { id },
      data: { status: 'archived', updatedByUserId: req.user.id }
    });
    res.json(updated);
  });
