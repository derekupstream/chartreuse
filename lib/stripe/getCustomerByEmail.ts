import { stripe } from './client';

type Result = {
  customerId?: string;
  subscriptionId?: string;
};

export async function getCustomerByEmail(email: string): Promise<Result> {
  const result = await stripe.customers.list({ email, expand: ['data.subscriptions'] });

  // ref: https://stripe.com/docs/api/customers/object
  const customer = result.data[0];

  // ref: https://stripe.com/docs/api/subscriptions/retrieve
  const subscription = customer?.subscriptions?.data[0];

  return {
    customerId: customer?.id,
    subscriptionId: subscription?.id
  };
}
