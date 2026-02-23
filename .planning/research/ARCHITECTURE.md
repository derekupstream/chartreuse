# Architecture Patterns

**Domain:** Next.js SaaS — Auth Migration + Public REST API
**Researched:** 2026-02-23
**Overall confidence:** HIGH (NextAuth v5 patterns verified against official authjs.dev docs; API key pattern verified against multiple sources; rate limiting verified against Upstash official docs)

---

## Recommended Architecture

The system has two independent work streams that share the same Postgres database and Next.js host:

1. **Auth migration**: Replace Firebase cookies + `firebase-admin` token verification with NextAuth.js v5 JWT sessions + Prisma adapter
2. **Public REST API**: Add a versioned `/api/v1/` namespace inside `pages/api/` that accepts usage counts, runs the calculator engine's environmental functions, stores anonymized aggregate data, and enforces per-key rate limits

These streams are independent — the public API does not depend on NextAuth sessions and NextAuth does not depend on the public API. Build them in parallel or sequentially in either order.

---

## Component Boundaries

### Auth Migration Components

| Component | Responsibility | Communicates With |
|---|---|---|
| `lib/auth/nextauth.ts` | NextAuth v5 config — Credentials provider, Prisma adapter, JWT session strategy | Prisma, `bcrypt` |
| `pages/api/auth/[...nextauth].ts` | NextAuth catch-all route handler | `lib/auth/nextauth.ts` |
| `lib/middleware/getUser.ts` (replacement) | Reads `session.user.id` instead of Firebase cookie token | NextAuth `auth()`, Prisma |
| `lib/middleware/checkLogin.ts` (replacement) | Calls `auth(context)` in place of `verifyIdToken(cookies.token)` | NextAuth `auth()` |
| `lib/middleware/getProjectContext.ts` (replacement) | Same as checkLogin replacement for project pages | NextAuth `auth()`, Prisma |
| `lib/auth/auth.browser.tsx` (replacement) | Wraps NextAuth `signIn`/`signOut`/`useSession`; drops Firebase SDK entirely | NextAuth client hooks |
| Prisma schema additions | `Account`, `Session`, `VerificationToken` models; `User` model `passwordHash` field | Prisma migrations |

### Public REST API Components

| Component | Responsibility | Communicates With |
|---|---|---|
| `pages/api/v1/impact.ts` | POST endpoint: accepts usage counts, returns GHG/waste/water impact | Calculator engine, `lib/api/validateApiKey.ts`, `lib/api/storeUsageSubmission.ts` |
| `lib/api/validateApiKey.ts` | Extracts `Authorization: Bearer <key>` header, hashes it, looks up in `ApiKey` table | Prisma |
| `lib/api/rateLimit.ts` | Per-key rate limiting using `@upstash/ratelimit` + Upstash Redis | Upstash Redis |
| `lib/api/storeUsageSubmission.ts` | Writes anonymized submission to `ApiUsageSubmission` table | Prisma |
| `lib/calculator/getEnvironmentalImpact.ts` | New pure-function wrapper around existing environmental calculations that takes raw usage counts (no `projectId`) | Existing `lib/calculator/calculations/getEnvironmentalResults.ts` |
| `pages/api/v1/keys.ts` (optional, internal) | Admin endpoint to issue new API keys | Prisma, `lib/api/generateApiKey.ts` |
| `lib/api/generateApiKey.ts` | Creates `sk_live_<random>` key, stores SHA-256 hash + metadata | `crypto` (Node built-in), Prisma |

### New Database Models

| Model | Purpose | Key Fields |
|---|---|---|
| `ApiKey` | Stores hashed API keys for v1 API callers | `id`, `keyHash` (SHA-256, unique), `label`, `createdAt`, `lastUsedAt`, `isActive` |
| `ApiUsageSubmission` | Anonymized aggregate usage log — no PII | `id`, `createdAt`, `apiKeyId`, `reusableItemCount`, `singleUseItemCount`, `ghgSavedKg`, `wasteSavedKg`, `waterSavedGallons`, `materialType` (nullable), `submittedRegion` (nullable) |
| `User.passwordHash` | New field on existing `User` model for Credentials provider | `passwordHash String?` |
| `Account` (NextAuth) | OAuth provider linkage (required by NextAuth adapter even if not used for OAuth) | standard NextAuth schema |
| `Session` (NextAuth) | Server-side session store (not used with JWT strategy but required for adapter) | standard NextAuth schema |
| `VerificationToken` (NextAuth) | Email verification tokens | standard NextAuth schema |

---

## Data Flow

### NextAuth Login Flow (replaces Firebase cookie flow)

