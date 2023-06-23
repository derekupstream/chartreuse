import { stripe } from './client';

export function updateStripeCustomer({
  customerId,
  email,
  name
}: {
  customerId: string;
  email?: string;
  name?: string;
}) {
  return stripe.customers.update(customerId, {
    email,
    name
  });
}
