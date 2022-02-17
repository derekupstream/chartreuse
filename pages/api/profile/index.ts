import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { User, Prisma, Role } from '@prisma/client'

type Response = {
  user?: User
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method === 'POST') {
    try {
      const { id, name, email, title, phone, orgId, accountId, inviteId } = req.body

      const user = await prisma.user.create<Prisma.UserCreateArgs>({
        data: {
          id,
          name,
          email,
          title,
          phone,
          role: Role.ACCOUNT_ADMIN,
          org: {
            connect: {
              id: orgId,
            },
          },
          account: accountId
            ? {
                connect: {
                  id: accountId,
                },
              }
            : undefined,
        },
      })

      if (accountId) {
        const account = await prisma.account.findFirst({
          where: { id: accountId },
        })
        if (!account?.accountContactEmail) {
          await prisma.account.update<Prisma.AccountUpdateArgs>({
            where: {
              id: accountId,
            },
            data: {
              accountContactEmail: email,
            },
          })
        }
      }

      if (inviteId) {
        await prisma.invite.update<Prisma.InviteUpdateArgs>({
          where: {
            id: inviteId,
          },
          data: {
            accepted: true,
          },
        })
      }

      return res.status(200).json({ user })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ error: 'Method not allowed' })
}
