import type { NextApiResponse } from 'next';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

export default handlerWithUser().patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query as { id: string };
  const { status, note } = req.body as { status: string; note?: string };

  if (!status || !['acknowledged', 'resolved'].includes(status))
    return res.status(400).json({ error: 'status must be acknowledged or resolved' });

  const updated = await prisma.dataHealthIssue.update({
    where: { id },
    data: {
      status,
      note: note || null,
      ...(status === 'acknowledged' && {
        acknowledgedAt: new Date(),
        acknowledgedByUserId: req.user.id
      })
    }
  });
  res.json(updated);
});
