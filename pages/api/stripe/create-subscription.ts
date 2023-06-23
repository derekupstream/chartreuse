import type { Prisma } from '@prisma/client';
import { Role } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuid } from 'uuid';

import { defaultHandler } from 'lib/middleware/handler';
import prisma from 'lib/prisma';
import { createSubscription } from 'lib/stripe/createSubscription';

const handler = defaultHandler();

export type TrialRequestBody = {
  id: string;
  name: string;
  phone?: string;
  email: string;
  title?: string;
};

handler.post(createTrial);

async function createTrial(req: NextApiRequest, res: NextApiResponse<Response>) {
  const { id, name, email, title, phone } = req.body as TrialRequestBody;

  const orgId = uuid();

  const { customer, subscription } = await createSubscription({
    customerName: name,
    email,
    orgId
  });

  await prisma.user.create<Prisma.UserCreateArgs>({
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
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
          name: ''
        }
      }
    }
  });

  return res.status(200).end();
}

export default handler;
