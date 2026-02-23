# ChartReuse – System Overview & Architecture Reference

> Generated: 2026-02-22
> Branch: `feature/my-changes` (forked from `main` @ upstream Upstream Solutions repo)

---

## 1. What the App Does

**Chart-Reuse** is a SaaS web application built by **Upstream Solutions** that calculates the financial and environmental cost savings an organization achieves by switching from **single-use (disposable) food products** to **reusable foodware**.

Users create **Projects** for their venues/clients, enter purchasing data, dishwasher usage, labor, waste-hauling costs, and other expenses. The calculator then produces:

- **Financial projections** – baseline vs. forecast annual spend, one-time costs, payback period, and ROI %
- **Environmental projections** – greenhouse gas emissions, waste weight reduction, and water usage changes
- **Single-use / reusable product breakdowns** by category and material
- **Bottle station impact** (water dispensers replacing bottled water)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App uses `pages/` router) |
| Language | TypeScript |
| UI Library | Ant Design 5.x + styled-components |
| Charting | `@ant-design/plots` |
| Database | PostgreSQL (Heroku in production) |
| ORM | Prisma 6.x |
| Auth | Firebase (email/password), `firebase-admin` on server |
| Payments | Stripe (subscriptions, trials, payment intents) |
| Analytics | Mixpanel + Google Analytics |
| Email | Mailgun + Mailchimp |
| Hosting | Vercel (frontend/API), Heroku (Postgres) |
| Package mgr | Yarn |
| Testing | Jest + `@swc/jest` |
| Linting | ESLint + Prettier + Husky pre-commit |
| Excel import | ExcelJS |

---

## 3. Database Schema (Prisma)

### Core Models

```
User
  id (Firebase UID), name, email, title, phone, role (ORG_ADMIN | ACCOUNT_ADMIN)
  → belongs to Org, optionally linked to Account

Org
  id, name, currency (default: USD), useMetricSystem, useShrinkageRate
  stripeCustomerId, stripeSubscriptionId, orgInviteCode
  → has many Users, Accounts, Projects, ProjectTags

Account
  id, name, accountContactEmail, USState
  → belongs to Org; has many Users, Projects

Project
  id, name, category (default | event | eugene)
  orgId, accountId
  budget, currency, singleUseReductionPercentage
  USState, utilityRates (Json), location (Json)
  isTemplate, templateDescription, templateId (self-referential)
  publicSlug (for share pages), showRecommendations, recommendations (Json)
  projectionsTitle, projectionsDescription
  dateType, startDate, endDate (for event projects)
```

### Project Line Items

| Model | Purpose |
|---|---|
| `SingleUseLineItem` | A disposable product being purchased (caseCost, casesPurchased, frequency, unitsPerCase, newCaseCost, newCasesPurchased) |
| `SingleUseLineItemRecord` | Historical purchase record per date for a single-use item |
| `ReusableLineItem` | A reusable product (caseCost, casesPurchased, unitsPerCase, annualRepurchasePercentage, categoryId, productId) |
| `EventFoodwareLineItem` | Pairs a single-use + reusable product for event-mode projects (reusableItemCount, reusableReturnPercentage/Count, waterUsageGallons) |
| `OtherExpense` | Additional recurring or one-time expenses (categoryId, cost, frequency, description) |
| `LaborCost` | Labor costs (same shape as OtherExpense) |
| `WasteHaulingCost` | Monthly waste-hauling cost baseline vs. forecast per waste stream/service type |
| `TruckTransportationCost` | Transportation distance in miles (event projects) |
| `Dishwasher` | Advanced dishwasher config – racksPerDay, operatingDays, type, temperature, fuelTypes, energyStar |
| `DishwasherSimple` | Simplified dishwasher – electricUsage, waterUsage, fuelType |

### Supporting Models

- `Invite` – org/account invite with accept status
- `ProjectTag` / `ProjectTagRelation` – custom org-level tags applied to projects
- `UserEvent` – user activity event log

---

## 4. Application Structure