```
Browser (login form)
  → POST /api/auth/callback/credentials (NextAuth handler)
    → lib/auth/nextauth.ts: Credentials provider authorize()
      → prisma.user.findUnique({ where: { email } })
      → bcrypt.compare(password, user.passwordHash)
      → returns { id, email, name } on success
    → NextAuth creates JWT, sets authjs.session-token cookie (HttpOnly)
  → Browser redirects to /projects

Protected page (getServerSideProps)
  → const session = await auth(context)   ← replaces verifyIdToken(cookies.token)
  → session.user.id used as userId for prisma.user.findUnique
  → same downstream flow as before (loads DashboardUser, returns props)

Protected API route
  → const session = await auth(req, res)  ← replaces getUser middleware
  → session.user.id used as userId
  → same handler chain continues
```

### Public API Request Flow

```
External caller
  → POST /api/v1/impact
    headers: { Authorization: "Bearer sk_live_abc123..." }
    body: { reusableItems: [...], singleUseItems: [...] }

  → lib/api/validateApiKey.ts
      SHA-256 hash of raw key
      → prisma.apiKey.findUnique({ where: { keyHash } })
      → 401 if not found or isActive=false

  → lib/api/rateLimit.ts
      @upstash/ratelimit.limit(apiKeyId)  ← per-key sliding window
      → 429 if limit exceeded

  → lib/calculator/getEnvironmentalImpact.ts
      accepts { reusableItems, singleUseItems } (no projectId)
      → calls getEnvironmentalResults(inventory) with synthesized inventory
      → returns { ghgSavedKg, wasteSavedKg, waterSavedGallons }

  → lib/api/storeUsageSubmission.ts
      writes ApiUsageSubmission row (no PII — no IP, no email, no name)
      apiKeyId links back to the key record only

  → 200 { data: { ghgSavedKg, wasteSavedKg, waterSavedGallons } }
```

### API Key Issuance Flow

```
Admin (internal only)
  → POST /api/v1/keys  (protected by NextAuth session, isUpstream check)
    body: { label: "Partner X" }

  → lib/api/generateApiKey.ts
      generates: "sk_live_" + crypto.randomBytes(32).toString('hex')
      SHA-256 hash stored in ApiKey.keyHash
      raw key returned ONCE in response, never stored

  → Admin delivers raw key to caller out-of-band
```

---

## Patterns to Follow

### Pattern 1: Split NextAuth Config for Edge/Node Compatibility

**What:** Separate `auth.config.ts` (edge-safe, no Prisma) from `auth.ts` (Node, includes PrismaAdapter).

**When:** Always with Pages Router + Prisma adapter. This is required because Prisma is not edge-compatible.

**Why:** The NextAuth v5 middleware runs at the Edge. It needs a lite config without database imports. The full config with PrismaAdapter is used only in API routes and `getServerSideProps`.

```typescript
// lib/auth/auth.config.ts — edge-safe, no Prisma import
import type { NextAuthConfig } from 'next-auth';
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user; // true = allow, false = redirect to signIn
    }
  },
  providers: [] // providers added in full auth.ts
};

// lib/auth/auth.ts — Node only, includes Prisma adapter
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import prisma from 'lib/prisma';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' }, // JWT required: Prisma adapter not edge-compatible
  providers: [
    Credentials({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        return valid ? { id: user.id, email: user.email, name: user.name } : null;
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id; // embed DB id in JWT
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string; // expose to callers
      return session;
    }
  }
});
```

### Pattern 2: Credentials Provider Requires JWT Strategy (Not Database Sessions)

**What:** When using the Credentials provider, NextAuth requires JWT session strategy. Database session strategy is incompatible with Credentials by design.

**Why:** Database sessions require a full user object from an OAuth profile. Credentials authenticate users independently without a full OAuth flow, so the session is stored as a signed JWT cookie instead. The Prisma adapter is still used for user lookups and future OAuth providers.

**Implication:** `Session` model is added to the schema (adapter requires it) but session rows are not written when using `strategy: 'jwt'`.

### Pattern 3: API Key — Store Only the Hash

**What:** Generate a random key, store SHA-256 hash, return raw key once to the caller.

**When:** Always. Never store plaintext API keys.

```typescript
// lib/api/generateApiKey.ts
import crypto from 'crypto';

export function generateApiKey(): { rawKey: string; keyHash: string } {
  const rawKey = 'sk_live_' + crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  return { rawKey, keyHash };
}

// Validation in request handler:
export async function validateApiKey(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const rawKey = authHeader.slice(7);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  return prisma.apiKey.findUnique({ where: { keyHash, isActive: true } });
}
```

