import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { requireUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

export type EmailEventDetail = {
  id: string;
  eventKey: string;
  displayName: string;
  description: string | null;
  enabled: boolean;
  subjectLine: string;
  htmlContent: string;
  textContent: string | null;
  variables: string[];
  recipientHint: string;
  updatedAt: string;
  updatedBy: string | null;
};

export type UpdateBody = {
  subjectLine?: string;
  htmlContent?: string;
  textContent?: string | null;
  enabled?: boolean;
};

const handler = handlerWithUser().use(requireUpstream);

async function get(req: NextApiRequestWithUser, res: NextApiResponse) {
  const ev = await prisma.emailEvent.findUnique({ where: { id: req.query.id as string } });
  if (!ev) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json(toDetail(ev));
}

async function update(req: NextApiRequestWithUser, res: NextApiResponse) {
  const body = (req.body || {}) as UpdateBody;
  const ev = await prisma.emailEvent.update({
    where: { id: req.query.id as string },
    data: {
      ...(body.subjectLine !== undefined ? { subjectLine: body.subjectLine } : {}),
      ...(body.htmlContent !== undefined ? { htmlContent: body.htmlContent } : {}),
      ...(body.textContent !== undefined ? { textContent: body.textContent } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
      updatedBy: req.user.id
    }
  });
  return res.status(200).json(toDetail(ev));
}

function toDetail(ev: NonNullable<Awaited<ReturnType<typeof prisma.emailEvent.findUnique>>>): EmailEventDetail {
  return {
    id: ev.id,
    eventKey: ev.eventKey,
    displayName: ev.displayName,
    description: ev.description,
    enabled: ev.enabled,
    subjectLine: ev.subjectLine,
    htmlContent: ev.htmlContent,
    textContent: ev.textContent,
    variables: ev.variables,
    recipientHint: ev.recipientHint,
    updatedAt: ev.updatedAt.toISOString(),
    updatedBy: ev.updatedBy
  };
}

handler.get(get).patch(update);
export default handler;
