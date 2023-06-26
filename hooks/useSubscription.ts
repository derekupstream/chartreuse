import { formatDistance } from 'date-fns';
import type { Stripe } from 'stripe';

import { useGetSubscription } from 'lib/api';
import type { SubscriptionStatus } from 'lib/stripe/getCustomerSubscription';

// export const useStripe = () => useContext(StripeContext);

const subscriptionColors: Record<SubscriptionStatus, string> = {
  Active: 'success',
  Canceled: 'error',
  Expired_Trial: 'error',
  Trial: 'blue'
};

export function useSubscription() {
  const { data: stripeData, isLoading, mutate } = useGetSubscription();

  const subscriptionStatus = stripeData?.subscriptionStatus;

  // calculate trial end
  const trialEndDate = stripeData?.trialEndDate && new Date(stripeData?.trialEndDate);
  const monthlyRateCents = stripeData?.subscription.items.data[0]?.price.unit_amount;
  const subscription = {
    customer: stripeData?.customer as Stripe.Customer | undefined,
    refresh: mutate,
    paymentMethod: stripeData?.paymentMethod,
    subscription: stripeData?.subscription,
    trialEndDate,
    trialEndDateRelative: trialEndDate ? formatDistance(trialEndDate, new Date()) : undefined,
    isLoading,
    isActive: subscriptionStatus === 'Active' || subscriptionStatus === 'Trial',
    // currentTier: stripeData?.tier?.id,
    // tier: stripeData?.tier,
    monthlyRate: monthlyRateCents ? monthlyRateCents / 100 : undefined,
    subscriptionStatus,
    subscriptionColor: subscriptionStatus && subscriptionColors[subscriptionStatus]
  };

  // console.log('Account subscription', subscription);

  return subscription;
}