### Pattern 4: In-Namespace Versioning (/api/v1/)

**What:** All public API routes live under `pages/api/v1/`. Internal app API routes remain under `pages/api/` (no version prefix).

**When:** Adding a public-facing API to an existing internal API surface.

**Why:**
- No separate service or deployment needed — single Vercel deployment
- Pages Router handles both internal (`/api/projects`) and public (`/api/v1/impact`) without conflict
- `/api/v1/` namespace is a clear contract signal to external callers
- Future: if the API needs to scale independently, extracting `pages/api/v1/` to a standalone service is a clean cut

**Not recommended:** Separate Next.js service or microservice at this scale. The calculator engine is pure functions in `lib/calculator/` — wrapping them in a dedicated API server would duplicate the runtime dependency without adding meaningful isolation. Keep it co-located until the usage data demonstrates need for separation.

### Pattern 5: Upstash Redis for Rate Limiting

**What:** `@upstash/ratelimit` with sliding window algorithm, keyed by `apiKeyId`.

**When:** Serverless/Vercel deployment where in-process memory-based rate limiting is unreliable across function instances.

**Why not DB-based rate limiting:** A Postgres-based counter (increment on each request, check count per time window) works but adds a write on every API call — this harms latency and adds DB load. Upstash Redis is purpose-built for this: HTTP-based (no persistent connection needed), global, and pay-per-request.

**Why not Vercel WAF rate limiting:** Vercel WAF rate limits by IP, not by API key. For per-key quotas, application-level rate limiting is required.

```typescript
// lib/api/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),           // UPSTASH_REDIS_REST_URL + TOKEN
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 req/hour per key
  prefix: 'chartreuse_api'
});

// In API route:
const { success } = await ratelimit.limit(apiKey.id);
if (!success) return res.status(429).json({ error: 'Rate limit exceeded' });
```

**Fallback option (no external service):** If Upstash is not acceptable, a simple DB-based counter works for low-volume APIs:
```sql
-- ApiKeyUsage table: (apiKeyId, windowStart, count)
-- On each request: upsert count, reject if count > limit
```
This is adequate for < 1000 req/day per key but does not scale gracefully.

### Pattern 6: Calculator Engine as a Direct Library Call (No Internal HTTP)

**What:** The public API route calls `lib/calculator/` functions directly — not via HTTP to `/api/projects/[id]/projections`.

**Why:** The calculator is already pure functions with no side effects. The existing `getProjections(projectId)` requires a DB-stored project. For the public API, callers submit raw usage data without creating a project. The solution is a new `getEnvironmentalImpact(input)` function that synthesizes a `ProjectInventory`-compatible object from the submitted data and passes it to `getEnvironmentalResults()`.

