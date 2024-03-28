// @ts-nocheck
import type { Stripe } from 'stripe';

import { stripe } from './client';
// import { subscriptionProductId, tiers } from './config';
import { subscriptionProductId } from './config';
import type { ProductTier, ProductTierSettings } from './config';

export type SubscriptionProduct = Awaited<ReturnType<typeof getSubscriptionProduct>>;

// export a method to retrieve product and  prices
export async function getSubscriptionProduct() {
  const product = await stripe.products.retrieve(subscriptionProductId);
  const { data: prices } = await stripe.prices.list({
    product: subscriptionProductId,
    active: true,
    expand: ['data.tiers']
  });
  // const priceMap = prices.reduce<Record<string, Stripe.Price>>((acc, price) => {
  //   acc[price.id] = price;
  //   return acc;
  // }, {});
  // const tiersWithPrices = Object.entries(tiers).reduce<Record<ProductTier, ProductTierSettings>>(
  //   (acc, [tierKey, tier]) => {
  //     const price = priceMap[tier.stripePrice];
  //     if (!price) {
  //       console.error(`No price found for tier ${tierKey}: ${tier.stripePrice}`);
  //       // @ts-ignore
  //       acc[tierKey] = tier;
  //     } else {
  //       // @ts-ignore
  //       acc[tierKey] = {
  //         // ...tier,
  //         id: tierKey,
  //         monthlyAmount: price.tiers?.[0].flat_amount,
  //         projectLimit: price.tiers?.[0].up_to,
  //         additionalProjectCost: price.tiers?.[1].unit_amount
  //       };
  //     }
  //     return acc;
  //   },
  //   {} as any
  // );
  // return { product, prices, tiers: tiersWithPrices };
  return { product, prices };
}
