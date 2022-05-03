import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { User, Prisma, Role } from '@prisma/client'
import { trackEvent } from 'lib/tracking'
import { defaultHandler } from 'lib/middleware/handler'

const handler = defaultHandler()

type Response = {
  user?: User
  error?: string
}

handler.post(createOrg)

async function createOrg(req: NextApiRequest, res: NextApiResponse<Response>) {
  const { id, name, email, title, orgName, numberOfClientAccounts, phone } = req.body

  const user = await prisma.user.create<Prisma.UserCreateArgs>({
    data: {
      id,
      name,
      email,
      title,
      phone,
      role: Role.ORG_ADMIN,
      org: {
        create: {
          name: orgName,
          metadata: { numberOfClientAccounts },
        },
      },
    },
  })

  trackEvent({
    type: 'signup',
    orgName: name,
    userEmail: email,
  })

  return res.status(200).json({ user })
}

export default handler
