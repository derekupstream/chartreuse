import type { User, Prisma } from '@prisma/client';
import { Role } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { defaultHandler } from 'lib/middleware/handler';
import prisma from 'lib/prisma';
import { trackEvent } from 'lib/tracking';

const handler = defaultHandler();

type Response = {
  user?: User;
  error?: string;
};

handler.post(createOrg);

async function createOrg(req: NextApiRequest, res: NextApiResponse<Response>) {
  const { id, name, email, title, orgName, numberOfClientAccounts, phone } = req.body;

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
          metadata: { numberOfClientAccounts }
        }
      }
    }
  });

  await trackEvent({
    type: 'signup',
    userId: id
  });

  return res.status(200).json({ user });
}

export default handler;
