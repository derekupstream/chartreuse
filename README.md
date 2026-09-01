# Chart-Reuse by Upstream

Chart-Reuse is an app by Upstream Solutions for calculating the cost and environmental savings of switching from disposable food products to reusable products.

Built with [Next.js](https://nextjs.org/) (pages router), [Prisma](https://prisma.io/) + PostgreSQL, and [Ant Design](https://ant.design/). Production runs on [Vercel](https://vercel.com/) with [Supabase](https://supabase.com/) providing the database and authentication.

**📖 Full architecture reference: [docs/ROADMAP.md](docs/ROADMAP.md)** — the source-of-truth doc for the data model, calculator engine, auth, API surface, and operations.

**📋 Open work: [docs/BACKLOG.md](docs/BACKLOG.md)** — every known bug, request and planned feature, with what's blocked on whom.

## Documentation map

If `docs/ROADMAP.md` and any other doc disagree, trust the ROADMAP (and fix the other).

| Doc | What it holds |
|---|---|
| [docs/ROADMAP.md](docs/ROADMAP.md) | **Source of truth**: full system overview + §16 strategic partners & forward roadmap |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Numbered work items, including the ECCC partner set |
| [CLAUDE.md](CLAUDE.md) | Working companion: commands, environment traps, branch rules |
| [docs/REVIEW-PROTOCOL.md](docs/REVIEW-PROTOCOL.md) | Build→verify discipline: every non-trivial change is verified in layers, ending in the real browser |
| [docs/VERSIONING.md](docs/VERSIONING.md) | Data/methodology versioning: semver for data, collection releases (v2.0…), restore, cell formulas |
| [docs/CR2-CALC-MODEL.md](docs/CR2-CALC-MODEL.md) | Analysis of the Combined Model workbook, feedback items for Madhavi, verification results |
| [docs/CR2-ADMIN-PLAN.md](docs/CR2-ADMIN-PLAN.md) | Data Science admin overhaul + workbook-tab → app mapping |
| [docs/CR2-PRODUCT-STUDIO-SPEC.md](docs/CR2-PRODUCT-STUDIO-SPEC.md) | Product Studio vision (math backend / UX frontend), phased into 6 builds |
| [docs/CR2-MADHAVI-REVIEW.md](docs/CR2-MADHAVI-REVIEW.md) | Meeting doc: how her spreadsheet became Chart-Reuse 2.0's guide + golden data |
| [docs/RSP-API.md](docs/RSP-API.md) / [docs/PUBLIC-API-DOCS.md](docs/PUBLIC-API-DOCS.md) | Partner-facing RSP API contract and public-site docs |
| [docs/ACTUALS.md](docs/ACTUALS.md) | RSP/Actuals gap analysis (live design doc) |
| [docs/PRISMA_WORKFLOW.md](docs/PRISMA_WORKFLOW.md) | Database migration runbook (drift recovery, safe operations) |
| [docs/CALCULATOR_BUILD_PROMPT.md](docs/CALCULATOR_BUILD_PROMPT.md) | Methodology 1.0 formulas & factor tables (the "why" behind `lib/calculator/constants/`) |
| [docs/user-guide.md](docs/user-guide.md) | End-user walkthrough |
| [CHANGELOG.md](CHANGELOG.md) | Milestone history |

## Setup

1. Get the `.env` file from another developer (or pull env vars from the Vercel dashboard). Key vars: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Create a local Postgres database ([Postgres.app](https://postgresapp.com/) works well) and point `DATABASE_URL` at it.
3. `yarn` to install dependencies.
4. Apply migrations and generate the client: `psql -d <your_db> -f` each file under `prisma/migrations/` (or restore a teammate's dump), then `npx prisma generate`. **Do not run `yarn prisma:sync` after editing `schema.prisma`** — its connection check runs `db pull --force`, which overwrites the hand-written schema (see [docs/PRISMA_WORKFLOW.md](docs/PRISMA_WORKFLOW.md) and CLAUDE.md).
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

Managed by Prisma. Use `prisma:validate` / `prisma:status` rather than raw prisma commands, and avoid `prisma:sync` after schema edits (it can overwrite `schema.prisma` — see [docs/PRISMA_WORKFLOW.md](docs/PRISMA_WORKFLOW.md)). For schema changes: hand-write the migration SQL, apply locally with `psql -f`, then `npx prisma generate`. Production migrations must use the Supabase direct connection (port 5432), not the pooler.

## Billing

Stripe is integrated for subscriptions but is **not** part of signup — signup is Supabase auth (Google OAuth or email/password) followed by in-app onboarding. See the Billing section of [docs/ROADMAP.md](docs/ROADMAP.md).
