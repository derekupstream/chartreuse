import type { NextApiResponse } from 'next';

import { sendEvent } from 'lib/email/sendEvent';
import { handlerWithUser } from 'lib/middleware';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { requireUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

const handler = handlerWithUser().use(requireUpstream);

async function testSend(req: NextApiRequestWithUser, res: NextApiResponse) {
  const ev = await prisma.emailEvent.findUnique({ where: { id: req.query.id as string } });
  if (!ev) return res.status(404).json({ error: 'Not found' });

  const { to } = (req.body || {}) as { to?: string };
  const recipient = to?.trim() || req.user.email;
  if (!recipient) return res.status(400).json({ error: 'No recipient' });

  // Sample variable values so the template renders something sensible in preview
  const sampleVars: Record<string, string> = {};
  for (const v of ev.variables) {
    sampleVars[v] = SAMPLE_VARS[v] ?? `{sample-${v}}`;
  }

  await sendEvent(ev.eventKey, { to: recipient, vars: sampleVars });
  return res.status(200).json({ ok: true, sentTo: recipient });
}

const SAMPLE_VARS: Record<string, string> = {
  inviterName: 'Jane Doe',
  inviterJobTitle: 'Sustainability Lead',
  inviterOrg: 'Acme Cafes',
  inviteUrl: 'https://chartreuse-bay.vercel.app/accept?inviteId=sample',
  requesterName: 'John Smith',
  requesterEmail: 'john@example.com',
  requesterMessage: "I'd love to help with our team's reusables program.",
  orgName: 'Acme Cafes',
  membersUrl: 'https://chartreuse-bay.vercel.app/members',
  loginUrl: 'https://chartreuse-bay.vercel.app/login'
};

handler.post(testSend);
export default handler;
