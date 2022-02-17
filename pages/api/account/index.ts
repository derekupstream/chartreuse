import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import prisma from 'lib/prisma'
import mailgun from 'lib/mailgun'
import { Prisma, Account, Invite } from '@prisma/client'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).post(createAccount)

type Response = {
  account: Account
}

async function createAccount(req: NextApiRequestWithUser, res: NextApiResponse<Response>) {
  const { name, email, useOrgEmail } = req.body

  const account = await prisma.account.create<Prisma.AccountCreateArgs>({
    data: {
      name,
      accountContactEmail: email,
      org: {
        connect: {
          id: req.user.orgId,
        },
      },
      ...(useOrgEmail
        ? {}
        : {
            invites: {
              create: [
                {
                  email,
                  orgId: req.user.orgId,
                  sentByUserId: req.user.id,
                },
              ],
            },
          }),
    },
    include: {
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

  if (!useOrgEmail) {
    const invite = ((account as any).invites || []).find((i: Invite) => i.email === email)
    console.log('send invite')
    await mailgun.messages().send({
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

  return res.status(200).json({ account })
}

export default handler
