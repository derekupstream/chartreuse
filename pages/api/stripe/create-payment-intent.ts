import type { NextApiRequest, NextApiResponse } from 'next';

import { defaultHandler } from 'lib/middleware/handler';
import { createPaymentIntent } from 'lib/stripe/createPaymentIntent';

const handler = defaultHandler();

handler.post(createPaymentIntentHandler);

async function createPaymentIntentHandler(req: NextApiRequest, res: NextApiResponse<{ clientSecret: string | null }>) {
  const { stripePrice } = req.body;

  // const org = await prisma.org.findFirstOrThrow({
  //   where: {
  //     id: req.user.orgId
  //   }
  // });

  // if (!org.stripeCustomerId || !org.stripeSubscriptionId) {
  //   res.status(400).end('No subscription found');
  //   return;
  // }

  // const subscription = await getCustomerSubscription({
  //   customerId: org.stripeCustomerId,
  //   subscriptionId: org.stripeSubscriptionId
  // });
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await createPaymentIntent({ price: stripePrice });

  res.status(200).send({
    clientSecret: paymentIntent.client_secret
  });
}

export default handler;
