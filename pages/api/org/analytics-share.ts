import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser()
  .put(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const slug = Math.random().toString(36).substr(2, 10);
    const org = await prisma.org.update({
      where: { id: req.user.orgId },
      data: { analyticsSlug: slug },
      select: { analyticsSlug: true }
    });
    return res.json({ analyticsSlug: org.analyticsSlug });
  })
  .delete(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    await prisma.org.update({
      where: { id: req.user.orgId },
      data: { analyticsSlug: null }
    });
    return res.json({ analyticsSlug: null });
  });
