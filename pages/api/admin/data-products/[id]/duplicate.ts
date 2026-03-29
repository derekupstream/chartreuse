import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query as { id: string };
  const source = await prisma.dataProductDefinition.findUnique({ where: { id } });
  if (!source) return res.status(404).json({ error: 'Data product not found' });

  const slug = `${source.slug}-copy-${Date.now()}`;
  const copy = await prisma.dataProductDefinition.create({
    data: {
      name: `${source.name} (Copy)`,
      slug,
      description: source.description,
      productType: source.productType,
      audience: source.audience,
      projectType: source.projectType,
      inputSchemaJson: source.inputSchemaJson ?? undefined,
      outputSchemaJson: source.outputSchemaJson ?? undefined,
      flowDefinitionJson: source.flowDefinitionJson ?? undefined,
      methodologyDocumentId: source.methodologyDocumentId,
      status: 'draft',
      createdByUserId: req.user.id
    }
  });
  res.status(201).json(copy);
});
