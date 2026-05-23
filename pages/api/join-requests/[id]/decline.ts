import type { NextApiResponse } from 'next';

import { sendEmail } from 'lib/mailgun';
import { handlerWithUser } from 'lib/middleware';
import type { NextApiRequestWithUser } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();

async function decline(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.user.role !== 'ORG_ADMIN') {
    return res.status(403).json({ error: 'Only org admins can decline join requests' });
  }

  const id = req.query.id as string;
  const joinRequest = await prisma.joinRequest.findUnique({
    where: { id },
    include: { org: { select: { id: true, name: true } } }
  });
  if (!joinRequest) {
    return res.status(404).json({ error: 'Join request not found' });
  }
  if (joinRequest.orgId !== req.user.orgId) {
    return res.status(403).json({ error: 'Join request belongs to a different org' });
  }
  if (joinRequest.status !== 'pending') {
    return res.status(409).json({ error: `Join request is already ${joinRequest.status}` });
  }

  await prisma.joinRequest.update({
    where: { id: joinRequest.id },
    data: { status: 'declined', decidedAt: new Date(), decidedById: req.user.id }
  });

  try {
    await sendEmail({
      from: 'Chart-Reuse <hello@chart-reuse.eco>',
      to: joinRequest.email,
      subject: `Your request to join ${joinRequest.org.name} on Chart-Reuse`,
      template: 'join-request-declined',
      'v:requesterName': joinRequest.name,
      'v:orgName': joinRequest.org.name
    });
  } catch (err) {
    console.error('Failed to send decline email', err);
  }

  return res.status(200).json({ ok: true });
}

handler.post(decline);
export default handler;