```
/pages                  Next.js pages (routes)
  _app.tsx              Global layout, auth context, React Query provider
  login.tsx             Firebase login
  signup.tsx            Multi-step signup (Firebase → Stripe customer)
  subscription.tsx      Stripe subscription management
  members.tsx           Org member list
  /projects             Project list + new project wizard
  /projects/[id]/       Project detail tabs (dynamic route)
    projections.tsx     Dashboard/results
    single-use-items.tsx
    reusable-items.tsx
    dishwashing.tsx
    additional-costs.tsx
    foodware.tsx        (event mode)
    usage.tsx           (event mode)
    transportation.tsx  (event mode)
    purchasing-updates.tsx
  /org                  Org settings
  /accounts             Account management
  /upstream             Admin-only pages (Upstream staff)

/lib
  /calculator           Core computation engine (pure functions)
    getProjections.ts   Main entry point → returns all projections
    /calculations       Sub-calculators
      getAnnualSummary.ts
      getFinancialResults.ts     → annualCostChanges, oneTimeCosts, financialSummary
      getEnvironmentalResults.ts → GHG, waste, water, event waste
      /foodware          getSingleUseResults, getReusableResults, getBottleStationResults
      /ghg               getAnnualGasEmissionChanges, getTransportationGHG
      /waste             getAnnualWasteChanges, getEventProjectWaste
      /water             getAnnualWaterUsageChanges
      /dishwashing       getDishwasherUtilityUsage
    /constants           Static lookup tables
      utilities.ts       State-level electric/gas rates, water national average
      materials.ts       Material types (plastic, paper, glass, etc.)
      carbon-dioxide-emissions.ts  GHG factors by material
      frequency.ts       Frequency → annual multiplier mapping
      labor-categories.ts
      other-expenses.ts
      product-categories.ts
      product-types.ts
      reusable-product-types.ts
      dishwashers.ts
  /inventory            Data access layer
    getProjectInventory.ts   Loads full project from DB, maps to calculator types
    getSingleUseProducts.ts  Loads product catalog
    /assets/reusables    Static reusable product catalog (CSV-backed)
    /types               TypeScript types for ProjectInventory, products
  /auth                 Firebase auth (browser + admin)
  /middleware           Next-connect API middleware (auth, project validation)
  /stripe               Stripe helpers (subscriptions, customers, products)
  /projects             Project utilities (categories, templates, duplication)
  /analytics            Mixpanel + GA helpers
  /exports              Excel/CSV export logic
  /share                Shareable project link logic
  /currencies           Currency formatting

/prisma
  schema.prisma         Database schema
  /migrations           Prisma migration history

/components             React UI components, organized by page/feature
/hooks                  Custom React hooks
/utils                  Shared utility functions
/styles                 Global CSS / SCSS
/scripts                CLI scripts (e.g., sendInvite.ts)
```

---

## 5. Calculator Engine – How Projections Work

The core calculation pipeline is:

```
getProjections(projectId)
  └─ getProjectInventory(projectId)     ← DB fetch + data mapping
      └─ Returns: ProjectInventory
           (project metadata, singleUseItems, reusableItems, dishwashers,
            laborCosts, otherExpenses, wasteHauling, utilityRates, products catalog)

  ├─ getAnnualSummary(inventory)
  │    ├─ dollarCost (from getFinancialResults → annualCostChanges)
  │    ├─ singleUseProductCount (from getSingleUseResults → annualUnits)
  │    ├─ greenhouseGasEmissions (from getEnvironmentalResults → annualGasEmissionChanges)
  │    └─ wasteWeight (from getEnvironmentalResults → annualWasteChanges.summary)

  ├─ getEnvironmentalResults(inventory)
  │    ├─ annualGasEmissionChanges (GHG by material + transportation)
  │    ├─ annualWasteChanges (waste weight by stream)
  │    ├─ annualWaterUsageChanges (dishwasher + bottle station water)
  │    └─ eventProjectWaste (event-specific waste)

  ├─ getFinancialResults(inventory)
  │    ├─ annualCostChanges
  │    │    ├─ baseline  = singleUseCost + utilitiesBaseline + wasteHaulingBaseline
  │    │    ├─ forecast  = additionalCosts + reusableProductCosts + singleUseForecast
  │    │    │             + utilitiesForecast + wasteHaulingForecast
  │    │    └─ change    = forecast - baseline  (negative = savings)
  │    ├─ oneTimeCosts
  │    │    └─ reusableProductCosts + one-time additionalCosts
  │    └─ summary
  │         ├─ annualROIPercent = (-annualCost / oneTimeCost) × 100
  │         └─ paybackPeriodsMonths = ceil(-(oneTimeCost / annualCost) × 12)

  ├─ getSingleUseResults(inventory)    ← by product category & material
  ├─ getReusableResults(inventory)     ← reusable product purchase forecast
  └─ getBottleStationResults(inventory) ← water station replacement of bottled water
```

