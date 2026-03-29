import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const products = await prisma.dataProductDefinition.findMany({
      where: { status: { not: 'archived' } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(products);
  })
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { name, description, productType, audience, projectType } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await prisma.dataProductDefinition.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const product = await prisma.dataProductDefinition.create({
      data: {
        name,
        slug: finalSlug,
        description,
        productType: productType ?? 'calculator',
        audience: audience ?? 'internal',
        projectType,
        createdByUserId: req.user.id
      }
    });
    res.status(201).json(product);
  });
