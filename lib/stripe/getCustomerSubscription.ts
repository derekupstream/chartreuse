import type { Stripe } from 'stripe';

import { stripe } from './client';
// import { tiers } from './config';
import type { ProductTier, ProductTierSettings } from './config';
import { endSubscriptionTrial } from './subscriptions';
export type SubscriptionStatus = 'Active' | 'Trial' | 'Canceled' | 'Expired_Trial';

export type SubscriptionResponse = {
  customer: Stripe.Response<Stripe.Customer> | Stripe.DeletedCustomer;
  subscription: Stripe.Response<Stripe.Subscription>;
  paymentMethod: Stripe.PaymentMethod | null;
  subscriptionStatus: SubscriptionStatus;
  // tier: ProductTierSettings;
  trialEndDate?: string;
};

export async function getCustomerSubscription({
  customerId,
  subscriptionId
}: {
  customerId: string;
  subscriptionId: string;
}): Promise<SubscriptionResponse> {
  let subscription = await _getSubscription(subscriptionId);
  const customer = await stripe.customers.retrieve(customerId, {
    expand: ['invoice_settings.default_payment_method']
  });
  const paymentMethod = (subscription.default_payment_method ||
    (customer as Stripe.Customer).invoice_settings.default_payment_method) as Stripe.PaymentMethod | null;

  // Cancel the trial once we have a payment method, since users add it thru a special Stripe linke
  // TODO: add a webhook that responds immediately, or host the checkout on our own domain
  if (paymentMethod && subscription.status === 'trialing') {
    console.log('Ending trial subscription now that user has applied a payment method', {
      customerId,
      subscriptionId
    });
    await endSubscriptionTrial({ subscriptionId });
    subscription = await _getSubscription(subscriptionId);
  }
  // calculate status
  let subscriptionStatus: SubscriptionStatus = 'Active';
  const status = subscription.status;
  if ((status === 'paused' || status === 'canceled') && !paymentMethod) {
    subscriptionStatus = 'Expired_Trial';
  } else if (status === 'trialing') {
    subscriptionStatus = 'Trial';
  } else if (status === 'canceled') {
    subscriptionStatus = 'Canceled';
  }

  // calculate trial end
  const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined;
  const validTrialEndDate = trialEndDate && trialEndDate > new Date() ? trialEndDate : undefined;

  // const { data: prices } = await stripe.prices.list({
  //   product: subscription.items.data[0].price.product as string,
  //   active: true,
  //   expand: ['data.tiers']
  // });
  // const price = prices.find(price => price.id === subscription.items.data[0].price.id);
  // const isTrial = validTrialEndDate || subscriptionStatus === 'Trial' || subscriptionStatus === 'Expired_Trial';
  // const _tier = isTrial
  //   ? (['trial', tiers.trial] as const)
  //   : Object.entries(tiers || {}).find(
  //       ([, tier]) => !!tier.monthlyAmount && tier.stripePrice === subscription.items.data[0].price.id
  //     );
  // const tier: ProductTierSettings = {
  //   ...(_tier?.[1] || tiers.trial),
  //   id: (_tier?.[0] || 'trial') as ProductTier,
  //   monthlyAmount: price?.tiers?.[0].flat_amount || 0,
  //   projectLimit: 2, //price?.tiers?.[0].up_to || 1,
  //   additionalProjectCost: price?.tiers?.[1].unit_amount || 0
  // };

  return {
    customer,
    paymentMethod,
    subscription,
    subscriptionStatus,
    // tier,
    trialEndDate: validTrialEndDate?.toISOString()
  };
}

function _getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['latest_invoice.payment_intent', 'default_payment_method']
  });
}