### Key Calculation Concepts

- **Baseline** = current cost if nothing changes
- **Forecast** = projected cost after switching to reusables
- **Frequency multiplier** – line items can be `Daily`, `Weekly`, `Monthly`, `Quarterly`, `Annually`, `One Time`; each is converted to an annual occurrence count
- **Utility rates** – per-state electric ($/kWh) and gas ($/therm) rates; national avg water at $6.98/1000 gal
- **Dishwasher utility cost** – calculated from racks/day × operating days, dishwasher type, energy star status, fuel types
- **Annualized repurchase** – reusables have an `annualRepurchasePercentage` (fraction of initial cost spent yearly to replace broken/lost items)
- **GHG factors** – material-level CO₂e emission factors (plastic, paper, aluminum, glass, etc.)
- **Event projects** – use `EventFoodwareLineItem` which pairs single-use + reusable products; return rate/count tracked per item

---

## 6. Project Modes (Calculator Steps)

| Mode | Steps | Use Case |
|---|---|---|
| **Simple** (event) | Foodware → Usage → Dishwashing → Transportation → Dashboard | Event venues, rental programs |
| **Advanced** | Single-Use Purchasing → Reusables Purchasing → Dishwashing → Additional Costs → Dashboard | Institutional/cafeteria programs |

### Project Categories

- `default` – standard advanced calculator
- `event` – event-mode (simple steps, EventFoodwareLineItem, truck transport)
- `eugene` – legacy category for City of Eugene

---

## 7. Authentication & Authorization

- **Firebase** handles all user auth (email/password sign-in)
- Every API route uses next-connect middleware:
  - `checkLogin` – verifies Firebase ID token from cookie
  - `validateProject` – ensures the user's org owns the requested project
  - `requireUpstream` – restricts `/upstream/` admin routes to Upstream staff orgs
- **Roles**: `ORG_ADMIN` (full org access) vs `ACCOUNT_ADMIN` (scoped to their Account)
- `isUpstream` flag on Org grants admin panel access

---

## 8. Subscription & Billing

- **Stripe** manages subscriptions
- Sign-up flow:
  1. Firebase creates user session
  2. Stripe customer created; Org + User records persisted to Postgres
  3. Free 30-day trial auto-applied
  4. Upstream manually upgrades customer's Stripe subscription
  5. Customer visits app → trial ends, paid period begins
- Subscription status checked on each page load to gate access

---

## 9. Feature Flags

Hardcoded in `lib/featureFlags.ts`:

- **Event projects** – enabled for: specific org IDs (madhavi, eugene, seattle), all Upstream staff orgs, and `development` env
- **Eugene org** – special flag for City of Eugene-specific behavior

---

## 10. Product Catalog

- **Single-use products** – loaded from DB per org (org-specific custom products) and from a static CSV (`lib/inventory/single-use-products-data.csv`)
- **Reusable products** – static CSV-backed catalog (`lib/inventory/assets/reusables/reusable-products-data.csv`) with special handling for bottle station product
- **Bottle station** – identified by `BOTTLE_STATION_PRODUCT_ID` constant; water usage calculated at 27.15 gallons/station/day

