import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma, Invite, User, Org } from '@prisma/client'
import { sendEmail } from 'lib/mailgun'
import nc from 'next-connect'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).post(sendInvite)

type Response = {
  invite: Invite
}

async function sendInvite(req: NextApiRequestWithUser, res: NextApiResponse<Response>) {
  const { email, accountId } = req.body
  const orgId = req.user.orgId
  const userId = req.user.id
  const invite = await prisma.invite.create({
    data: {
      email,
      sentBy: {
        connect: {
          id: userId,
        },
      },
      account: accountId
        ? {
            connect: {
              id: accountId,
            },
          }
        : undefined,
      org: {
        connect: {
          id: orgId,
        },
      },
    },
    include: {
      org: true,
    },
  })

  await sendEmail({
    from: 'Chart Reuse <hello@chartreuse.eco>',
    to: email,
    subject: `Invite from ${req.user.name} to join Chart Reuse`,
    template: 'invite',
    'v:inviterName': req.user.name,
    'v:inviterJobTitle': req.user.title,
    'v:inviterOrg': invite.org.name,
    'v:inviteUrl': `${req.headers.origin}/accept?inviteId=${invite.id}`,
  })

  return res.status(200).json({ invite })
}

export default handler
