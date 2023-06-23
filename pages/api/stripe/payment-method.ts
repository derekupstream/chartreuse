import type { NextApiRequest, NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser } from 'lib/middleware/handler';
import prisma from 'lib/prisma';
import { createDefaultPaymentMethod } from 'lib/stripe/createPaymentMethod';
import { getCustomerSubscription } from 'lib/stripe/getCustomerSubscription';
import { endSubscriptionTrial } from 'lib/stripe/subscriptions';

const handler = handlerWithUser();

handler.post(createPaymentMethodHandler);

async function createPaymentMethodHandler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { customerId, paymentMethodId } = req.body;
  const org = await prisma.org.findFirstOrThrow({
    where: {
      id: req.user.orgId
    }
  });

  if (!org.stripeCustomerId || !org.stripeSubscriptionId) {
    res.status(400).end('No subscription found');
    return;
  }
  const { subscription } = await getCustomerSubscription({
    customerId: org.stripeCustomerId,
    subscriptionId: org.stripeSubscriptionId
  });

  // find the setup intent to use: https://stripe.com/docs/payments/save-and-reuse?platform=web&ui=checkout#use-payment-method
  const setupIntentId =
    typeof subscription.pending_setup_intent === 'string'
      ? subscription.pending_setup_intent
      : subscription.pending_setup_intent?.id;

  await createDefaultPaymentMethod({ customerId, paymentMethodId, setupIntentId });

  if (true) {
    await endSubscriptionTrial({ subscriptionId: org.stripeSubscriptionId });
  }
  res.status(200).end();
}

export default handler;
