export const trialPeriodDays = 30;

export type ProductTier = 'trial' | 'tier_1' | 'tier_2' | 'tier_3';
export type ProductTierSettings = {
  id: ProductTier;
  stripePrice: string;
  name: string;
  monthlyAmount: number;
  projectLimit: number;
  additionalProjectCost: number;
  revenue: string;
};

const nodeEnv = process.env.NODE_ENV as 'production' | 'development';

// special placeholder product that has 0.00 price. we need something just to create a free trial
// TODO: should we just list products, search for one and generate a new one if it doesn't exist?
export const trialProductId = {
  production: 'prod_O8UqIEdbojolnb',
  development: 'prod_O8TZgKUi2jNrjk' // Upstream Dev: prod_O8UpTmtNs9h0fZ // Matt dev: prod_O8TZgKUi2jNrjk
}[nodeEnv];

export const subscriptionProductId = {
  production: 'prod_NuSl9fpuGurReO',
  development: 'prod_NuSl9fpuGurReO'
}[nodeEnv];

// const prices = {
//   production: ['price_1NDvB3AuNuplW9HPTlVhAPEn', 'price_1NDvBeAuNuplW9HPoO4uN6SJ', 'price_1NDvCHAuNuplW9HPzPEemDSZ'],
//   development: ['price_1NDvB3AuNuplW9HPTlVhAPEn', 'price_1NDvBeAuNuplW9HPoO4uN6SJ', 'price_1NDvCHAuNuplW9HPzPEemDSZ']
// }[nodeEnv];

// export const tiers: Record<ProductTier, ProductTierSettings> = {
//   trial: {
//     id: 'trial',
//     stripePrice: prices[0], // tier 1 price
//     name: 'Trial',
//     monthlyAmount: 0,
//     projectLimit: 1,
//     additionalProjectCost: 0,
//     revenue: 'less than $5,000,000'
//   },
//   tier_1: {
//     id: 'tier_1',
//     stripePrice: prices[0],
//     name: 'Tier 1',
//     monthlyAmount: 100 * 100,
//     projectLimit: 5,
//     additionalProjectCost: 20 * 100,
//     revenue: 'less than $5,000,000'
//   },
//   tier_2: {
//     id: 'tier_2',
//     stripePrice: prices[1],
//     name: 'Tier 2',
//     monthlyAmount: 200 * 100,
//     projectLimit: 10,
//     additionalProjectCost: 10 * 100,
//     revenue: '$5,000,000 - $9,999,999'
//   },
//   tier_3: {
//     id: 'tier_3',
//     stripePrice: prices[2],
//     name: 'Tier 3',
//     monthlyAmount: 100 * 100,
//     projectLimit: 15,
//     additionalProjectCost: 5 * 100,
//     revenue: '$10,000,000+'
//   }
// } as const;
