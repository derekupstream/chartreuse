# Chart-Reuse by Upstream

Chart-Reuse is an app by Upstream Solutions for calculating the cost savings of switching from disposable food products to reusable products.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). It uses [Prisma](prisma.io/) as its ORM for a Postgres database hosted on Heroku. The app itself is deployed to [Vercel](https://vercel.com/upstreamsolutions). The UI elements are built with [Ant Design](https://ant.design/).

## Setup

1. Get the `.env` file from another developer and put it in the repo.
2. Use [Postgres.app](https://postgresapp.com/) or your preferred way of creating a Postgres database on your local computer and update the `DATABASE_URL` variable in your `.env` file.
3. Run `yarn` to install dependencies.
4. Run `yarn prisma migrate dev` to set up the database locally.

## Running

Run `yarn dev` to start the development server and then go to [http://localhost:3000](http://localhost:3000) in your browser.

## Tests

```bash
yarn test
```

## Migrations

Migrations are managed by Prisma - refer to Prisma's migration documentation to run them.

## Stripe

### Sign-up Flow:

1. Login to Firebase: a new user creates a Firebase session by entering their email on the Sign up page.
2. Register with Stripe  
   2a. On the second page, we create a Stripe customer account and persist user and organization records to Postgres.  
   2b. All users are immediately given a free 30-day trial subscription which has a placeholder product with $0 price.
3. Upstream visits the customer's profile in Stripe and adds a new product to their subscription. They then send a link to the customer to check out.
4. Once the customer visits the app again, their trial period will be ended and their first paid period will begin.

When we have actual product tiers, the flow for step 3 may change: 3. Upgrade and pay for a subscription  
 4a. Users visit /subscription and enter their payment information.  
 4b. In Stripe, the new payment method is applied to the subscription, the trial is ended, and they are charged immediately.

### Links:

How coupons work with subscriptions: https://stripe.com/docs/billing/subscriptions/coupons
