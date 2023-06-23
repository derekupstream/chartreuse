import { stripe } from './client';

export async function cancelSubscription({ subscriptionId }: { subscriptionId: string }) {
  // const subscription = await stripe.subscriptions.cancel(subscriptionId);
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
    // cancel trials immediately
    trial_end: 'now'
  });
  return subscription;
}

export async function updateSubscriptionPrice({ subscriptionId, price }: { subscriptionId: string; price: string }) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return stripe.subscriptions.update(subscriptionId, {
    proration_behavior: 'create_prorations',
    items: [
      {
        id: subscription.items.data[0].id,
        price
      }
    ]
  });
}

export async function endSubscriptionTrial({ subscriptionId }: { subscriptionId: string }) {
  await stripe.subscriptions.update(subscriptionId, {
    trial_end: 'now'
  });
}
