import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { requireUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

export type EmailEventListItem = {
  id: string;
  eventKey: string;
  displayName: string;
  description: string | null;
  enabled: boolean;
  recipientHint: string;
  variables: string[];
  updatedAt: string;
  updatedBy: string | null;
};

const handler = handlerWithUser().use(requireUpstream);

async function list(req: NextApiRequestWithUser, res: NextApiResponse) {
  const items = await prisma.emailEvent.findMany({ orderBy: { displayName: 'asc' } });
  return res.status(200).json({
    items: items.map(e => ({
      id: e.id,
      eventKey: e.eventKey,
      displayName: e.displayName,
      description: e.description,
      enabled: e.enabled,
      recipientHint: e.recipientHint,
      variables: e.variables,
      updatedAt: e.updatedAt.toISOString(),
      updatedBy: e.updatedBy
    })) satisfies EmailEventListItem[]
  });
}

handler.get(list);
export default handler;
