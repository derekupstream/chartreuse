import { trialProductId } from 'lib/stripe/config';

import { stripe } from './client';
import { trialPeriodDays } from './config';

type CreateTrialInput = {
  email: string;
  orgId: string;
  customerName?: string;
};

export async function createSubscription({ email, orgId, customerName }: CreateTrialInput) {
  const customer = await stripe.customers.create({
    email,
    name: customerName,
    metadata: {
      orgId
    }
  });
  console.log('customer', customer);
  const product = await stripe.products.retrieve(trialProductId);
  const subscription = await stripe.subscriptions.create({
    metadata: {
      orgId
    },
    customer: customer.id,
    items: [
      {
        price: product.default_price as string
      }
    ],
    payment_settings: {
      save_default_payment_method: 'on_subscription'
    },
    // read about free trials: https://stripe.com/docs/billing/subscriptions/trials#combine-trial-anchor
    trial_period_days: trialPeriodDays,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'pause' // can 'cancel' or 'pause' if we dont want to cancel subscription, or 'create_invoice' to leave it in past-due state
      }
    }
  });

  return { customer, subscription };
}
