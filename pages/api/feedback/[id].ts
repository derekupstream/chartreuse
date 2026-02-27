import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });

  const updated = await prisma.feedbackSubmission.update({
    where: { id: id as string },
    data: { status }
  });

  res.json(updated);
});
