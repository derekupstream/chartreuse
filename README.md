# Chart-Reuse by Upstream

Chart-Reuse is an app by Upstream Solutions for calculating the cost and environmental savings of switching from disposable food products to reusable products.

Built with [Next.js](https://nextjs.org/) (pages router), [Prisma](https://prisma.io/) + PostgreSQL, and [Ant Design](https://ant.design/). Production runs on [Vercel](https://vercel.com/) with [Supabase](https://supabase.com/) providing the database and authentication.

**📖 Full architecture reference: [docs/SYSTEM_OVERVIEW.md](docs/SYSTEM_OVERVIEW.md)** — the source-of-truth doc for the data model, calculator engine, auth, API surface, and operations.

## Setup

1. Get the `.env` file from another developer (or pull env vars from the Vercel dashboard). Key vars: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Create a local Postgres database ([Postgres.app](https://postgresapp.com/) works well) and point `DATABASE_URL` at it.
3. `yarn` to install dependencies.
4. `yarn prisma:sync` to apply migrations and generate the client (see [docs/PRISMA_WORKFLOW.md](docs/PRISMA_WORKFLOW.md) for the safe-migration workflow).
5. Optionally seed: `npx tsx scripts/seed.ts`

## Running

```bash
yarn dev        # http://localhost:3000
yarn test       # jest (watch mode); yarn test:ci for a single run
yarn lint
```

### Running against production data

Create a `.env.production` config file with env vars and run:

```bash
NEXT_PUBLIC_REMOTE_USER_ID=<user_id> yarn start:remote
```

## Migrations

Managed by Prisma. Use the `prisma:validate` / `prisma:status` / `prisma:sync` scripts rather than raw prisma commands — see [docs/PRISMA_WORKFLOW.md](docs/PRISMA_WORKFLOW.md). Production migrations must use the Supabase direct connection (port 5432), not the pooler.

## Billing

Stripe is integrated for subscriptions but is **not** part of signup — signup is Supabase auth (Google OAuth or email/password) followed by in-app onboarding. See the Billing section of [docs/SYSTEM_OVERVIEW.md](docs/SYSTEM_OVERVIEW.md).
