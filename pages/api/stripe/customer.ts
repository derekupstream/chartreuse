import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser } from 'lib/middleware/handler';
import prisma from 'lib/prisma';
import type { SubscriptionResponse } from 'lib/stripe/getCustomerSubscription';
import { updateStripeCustomer } from 'lib/stripe/updateStripeCustomer';

const handler = handlerWithUser();

handler.put(updateCustomer);

async function updateCustomer(req: NextApiRequestWithUser, res: NextApiResponse<SubscriptionResponse>) {
  const org = await prisma.org.findFirstOrThrow({
    where: {
      id: req.user.orgId
    }
  });

  if (!org.stripeCustomerId) {
    res.status(400).end('No subscription found');
    return;
  }

  const email = req.body.email;
  if (!email) {
    throw new Error('No email provided');
  }

  await updateStripeCustomer({
    customerId: org.stripeCustomerId,
    email
  });

  return res.status(200).end();
}

export default handler;
