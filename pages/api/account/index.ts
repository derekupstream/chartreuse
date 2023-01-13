import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import prisma from 'lib/prisma'
import { sendEmail } from 'lib/mailgun'
import { Invite } from '@prisma/client'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'
import { trackEvent } from 'lib/tracking'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).post(createAccount)

type Response = {
  invitedUser: boolean
}

async function createAccount(req: NextApiRequestWithUser, res: NextApiResponse<Response>) {
  const { name, email, USState } = req.body

  const invitedUser = email !== req.user.email

  const account = await prisma.account.create({
    data: {
      name,
      accountContactEmail: email,
      USState,
      org: {
        connect: {
          id: req.user.orgId,
        },
      },
      ...(invitedUser
        ? {
            invites: {
              create: [
                {
                  email,
                  orgId: req.user.orgId,
                  sentByUserId: req.user.id,
                },
              ],
            },
          }
        : {}),
    },
    include: {
      org: true,
      invites: {
        where: {
          email,
        },
        include: {
          sentBy: {
            include: {
              org: true,
            },
          },
        },
      },
    },
  })

  if (invitedUser) {
    const invite = ((account as any).invites || []).find((i: Invite) => i.email === email)
    await sendEmail({
      from: 'Chart Reuse <hello@chartreuse.eco>',
      to: email,
      subject: `Invite from ${invite.sentBy.name} to join Chart Reuse`,
      template: 'invite',
      'v:inviterName': invite.sentBy.name,
      'v:inviterJobTitle': invite.sentBy.title,
      'v:inviterOrg': invite.sentBy.org.name,
      'v:inviteUrl': `${req.headers.origin}/accept?inviteId=${invite.id}`,
    })
  }

  await trackEvent({
    type: 'create_account',
    userId: req.user.id,
    props: {
      accountName: account.name,
    },
  })

  return res.status(200).json({ invitedUser })
}

export default handler
