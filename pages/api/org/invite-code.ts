import type { NextApiResponse } from 'next';
import { randomBytes } from 'crypto';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();

export type RequestBody = {
  enabled: boolean;
};

function generateInviteCode(): string {
  // Generate a random 8-character alphanumeric code
  return randomBytes(4).toString('hex').toUpperCase();
}

async function updateInviteCode(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.user.role !== 'ORG_ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { enabled } = req.body as RequestBody;

  let inviteCode: string | null = null;

  if (enabled) {
    // Generate a unique invite code
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = generateInviteCode();
      const existing = await prisma.org.findUnique({
        where: { orgInviteCode: code }
      });
      if (!existing) {
        isUnique = true;
        inviteCode = code;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ message: 'Failed to generate unique invite code' });
    }
  }

  const org = await prisma.org.update({
    where: {
      id: req.user.orgId
    },
    data: {
      orgInviteCode: inviteCode
    }
  });

  return res.status(200).json({ orgInviteCode: org.orgInviteCode });
}

handler.post(updateInviteCode);

export default handler;
