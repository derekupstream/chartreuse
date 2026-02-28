import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const docs = await prisma.methodologyDocument.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, title: true, slug: true, status: true, order: true, createdAt: true, publishedAt: true }
    });
    res.json(docs);
  })
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { title, slug, content } = req.body;
    if (!title || !slug) return res.status(400).json({ error: 'title and slug are required' });

    try {
      // Place new subsection at the end
      const last = await prisma.methodologyDocument.findFirst({ orderBy: { order: 'desc' } });
      const order = (last?.order ?? -1) + 1;

      // Handle slug uniqueness — append a suffix if needed
      let finalSlug = slug;
      const existing = await prisma.methodologyDocument.findUnique({ where: { slug } });
      if (existing) finalSlug = `${slug}-${Date.now()}`;

      const doc = await prisma.methodologyDocument.create({
        data: { title, slug: finalSlug, content: content ?? {}, status: 'draft', order }
      });
      res.status(201).json(doc);
    } catch (e: any) {
      console.error('methodology create error:', e);
      res.status(500).json({ error: e.message || 'Failed to create subsection' });
    }
  });
