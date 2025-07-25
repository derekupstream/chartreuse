import type { NextApiResponse } from 'next';

import { sendEventOnce } from 'lib/mailchimp/sendEvent';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser } from 'lib/middleware/handler';
import prisma from 'lib/prisma';
import { updateStripeCustomer } from 'lib/stripe/updateStripeCustomer';
import { trackEvent } from 'lib/tracking';

const handler = handlerWithUser();

export type RequestBody = {
  numberOfClientAccounts: number;
  orgName: string;
  currency: string;
  useMetricSystem: boolean;
  useShrinkageRate: boolean;
};

handler.post(createOrg);

async function createOrg(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { orgName, numberOfClientAccounts, currency, useMetricSystem, useShrinkageRate } = req.body as RequestBody;

  // an empty org should have vbeen created when user starts a free trial
  const org = await prisma.org.update({
    where: {
      id: req.user.orgId
    },
    data: {
      name: orgName.trim(),
      currency: currency,
      useMetricSystem: useMetricSystem,
      useShrinkageRate: useShrinkageRate,
      metadata: { numberOfClientAccounts, currency }
    }
  });

  if (org.stripeCustomerId) {
    await updateStripeCustomer({
      customerId: org.stripeCustomerId,
      name: orgName
    });
  }

  await trackEvent({
    type: 'signup',
    userId: req.user.id
  });
  // send event to mailchimp
  await sendEventOnce('signed_up', {
    userId: req.user.id,
    email: req.user.email
  });

  return res.status(200).end();
}

export default handler;