---

## 11. Key API Routes

```
/api/projects/index.ts         GET all projects, POST create project
/api/projects/[id]/            GET/PUT/DELETE project
/api/projects/duplicate.ts     POST duplicate a project
/api/projects/project-templates GET org templates
/api/accounts/                 Account CRUD
/api/org/                      Org settings CRUD
/api/user/                     User profile
/api/invite/                   Send/accept invites
/api/inventory/                Single-use product data
/api/dishwashers/              Dishwasher CRUD
/api/events/                   Event foodware CRUD
/api/labor-costs/              Labor cost CRUD
/api/other-expenses/           Other expense CRUD
/api/waste-hauling/            Waste hauling CRUD
/api/tags/                     Project tag CRUD
/api/stripe/                   Stripe subscription/payment endpoints
/api/admin/                    Upstream admin endpoints
```

---

## 12. Shared / Public Projects

- Projects can have a `publicSlug` for shareable read-only URLs (`/share/[slug]`)
- Projections title and description can be customized per project for the share view

---

## 13. Analytics

- **Mixpanel** – event tracking via `lib/analytics` (user actions, project events)
- **Google Analytics** – page view tracking via `lib/ga`
- **UserEvent** table – server-side event logging to Postgres

---

## 14. Exports

- Projects can be exported to **Excel** (`.xlsx`) via `lib/exports` using ExcelJS
- Single-use and reusable line items can also be **imported** from Excel

---

## 15. Multi-currency & Metric System Support

- Each Org has a `currency` (default `USD`) and `useMetricSystem` flag
- Currency formatting handled by `lib/currencies`
- Metric conversions in `lib/number.ts` (LITER_TO_GALLON etc.)

---

# Forking Plan: Building Your Own Branch with Your Own Database

## Goals

1. Run the app on your own local PostgreSQL database with the exported data
2. Experiment freely without touching production
3. Add AI-assisted improvements on your own branch

## Step-by-Step Setup

### Step 1 – Create your experimental branch

```bash
git checkout -b feature/my-experimental-version
```

### Step 2 – Set up a local Postgres database

Use [Postgres.app](https://postgresapp.com/) or Docker:

```bash
# Docker option
docker run --name chartreuse-local -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

Create a database:

```bash
psql -h localhost -U postgres -c "CREATE DATABASE chartreuse_local;"
```

### Step 3 – Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/chartreuse_local"
NEXTAUTH_SECRET=<any-random-string>

# Firebase (needed for auth – get from Firebase Console or use test config)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe (optional if not testing billing)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Mailgun (optional)
MAILGUN_API_KEY=
```

### Step 4 – Run migrations and generate Prisma client

```bash
yarn prisma migrate dev
yarn prisma generate
```

### Step 5 – Seed your database with the exported JSON data

Write a seed script in `scripts/seed.ts` that reads your exported JSON files and uses Prisma to insert records in the correct order (respecting foreign key dependencies):

```
Order: Org → Account → User → Project → line items
```

### Step 6 – Run the app

```bash
yarn dev
```

Visit `http://localhost:3000`

---

## Improvement Ideas for AI-Assisted Experimentation

| Area | Idea |
|---|---|
| Calculator | Add more granular material-level GHG factors with updated EPA data |
| Calculator | Add multi-year projection curves (not just year 1) |
| Products | Replace static CSV catalog with a DB-backed product table |
| Auth | Replace Firebase with NextAuth.js to simplify the auth stack |
| Feature flags | Move org-ID-based flags to a DB-driven feature flag system |
| UI | AI-assisted recommendations based on project data |
| Analytics | Build an admin dashboard summarizing all customer projects |
| Exports | Add PDF export of the projections dashboard |
| API | Add a REST/GraphQL API layer for external integrations |
| Testing | Increase test coverage for calculator pure functions |

---

*This document reflects the codebase as of the `feature/my-changes` branch, based on commits through February 2026.*
