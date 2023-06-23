import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser } from 'lib/middleware/handler';
import prisma from 'lib/prisma';
import type { SubscriptionResponse } from 'lib/stripe/getCustomerSubscription';
import { getCustomerSubscription } from 'lib/stripe/getCustomerSubscription';
import { cancelSubscription, updateSubscriptionPrice } from 'lib/stripe/subscriptions';

const handler = handlerWithUser();

handler.get(getSubscriptionHandler).put(updateSubscriptionHandler).delete(cancelSubscriptionHandler);

async function getSubscriptionHandler(req: NextApiRequestWithUser, res: NextApiResponse<SubscriptionResponse>) {
  const org = await prisma.org.findFirstOrThrow({
    where: {
      id: req.user.orgId
    }
  });

  if (!org.stripeCustomerId || !org.stripeSubscriptionId) {
    res.status(400).end('No subscription found');
    return;
  }

  const subscription = await getCustomerSubscription({
    customerId: org.stripeCustomerId,
    subscriptionId: org.stripeSubscriptionId
  });

  return res.status(200).send(subscription);
}

async function updateSubscriptionHandler(req: NextApiRequestWithUser, res: NextApiResponse<SubscriptionResponse>) {
  const org = await prisma.org.findFirstOrThrow({
    where: {
      id: req.user.orgId
    }
  });

  if (!org.stripeCustomerId || !org.stripeSubscriptionId) {
    res.status(400).end('No subscription found');
    return;
  }

  const stripePrice = req.body.stripePrice;
  if (typeof stripePrice !== 'string') {
    throw new Error('No plan provided');
  }

  await updateSubscriptionPrice({
    price: stripePrice,
    subscriptionId: org.stripeSubscriptionId
  });

  return res.status(200).end();
}

async function cancelSubscriptionHandler(req: NextApiRequestWithUser, res: NextApiResponse<Response>) {
  const org = await prisma.org.findFirstOrThrow({
    where: {
      id: req.user.orgId
    }
  });

  if (!org.stripeCustomerId || !org.stripeSubscriptionId) {
    res.status(400).end('No subscription found');
    return;
  }

  await cancelSubscription({
    subscriptionId: org.stripeSubscriptionId
  });

  return res.status(200).end();
}

export default handler;
