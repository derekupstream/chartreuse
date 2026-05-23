import type { Invite } from '@prisma/client';
import { Prisma, User, Org } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { sendEvent } from 'lib/email/sendEvent';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).post(sendInvite);

type Response = {
  invite: Invite;
};

async function sendInvite(req: NextApiRequestWithUser, res: NextApiResponse<Response>) {
  const { email, accountId } = req.body;
  const orgId = req.user.orgId;
  const userId = req.user.id;
  const invite = await prisma.invite.create({
    data: {
      email,
      sentBy: {
        connect: {
          id: userId
        }
      },
      account: accountId
        ? {
            connect: {
              id: accountId
            }
          }
        : undefined,
      org: {
        connect: {
          id: orgId
        }
      }
    },
    include: {
      org: true
    }
  });

  await sendEvent('member-invite', {
    to: email,
    vars: {
      inviterName: req.user.name,
      inviterJobTitle: req.user.title,
      inviterOrg: invite.org.name,
      inviteUrl: `${req.headers.origin}/accept?inviteId=${invite.id}`
    }
  });

  return res.status(200).json({ invite });
}

export default handler;
