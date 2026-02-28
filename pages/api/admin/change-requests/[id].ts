import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query as { id: string };
  const { status, reviewNotes } = req.body;
  if (!status || !['approved', 'rejected', 'implemented'].includes(status))
    return res.status(400).json({ error: 'status must be approved, rejected, or implemented' });

  const cr = await prisma.changeRequest.findUnique({ where: { id } });
  if (!cr) return res.status(404).json({ error: 'Change request not found' });

  const updated = await prisma.changeRequest.update({
    where: { id },
    data: {
      status,
      reviewNotes,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      ...(status === 'implemented' && {
        implementedBy: req.user.id,
        implementedAt: new Date()
      })
    },
    include: { factor: { select: { id: true, name: true } } }
  });
  res.json(updated);
});
