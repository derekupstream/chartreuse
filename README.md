# Chart Reuse by Upstream

Chart Reuse is an app by Upstream Solutions for calculating the cost savings of switching from disposable food products to reusable products.

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

