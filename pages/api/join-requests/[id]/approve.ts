import type { NextApiResponse } from 'next';

import { sendEmail } from 'lib/mailgun';
import { handlerWithUser } from 'lib/middleware';
import type { NextApiRequestWithUser } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();

async function approve(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.user.role !== 'ORG_ADMIN') {
    return res.status(403).json({ error: 'Only org admins can approve join requests' });
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

  const existing = await prisma.user.findUnique({ where: { email: joinRequest.email } });
  if (existing) {
    return res.status(409).json({ error: 'A user with that email already exists' });
  }

  const placeholderId = `pending-${joinRequest.id}`;

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: placeholderId,
        email: joinRequest.email,
        name: joinRequest.name,
        role: 'MEMBER',
        orgId: joinRequest.orgId
      }
    }),
    prisma.joinRequest.update({
      where: { id: joinRequest.id },
      data: { status: 'approved', decidedAt: new Date(), decidedById: req.user.id }
    })
  ]);

  const origin = req.headers.origin || `https://${req.headers.host}`;
  try {
    await sendEmail({
      from: 'Chart-Reuse <hello@chart-reuse.eco>',
      to: joinRequest.email,
      subject: `You've been approved to join ${joinRequest.org.name} on Chart-Reuse`,
      template: 'join-request-approved',
      'v:requesterName': joinRequest.name,
      'v:orgName': joinRequest.org.name,
      'v:loginUrl': `${origin}/login`
    });
  } catch (err) {
    console.error('Failed to send approval email', err);
  }

  return res.status(200).json({ ok: true });
}

handler.post(approve);
export default handler;
