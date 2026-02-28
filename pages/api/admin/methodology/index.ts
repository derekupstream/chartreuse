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
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, slug: true, status: true, createdAt: true, publishedAt: true }
    });
    res.json(docs);
  })
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { title, slug, content } = req.body;
    if (!title || !slug || !content) return res.status(400).json({ error: 'title, slug, and content required' });

    const doc = await prisma.methodologyDocument.create({
      data: { title, slug, content, status: 'draft' }
    });
    res.status(201).json(doc);
  });
