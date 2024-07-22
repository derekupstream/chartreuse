import type { Prisma } from '@prisma/client';
import { Role } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuid } from 'uuid';
import { sendEventOnce } from 'lib/mailchimp/sendEvent';

import { trackEvent } from 'lib/tracking';
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
  orgName: string;
};

handler.post(createTrial);

async function createTrial(req: NextApiRequest, res: NextApiResponse<Response>) {
  const { id, name, email, title, phone, orgName } = req.body as TrialRequestBody;

  const orgId = uuid();

  const { customer, subscription } = await createSubscription({
    customerName: name,
    email,
    orgId
  });

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
          id: orgId,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
          name: orgName.trim()
        }
      }
    }
  });

  const account = await prisma.account.create({
    data: {
      name: orgName.trim(),
      accountContactEmail: email,
      org: {
        connect: {
          id: user.orgId
        }
      }
    },
    include: {
      org: true,
      invites: {
        where: {
          email
        },
        include: {
          sentBy: {
            include: {
              org: true
            }
          }
        }
      }
    }
  });

  await trackEvent({
    type: 'signup',
    userId: user.id
  });
  await trackEvent({
    type: 'create_account',
    userId: user.id,
    props: {
      accountName: account.name
    }
  });

  // send event to mailchimp
  await sendEventOnce('signed_up', {
    userId: user.id,
    email: user.email
  });

  return res.status(200).end();
}

export default handler;
