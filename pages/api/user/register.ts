import { Role } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuid } from 'uuid';

import { defaultHandler } from 'lib/middleware/handler';
import prisma from 'lib/prisma';
import { trackEvent } from 'lib/tracking';

export type RegisterRequestBody = {
  id: string;
  name: string;
  phone?: string;
  email: string;
  title?: string;
  orgName: string;
};

const handler = defaultHandler();

handler.post(async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, name, email, title, phone, orgName } = req.body as RegisterRequestBody;

  const orgId = uuid();

  const user = await prisma.user.create({
    data: {
      id,
      name,
      email,
      title,
      phone,
      role: Role.ORG_ADMIN,
      org: {
        create: {
          id: orgId,
          name: orgName.trim()
        }
      }
    }
  });

  await prisma.account.create({
    data: {
      name: orgName.trim(),
      accountContactEmail: email,
      org: { connect: { id: user.orgId } }
    }
  });

  await trackEvent({ type: 'signup', userId: user.id });

  return res.status(200).end();
});

export default handler;
