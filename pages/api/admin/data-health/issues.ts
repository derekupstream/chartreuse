import type { NextApiResponse } from 'next';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { status } = req.query as { status?: string };
  const issues = await prisma.dataHealthIssue.findMany({
    where: status ? { status } : { status: { not: 'resolved' } },
    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }]
  });
  res.json(issues);
});
