import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query;
    const doc = await prisma.methodologyDocument.findUnique({ where: { id: id as string } });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  })
  .patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query;
    const { title, slug, content, status, order } = req.body;

    const data: Record<string, any> = {};
    if (title !== undefined) data.title = title;
    if (slug !== undefined) data.slug = slug;
    if (content !== undefined) data.content = content;
    if (order !== undefined) data.order = order;
    if (status !== undefined) {
      data.status = status;
      data.publishedAt = status === 'published' ? new Date() : null;
    }

    const updated = await prisma.methodologyDocument.update({
      where: { id: id as string },
      data
    });
    res.json(updated);
  })
  .delete(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query;
    await prisma.methodologyDocument.delete({ where: { id: id as string } });
    res.json({ ok: true });
  });
