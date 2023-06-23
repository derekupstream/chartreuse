// import { monthlyCost } from 'lib/stripe/config';

import { stripe } from './client';

export async function createPaymentIntent({ price }: { price: string }) {
  // TODO: Support other prices. maybe consider different types of products?
  const amount = 10;

  return stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    setup_future_usage: 'off_session',
    automatic_payment_methods: {
      enabled: true
    }
  });
}