```typescript
// lib/calculator/getEnvironmentalImpact.ts (new file)
import type { ProjectInventory } from 'lib/inventory/types/projects';
import { getEnvironmentalResults } from './calculations/getEnvironmentalResults';

export interface ImpactInput {
  reusableItems: Array<{ productId: string; unitsUsed: number; material?: string }>;
  singleUseItems: Array<{ productId: string; unitsReplaced: number; material: string }>;
  region?: string; // US state for utility rates
}

export function getEnvironmentalImpact(input: ImpactInput) {
  const inventory = buildInventoryFromInput(input); // synthesize ProjectInventory
  return getEnvironmentalResults(inventory);
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mixing Firebase Session Signals with NextAuth Sessions During Migration

**What:** Running Firebase `verifyIdToken` on some routes and `auth()` on others simultaneously during the cutover.

**Why bad:** A user could have a valid Firebase cookie but no NextAuth session (or vice versa), leading to inconsistent auth state. Protected pages redirect to `/login` unpredictably. The `AuthProvider` in `_app.tsx` manages the Firebase token refresh interval — if it coexists with NextAuth session management, two auth systems fight over the cookie jar.

**Instead:** Hard cutover in a single migration commit. Replace all `verifyIdToken` / `nookies.get(context)` usages at once. Before go-live: add `passwordHash` to all existing users by hashing their Firebase passwords (requires password reset flow — see migration strategy below).

### Anti-Pattern 2: Storing API Keys in Plaintext

**What:** Storing `sk_live_abc123` directly in the `ApiKey.key` column.

**Why bad:** A DB read exposes all keys. Any log that includes the column exposes keys.

**Instead:** Store only the SHA-256 hash. The raw key is returned once at creation time and never stored.

### Anti-Pattern 3: Exposing PII in the Aggregate Submission Table

**What:** Storing caller IP, user agent, or any field that could identify the submitter in `ApiUsageSubmission`.

**Why bad:** The API is intended to be free and data-sharing. If callers trust that submissions are anonymous, adding PII-adjacent fields (even "just for debugging") violates that contract and creates GDPR/CCPA exposure.

**Instead:** `ApiUsageSubmission` links only to `apiKeyId` (an opaque UUID). No IP, no email, no name. If geographic data is needed for benchmarks, accept it as an explicit voluntary field (e.g., `submittedRegion: "California"`) in the request body.

### Anti-Pattern 4: Using Database Sessions with Credentials Provider

**What:** Setting `session: { strategy: 'database' }` when using the Credentials provider.

**Why bad:** NextAuth v5 (and v4) explicitly disallows database sessions with Credentials by design — a `Session` row requires a linked `Account` OAuth record which doesn't exist for credential logins. The adapter will throw at runtime.

**Instead:** Always use `session: { strategy: 'jwt' }` with the Credentials provider. The PrismaAdapter is still valuable for user lookups and future OAuth provider support.

### Anti-Pattern 5: Separate Next.js Service for the Public API

**What:** Extracting `pages/api/v1/` to a standalone `api-service/` Next.js or Express app.

**Why bad:** The calculator engine (`lib/calculator/`) would need to be duplicated or extracted to a shared package. Two deployments, two sets of env vars, two CI pipelines — overhead not justified by a free environmental impact API with unknown initial traffic.

**Instead:** Co-locate in `pages/api/v1/`. The namespace isolation is sufficient. If traffic grows to justify extraction, the `/api/v1/` cut point is clean.

---

## Migration Strategy: Firebase → NextAuth

This migration cannot be done incrementally per-route. The auth boundary is a cookie (`token`) read by every protected page and API route. A phased approach within a single deployment:

### Phase A: Schema Preparation (no behavior change)

1. Add `passwordHash String?` to `User` model in `schema.prisma`
2. Add NextAuth required models: `Account`, `Session`, `VerificationToken`
3. Run `prisma migrate dev`
4. Install `@auth/prisma-adapter`, `next-auth@beta`, `bcryptjs`
5. Write `lib/auth/auth.ts` and `lib/auth/auth.config.ts` but do not wire them into routes yet

**Note on existing User IDs:** The current `User.id` is a Firebase UID (string, not cuid). NextAuth's PrismaAdapter defaults to `@default(cuid())` for `User.id`. Since existing user IDs are Firebase UIDs, the `User` model schema must **not** add `@default(cuid())` — keep `id String @id`. The adapter is compatible with any string primary key as long as it doesn't enforce the default.

### Phase B: Password Backfill (critical path)

Existing users have Firebase-managed passwords — the app never has access to plaintext passwords. Options:

**Option B1 (Recommended): Forced password reset on first NextAuth login**
- Do not try to backfill `passwordHash` from Firebase
- On the new login page, if user's `passwordHash` is null, present a "set your password" flow that sends a magic link or reset email via Mailgun
- After they set a password, `passwordHash` is populated, and subsequent logins work normally

**Option B2: Silent migration on login (if Firebase credentials are still accessible during a transition window)**
- Keep Firebase SDK active during transition
- On login: try NextAuth credentials first; if `passwordHash` is null, fall back to Firebase `signInWithEmailAndPassword`, and on success immediately hash the password and store it in `passwordHash`
- This gives a seamless transition for active users
- After 60 days, remove Firebase fallback

This is a personal fork, not a production multi-tenant service, so Option B1 (forced reset) is simpler and lower-risk.

### Phase C: Route Cutover

Replace all auth middleware in a single commit:

1. Replace `lib/middleware/getUser.ts`: `verifyIdToken(cookies.token)` → `auth(req, res)` → `session.user.id`
2. Replace `lib/middleware/checkLogin.ts`: `getUserFromContext(context)` → `auth(context)` → `session.user.id`
3. Replace `lib/middleware/getProjectContext.ts`: same pattern
4. Replace `lib/auth/auth.browser.tsx`: drop Firebase imports, use `signIn('credentials', ...)` / `signOut()` / `useSession()`
5. Remove `nookies`, `firebase`, `firebase-admin` from `package.json`
6. Remove all `FIREBASE_*` env vars from `.env` and Vercel

**Cookie name change:** NextAuth v4 used `next-auth.session-token`. NextAuth v5 uses `authjs.session-token`. Since this is a fresh migration from Firebase (not from NextAuth v4), the cookie name change does not apply — there are no existing NextAuth session cookies to preserve.

### Phase D: Cleanup

- Remove `lib/auth/firebaseAdmin.ts`, `lib/auth/firebaseClient.ts`
- Remove `lib/middleware/getUserFromContext.ts` (Firebase-specific)
- Delete `pages/api/auth/firebase/` if it exists
- Add `pages/api/auth/[...nextauth].ts` as the NextAuth catch-all handler

---

## Scalability Considerations

| Concern | At current scale (< 100 users) | At 10K API calls/day | At 1M API calls/day |
|---|---|---|---|
| Auth session reads | JWT verified in-process — zero DB reads per request | Same — JWTs scale without state | Same |
| API key validation | One Postgres read per API request | Add index on `ApiKey.keyHash` (already unique) | Cache validated keys in Upstash Redis (TTL 60s) |
| Rate limiting | Upstash free tier (10K req/day) | Upstash pay-per-request (~$0.20/10K) | Same, or move to dedicated Redis |
| Usage data storage | Single `ApiUsageSubmission` row per call | `ApiUsageSubmission` grows linearly; add index on `createdAt` | Partition table by month; archive old rows |
| Calculator engine | Pure functions, CPU-bound | Vercel function timeout at 10s max | No change — functions are fast; add response caching for identical inputs |
| DB connections | Prisma singleton, 1 connection per function instance | Add PgBouncer / connection pooler (Heroku supports this) | Required |

---

## Suggested Build Order

The two streams are independent. If doing sequentially, auth migration first is lower risk because:
- Auth touches every route; shipping it cleanly first removes Firebase as a dependency
- The public API can then be built knowing what `session.user.id` looks like in the new system
- API key management uses the new Prisma patterns established during the auth migration

**Recommended sequence:**

```
1. [Auth] Schema additions (passwordHash, NextAuth models) — Prisma migration only
2. [Auth] lib/auth/auth.ts + auth.config.ts — config only, not wired
3. [Auth] pages/api/auth/[...nextauth].ts — handler added
4. [Auth] Phase B: password reset/backfill mechanism
5. [Auth] Phase C: route cutover (single commit replacing all Firebase middleware)
6. [Auth] Phase D: cleanup, remove Firebase packages
7. [API]  lib/calculator/getEnvironmentalImpact.ts — new pure function (testable independently)
8. [API]  Prisma: ApiKey + ApiUsageSubmission models
9. [API]  lib/api/generateApiKey.ts + validateApiKey.ts
10. [API] lib/api/rateLimit.ts (Upstash)
11. [API] pages/api/v1/impact.ts — wire everything together
12. [API] pages/api/v1/keys.ts — admin key issuance (optional, internal)
```

Steps 1-3 are safe to deploy to production before step 5 (they add routes without removing Firebase). Steps 4-6 are the risky cutover window.

---

## Sources

- NextAuth v5 migration guide: [https://authjs.dev/getting-started/migrating-to-v5](https://authjs.dev/getting-started/migrating-to-v5) — HIGH confidence
- NextAuth v5 Prisma adapter: [https://authjs.dev/getting-started/adapters/prisma](https://authjs.dev/getting-started/adapters/prisma) — HIGH confidence
- NextAuth v5 upgrade guide: [https://authjs.dev/guides/upgrade-to-v5](https://authjs.dev/guides/upgrade-to-v5) — HIGH confidence
- Building APIs with Next.js (official, Feb 2025): [https://nextjs.org/blog/building-apis-with-nextjs](https://nextjs.org/blog/building-apis-with-nextjs) — HIGH confidence
- Upstash rate limiting for Next.js: [https://upstash.com/blog/nextjs-ratelimiting](https://upstash.com/blog/nextjs-ratelimiting) — HIGH confidence
- NextAuth session management (get-session): [https://authjs.dev/getting-started/session-management/get-session](https://authjs.dev/getting-started/session-management/get-session) — HIGH confidence
- Prisma + Auth.js guide: [https://www.prisma.io/docs/guides/authjs-nextjs](https://www.prisma.io/docs/guides/authjs-nextjs) — HIGH confidence
- Cookie name migration (v4 → v5): [https://medium.com/@sajvanleeuwen/migrating-from-nextauth-v4-to-auth-js-v5-without-logging-out-users-c7ac6bbb0e51](https://medium.com/@sajvanleeuwen/migrating-from-nextauth-v4-to-auth-js-v5-without-logging-out-users-c7ac6bbb0e51) — MEDIUM confidence (community source, consistent with official docs)
- API key security best practices: [https://multitaskai.com/blog/api-key-management-best-practices/](https://multitaskai.com/blog/api-key-management-best-practices/) — MEDIUM confidence (consistent with industry standard)
