# Domain Pitfalls

**Project:** ChartReuse (derekupstream fork)
**Domain:** Next.js 15 pages-router SaaS — auth migration, public API, PDF export, multi-year calculator, AI recommendations
**Researched:** 2026-02-23
**Confidence:** HIGH (auth migration, PDF), MEDIUM (multi-year calculator, AI recommendations), MEDIUM (public API)

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or major security incidents.

---

### Pitfall 1: Firebase Cookie and NextAuth Cookie Collision During Migration

**What goes wrong:** Firebase stores its session in a cookie named `token` (set by `nookies` in `lib/auth/auth.browser.tsx`). NextAuth v5 defaults to a cookie named `authjs.session-token`. If both systems are running simultaneously during any transition period — even briefly — or if the old `token` cookie is not explicitly cleared at logout, users who were logged in under Firebase will be served stale cookie state. The result is that NextAuth's `auth()` call returns `null` while the browser still holds the old Firebase `token` cookie, causing a redirect loop back to `/login` for previously-active users.

**Why it happens:** The codebase currently uses `nookies` (`setCookie`/`destroyCookie`) to manage the Firebase `token` cookie client-side. NextAuth manages its own cookies independently. Neither system cleans up the other's cookie on sign-out.

**Consequences:** Active users get logged out during deploy. Users who clear their cache work fine; users who do not are stuck in a redirect loop until cookies expire (Firebase ID tokens last 1 hour; `browserLocalPersistence` keeps the session until revoked). A second deploy is required to fix it. Worst case: users with admin access are locked out.

**Warning signs:**
- Redirect loop at `/login` for users who were logged in before the deploy
- `auth()` returning `null` in `getServerSideProps` while DevTools shows a `token` cookie still present
- `checkLogin` logs showing "No user found. Redirect to login" for users who haven't explicitly signed out

**Prevention strategy:**
1. On the very first NextAuth deploy, add a cookie-clearing step in `getServerSideProps` or in a `/login` page `useEffect` that calls `destroyCookie(null, 'token', { path: '/' })` before the NextAuth session check runs.
2. Ensure the NextAuth sign-out handler also calls `destroyCookie` for the legacy `token` cookie.
3. Deploy with a forced logout (invalidate all sessions) for the initial cutover — acceptable for a fork with a small user base.
4. Test with a real browser session carried over from the Firebase build before declaring the migration complete.

**Phase:** Auth migration (Phase 1). Address before any other work.

---

### Pitfall 2: NextAuth v5 Edge Runtime Incompatibility with Prisma in Middleware

**What goes wrong:** NextAuth v5 requires the middleware/proxy file to run on the Edge Runtime. Prisma (used in this codebase for session storage via a database adapter) does not support the Edge Runtime. If `auth.ts` is imported directly in `middleware.ts` with the Prisma adapter included, the build will fail or the middleware will crash at runtime with an error about `fs` or Node.js built-ins not being available on the edge.

**Why it happens:** The NextAuth v5 migration guide requires splitting configuration into two files: `auth.config.ts` (edge-safe, no adapter) and `auth.ts` (full config with Prisma adapter). The middleware must only import from `auth.config.ts`. Developers who follow a single-file setup from older docs miss this.

**Consequences:** Build failure or silent runtime crash in middleware on Vercel. All routes that should be protected become unprotected if middleware throws and Next.js falls back to a passthrough.

**Warning signs:**
- Build error referencing `fs`, `path`, `crypto`, or `child_process` in the middleware bundle
- `auth()` always returning `null` in production but not in local dev (where Edge is not enforced by default)
- All protected routes suddenly accessible without authentication after deploy

**Prevention strategy:**
1. Follow the Auth.js "Edge Compatibility" split from day one: `auth.config.ts` contains providers + callbacks but no adapter; `auth.ts` imports `auth.config.ts` and adds the Prisma adapter.
2. Middleware imports only from `auth.config.ts`.
3. `getServerSideProps` imports from `auth.ts` (full config with adapter).
4. Add a local test using `next build` — Turbopack dev mode will not surface this; only a production build will.

**Phase:** Auth migration (Phase 1).

---

### Pitfall 3: `getServerSession` Removal Breaks All `getServerSideProps` Auth Checks

**What goes wrong:** This codebase currently calls `getUserFromContext` → `verifyIdToken` in every `getServerSideProps` call via `checkLogin`. In NextAuth v5, the equivalent is `auth(context)`. However, the call signature changed: previously `getServerSession(req, res, authOptions)`, now `auth(context)` where `context` is the full `GetServerSidePropsContext` object. If the migration is done page-by-page and some pages are missed, those pages will have no server-side auth protection at all — they will render without redirecting unauthenticated users.

**Why it happens:** `checkLogin` is a shared helper called by ~15+ pages. A refactor that touches only some call sites leaves the rest pointing at the Firebase implementation which will return `null` sessions once Firebase is removed.

**Consequences:** Protected pages become publicly accessible. Data is visible to unauthenticated users. No error is thrown — the page simply renders with an empty `user` prop.

**Warning signs:**
- Pages rendering without a user logged in when accessed directly
- `user` prop undefined but no redirect triggered
- `checkLogin` returning `{ props: { user: undefined } }` without a `redirect` property

**Prevention strategy:**
1. Replace `checkLogin` in a single atomic commit. Do not do it page by page.
2. Write a test for `checkLogin` that asserts the redirect destination is `/login` when no session exists. Run this against the new NextAuth implementation before deploying.
3. Add a grep check in CI: `pages/**/*.tsx` must not import `checkLogin` from the old `lib/auth` location after the migration.
4. Because the codebase has zero tests for middleware/auth (per CONCERNS.md), write at minimum an integration test for the `checkLogin` utility before modifying it.

**Phase:** Auth migration (Phase 1). The zero-test-coverage on auth files (CONCERNS.md) makes this extremely high risk.

---

### Pitfall 4: Public API Exposes Internal Project/Org Data Through Insufficient Field Filtering

**What goes wrong:** The existing API routes already pass `req.body` directly to Prisma in several places without field whitelisting (documented in CONCERNS.md). When a new public API is built on top of the same Prisma models, the same pattern — if copy-pasted — will allow unauthenticated callers to send arbitrary Prisma `where` or `data` fields and either read or mutate data belonging to other organizations.

For the public environmental impact API specifically, the risk is different: if the calculation result API returns the full `ProjectInventory` shape (which includes pricing, org metadata, and account IDs) rather than only the environmental output fields, internal SaaS data leaks to anonymous external callers.

**Why it happens:** The internal API routes were designed for trusted, authenticated callers. Re-using the same Prisma query helpers or the same response serializers in public API routes exposes fields that were never meant to be external.

**Consequences:** Data leakage of org-level pricing, account structures, and project metadata. In the most severe case (Prisma mass-assignment), an authenticated internal user or an API caller can overwrite `orgId` or `projectId` fields to gain access to another org's data.

**Warning signs:**
- Public API response bodies containing `id`, `orgId`, `accountId`, `createdAt`, or pricing fields
- Prisma `create` or `update` calls in public API handlers that use spread `...req.body` or `...input`
- No explicit response schema defined for public routes (only implicit "return the Prisma object")

**Prevention strategy:**
1. Define a strict Zod response schema for every public API endpoint. Validate output, not just input.
2. Create a dedicated `lib/api/public/` directory that never imports from `lib/middleware/` (which is designed for internal authenticated routes). Enforce this with an ESLint `no-restricted-imports` rule.
3. The public environmental impact calculator should only accept and return the fields defined in the public API spec — never a full `ProjectInventory`.
4. Add `X-Org-Id` or equivalent tenant scoping to every internal API query that could be called from a shared code path.

**Phase:** Public API build (Phase 2). Do not share internal route handlers with public routes.

---

### Pitfall 5: Puppeteer on Vercel Serverless Exceeds Function Size and Timeout Limits

**What goes wrong:** The projections dashboard is a complex Ant Design 5.x component tree that uses `styled-components`, Ant Design's CSS-in-JS runtime, and `@ant-design/plots` (G2 charts). Puppeteer requires bundling a Chromium binary. On Vercel, the serverless function bundle limit is 250MB compressed. A naive Puppeteer install exceeds this limit. Even with `puppeteer-core` and `@sparticuz/chromium-min`, Chromium is ~50MB compressed and executes 4-8x slower on serverless infrastructure than on a developer machine. A dashboard with charts may trigger a 10-30 second render, which exceeds Vercel's free-tier 10-second function timeout and the Pro-tier 60-second limit for complex pages.

**Why it happens:** Developers test PDF generation locally where Chromium is native and fast. The serverless cold-start + slow Chromium emulation problem only surfaces in production.

**Consequences:** PDF export fails with a 504 timeout in production. The feature works in local development and passes in staging if staging is not serverless. User reports the export button "does nothing."

**Warning signs:**
- Local PDF generation works but production returns 504
- Vercel function logs show `Function execution timeout` for the PDF route
- Bundle analysis shows Chromium binary in the function output

**Prevention strategy:**
1. Use `puppeteer-core` + `@sparticuz/chromium-min` (not full `puppeteer`) in the Vercel function. The compressed binary must be ~50MB.
2. Set `maxDuration` to 60 seconds on the PDF API route in `vercel.json` (requires Vercel Pro).
3. Alternatively: use `@react-pdf/renderer` to generate the PDF in-process without a browser. This avoids Chromium entirely but requires rewriting the dashboard component tree using react-pdf primitives (no Ant Design, no styled-components, no G2 charts). This is more work upfront but is the only fully serverless-safe approach.
4. Evaluate whether a dedicated PDF microservice (separate Heroku dyno) is justified — the existing app already runs on Heroku, which supports full Node.js and native Chromium without serverless limits.
5. **Do not use `react-to-print`** (already in `package.json`) for the PDF export API route — it is browser-only and cannot run server-side.

**Phase:** PDF export (Phase 3).

---

### Pitfall 6: Ant Design CSS-in-JS and Styled-Components Are Invisible to react-pdf

**What goes wrong:** If the PDF export approach uses `@react-pdf/renderer`, the existing dashboard components cannot be directly rendered inside react-pdf's component tree. `@react-pdf/renderer` has its own layout engine (Yoga) and its own styling system (`StyleSheet.create`). It does not execute browser CSS, Ant Design's `@ant-design/cssinjs` runtime, `styled-components` theme tokens, or Tailwind utility classes. Any component that uses these systems will render unstyled or throw errors inside react-pdf.

**Why it happens:** Developers assume that `@react-pdf/renderer` renders "normal" React components. It does not. It has its own `<Document>`, `<Page>`, `<View>`, `<Text>`, and `<Image>` primitives. Web HTML components (`<div>`, `<table>`, `<svg>`) are not supported.

**Consequences:** The PDF is blank, unstyled, or fails to build. The existing projections dashboard (which is the thing being exported) cannot be reused at all — a separate PDF-specific component tree must be built from scratch.

**Warning signs:**
- `react-pdf` rendering white/blank pages with no error
- Console warnings about unsupported HTML elements inside a react-pdf document
- Attempt to import Ant Design components inside a `<Document>` tree

**Prevention strategy:**
1. Treat the PDF export as a separate rendering concern from day one. Plan to build a parallel "PDF version" of the dashboard that uses only react-pdf primitives.
2. Extract the calculation data from the existing `getProjections()` function and pass it as plain props to both the web dashboard and the PDF template.
3. Register fonts explicitly using `Font.register()` from `@react-pdf/renderer` — do not assume system fonts are available.
4. For chart exports: react-pdf supports SVG via `<Svg>`. Pre-render chart SVG on the server using a headless library (e.g., `@antv/g2` server-side rendering mode) and pass the SVG string to react-pdf.

**Phase:** PDF export (Phase 3).

---

## Moderate Pitfalls

Mistakes that cause data quality problems, regressions, or significant rework.

---

### Pitfall 7: Multi-Year Projections Compound Rounding Errors From Year 1

**What goes wrong:** The current calculator uses `Math.round` (via the `round()` utility in `lib/calculator/utils.ts`) at intermediate steps, not just for display. When year 1 outputs are rounded and then used as inputs to year 2 calculations, rounding errors compound. Over 10 years, a $0.01 rounding error per item per year can accumulate into a dollar or more of drift on a large project. More critically, the existing `round()` function uses "round half up" (`Math.round`) rather than "round half to even" (banker's rounding), which systematically biases results upward across many line items.

**Why it happens:** The current calculator is single-year, so intermediate rounding never compounds. Multi-year projection is a new requirement that changes the computational structure from a flat calculation to a loop.

**Consequences:** Year 5 and year 10 totals do not match a reference spreadsheet or an independently-verified calculation. Environmental impact figures (GHG, waste weight) overstate savings by a small percentage that grows each year. Users and auditors notice the discrepancy when they compare the app output to Excel models.

**Warning signs:**
- Year N projections do not equal `year_1_result * N` for linear assumptions (a property that should hold for constant-rate scenarios)
- Spreadsheet fixture test (`lib/calculator/__tests__/calculator.spreadsheet.spec.ts`) fails when extended to multi-year
- GHG or financial values drift by more than 0.1% from reference when compounding 10 years

**Prevention strategy:**
1. Do not round at intermediate steps. Round only at the final display layer.
2. Extend the existing spreadsheet fixture test to cover year 5 and year 10 scenarios before writing any multi-year projection code.
3. Keep intermediate values as IEEE 754 floats (no conversion to integers/cents) — the precision is sufficient for environmental projections where the inputs themselves are estimates; what matters is consistent reproducibility, not sub-cent accuracy.
4. When annual growth rates are applied (e.g., cost inflation, reusable item repurchase rate changes), define a single canonical formula and apply it in one place. Do not recalculate it independently in each annual slice.

**Phase:** Calculator multi-year extension (Phase 4).

---

### Pitfall 8: Multi-Year Projections Silently Inherit Stale EPA Emission Factors

**What goes wrong:** The current codebase uses hardcoded emission factors in `lib/calculator/constants/carbon-dioxide-emissions.ts` (`ELECTRIC_CO2_EMISSIONS_FACTOR = 1.6 lbs CO2/therm`, `NATURAL_GAS_CO2_EMISSIONS_FACTOR = 11.7 lbs CO2/therm`). These are static constants. The project roadmap includes updating to current EPA GHG emission factors. If the multi-year projection feature is built before the emission factor update, the 10-year projections will be based on outdated constants. If the emission factors are later updated, year 1 through N projections will all shift, making previously generated PDFs and shared reports inconsistent with new projections.

**Why it happens:** The constants are embedded directly in the calculator engine, not in a versioned configuration or database record. There is no mechanism to "lock in" the emission factors at the time a projection was calculated.

**Consequences:** A user who generated a 10-year projection in February 2026 sees different numbers in April 2026 after an EPA factor update — with no explanation. The shared public URL for their project now shows different GHG values than what they presented to stakeholders.

**Warning signs:**
- Constants in `carbon-dioxide-emissions.ts` have no source citation or last-updated date in comments
- No version field on `ProjectInventory` or projection output that records which emission factor set was used
- Users ask why their numbers changed after an app update

**Prevention strategy:**
1. Before building multi-year projections, update the EPA emission factors (it is already on the roadmap) and add source citation comments with the EPA report year.
2. Consider storing the emission factor set version as a field on the `Project` model so projections are reproducible.
3. Multi-year projections should use the emission factors that were current at the time the projection was created — not recalculate live on every render.

**Phase:** Calculator multi-year extension (Phase 4) + EPA factor update should precede it.

---

### Pitfall 9: LLM Recommendations Hallucinate Specific Numbers From Project Data

**What goes wrong:** LLMs are unreliable at arithmetic. If the recommendation prompt includes the calculated projection values (GHG saved, cost savings, payback period) and asks the model to reason about them, the model will often re-calculate these values using its own (incorrect) arithmetic, producing subtly different numbers in the recommendation text. For example, the system calculates a payback period of 14.3 months; the LLM recommendation says "your 12-month payback period suggests..." because it estimated from the other numbers in context. Users notice the discrepancy immediately because the correct number is displayed on the same screen.

**Why it happens:** LLMs are trained to be helpful and complete. When numeric data is present in context, they attempt to use it in generated text. Their arithmetic is unreliable, especially for multi-step calculations with decimals.

**Consequences:** Users distrust the entire recommendations feature. Worse, they may distrust the calculator itself. The feature causes support tickets and potentially undermines credibility of the environmental impact numbers.

**Warning signs:**
- LLM output contains numerical values that don't exactly match the calculator output displayed on the same page
- Recommendations reference "approximately X%" when the exact value is displayed nearby
- Model repeats or paraphrases the input data with subtle changes

**Prevention strategy:**
1. **Never ask the LLM to perform calculations.** Pre-calculate all values using the existing `lib/calculator/` engine and pass the results as grounding context. The prompt must explicitly forbid recalculation: "Do not perform any arithmetic. Only interpret and explain the numbers provided."
2. For every number in the recommendation output, validate that it matches a value passed into the prompt. A simple post-processing check can flag responses containing numbers not in the input context.
3. Use structured output (JSON mode / response_format) to constrain the LLM to recommendation text fields only, not raw narration that invites hallucinated arithmetic.
4. Display recommendations as contextual interpretation ("This payback period is typical for institutions with X use case") rather than as a restatement of the numbers.

**Phase:** AI recommendations (Phase 5). The calculator engine is the authoritative source of truth; the LLM's role is interpretation only.

---

### Pitfall 10: Rate Limiting Not Applied Before Public API Launch Enables Scraping and DB Exhaustion

**What goes wrong:** The public environmental impact API is designed to be free with API keys for rate limiting only. Without enforced rate limiting from the first day the endpoint is public, a single API key (or no key, if key validation is accidentally skipped) can issue thousands of requests per second. Each request calls `getProjections()` which issues at minimum 3 DB queries. The existing `getAllProjections` already has an unbounded `Promise.all` problem noted in CONCERNS.md. A public endpoint that triggers the same query pattern will saturate the PostgreSQL connection pool on Heroku and take down the SaaS app for all paying customers.

**Why it happens:** Rate limiting is typically added "later" as a polish step. For an internal SaaS API behind authentication, the blast radius of missing rate limiting is limited to authenticated users. For a public free API, there is no such constraint.

**Consequences:** Database connection exhaustion. `ECONNREFUSED` or `too many clients` errors from Prisma across all app routes (not just the public API). The SaaS app becomes unavailable.

**Warning signs:**
- Public API endpoint reachable without an API key
- No `X-RateLimit-*` headers in API responses
- No middleware or Vercel Firewall rule in front of `/api/public/*` routes
- PostgreSQL connection count spikes during load testing

**Prevention strategy:**
1. Rate limiting is a prerequisite for public API launch, not a follow-up. Do not merge the public API route without it.
2. Use Upstash Redis + `@upstash/ratelimit` for per-API-key rate limiting. This is the standard approach for Next.js on Vercel and works at the edge without Node.js.
3. Apply a separate, stricter IP-based rate limit as a fallback for keyless requests (or block keyless requests entirely before keys are issued).
4. The public API should call a separate, purpose-built query function — not `getProjections()` — that accepts pre-validated input directly and never reads from the SaaS project database on behalf of an anonymous caller.

**Phase:** Public API build (Phase 2). Rate limiting ships with the endpoint, not after.

---

### Pitfall 11: API Versioning Omitted From Day One Requires Breaking Changes Later

**What goes wrong:** If the public API routes are mounted at `/api/calc` or `/api/environmental` without a version prefix, the first breaking change to the response schema (e.g., renaming `ghgSaved` to `ghgReduction` when EPA factor updates change the units) forces all existing callers to update simultaneously. Because the API is designed for third-party callers (not just the app itself), there is no coordinated deploy.

**Why it happens:** Versioning feels premature for a v1 endpoint. The extra path segment seems like overhead. Developers defer it until v2 is needed — at which point v1 is already deployed without a version prefix.

**Consequences:** Either the API is never changed (technical debt accumulates in the response schema) or callers break silently because response field semantics changed.

**Prevention strategy:**
1. Mount all public API routes at `/api/v1/` from the first commit. The cost of adding `/v1/` later is a breaking change. The cost of including it from day one is zero.
2. Define and publish a JSON schema or OpenAPI spec for v1 as part of the launch milestone. This spec is the contract that prevents accidental breaking changes.
3. When EPA emission factors are updated (Phase 4), review whether any public API response values change in meaning (not just value) — that is the signal for a v2.

**Phase:** Public API build (Phase 2).

---

## Minor Pitfalls

---

### Pitfall 12: LLM API Latency Blocks Page Render Without Streaming

**What goes wrong:** A naive integration calls the LLM API synchronously from a Next.js API route, awaits the response (typically 1-5 seconds for a 500-token response), and returns the result to the client. If the recommendations panel is on the main projections page, the entire page appears to hang while the LLM responds. Users interpret latency as a broken feature.

**Prevention strategy:** Render recommendations asynchronously using a separate `useSWR` fetch that triggers after the main projection data is loaded. Show a skeleton state while the recommendation loads. This decouples LLM latency from the core calculator experience. Do not use `getServerSideProps` to fetch the LLM response — keep it entirely client-initiated.

**Phase:** AI recommendations (Phase 5).

---

### Pitfall 13: `NEXT_PUBLIC_REMOTE_USER_ID` Bypass Survives Into NextAuth Migration

**What goes wrong:** The Firebase auth bypass in `lib/auth/firebaseAdmin.ts` (lines 6-18) uses `NEXT_PUBLIC_` prefixed environment variables to skip token verification entirely. This bypass is documented as dev-only but is structurally dangerous (CONCERNS.md). During the NextAuth migration, if the new `getUser` middleware is modeled on the old `verifyIdToken` function — as a copy-paste starting point — the same bypass may be inadvertently carried forward.

**Prevention strategy:** When writing the new NextAuth `getUser` middleware, do not copy from `firebaseAdmin.ts`. Write it fresh. Add a CI assertion (`grep -r NEXT_PUBLIC_REMOTE_USER` in a pre-commit hook) that this pattern does not exist in any new auth file.

**Phase:** Auth migration (Phase 1).

---

### Pitfall 14: `isPublicUrl` Substring Match Breaks New Public API Routes

**What goes wrong:** `lib/auth/auth.browser.tsx` line 141 uses `url.includes('share')` to decide whether a URL is public and should skip the redirect-to-login logic. Any future route containing the word `share` in its path will be treated as public. Similarly, the new public API routes at `/api/v1/...` may need to be recognized as public. If the auth redirect logic is carried forward into the NextAuth migration, the same fragility applies.

**Prevention strategy:** Replace the substring match with an explicit allowlist of path prefixes during the auth migration. Include `/api/v1/` in the allowlist from the start. Test with route paths that contain common words.

**Phase:** Auth migration (Phase 1).

---

### Pitfall 15: LLM Recommendation Feature Adds Vendor Lock-In Without an Abstraction Layer

**What goes wrong:** If the AI recommendations feature is built as a direct integration to a single provider (e.g., `openai.chat.completions.create(...)` called directly from the API route), switching providers or adding fallbacks later requires touching every call site.

**Prevention strategy:** Wrap the LLM call behind a thin `lib/ai/getRecommendations.ts` function that accepts structured input and returns typed output. The implementation can call OpenAI, Anthropic, or a local model — callers do not care which. This also makes the feature testable with a mock implementation.

**Phase:** AI recommendations (Phase 5).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Auth migration — cookie cutover | Old Firebase `token` cookie conflicts with `authjs.session-token` | Force logout on deploy; clear `token` cookie at login page load |
| Auth migration — middleware | Prisma adapter incompatible with Edge Runtime | Split `auth.config.ts` (edge) / `auth.ts` (full) from day one |
| Auth migration — `getServerSideProps` | All pages lose auth protection if `checkLogin` not atomically replaced | Rewrite `checkLogin` in one commit; add test before touching it |
| Auth migration — dev bypass | `NEXT_PUBLIC_REMOTE_USER_ID` pattern reintroduced | Never copy from old `firebaseAdmin.ts`; add CI grep |
| Public API — launch prerequisites | No rate limiting at launch enables DB exhaustion | Rate limiting ships with endpoint, not after |
| Public API — response schema | Internal Prisma fields leak in API response | Define Zod output schema; never return raw Prisma objects |
| Public API — versioning | No version prefix requires breaking change to add later | Mount at `/api/v1/` from first commit |
| PDF export — Vercel serverless | Puppeteer Chromium binary exceeds bundle/timeout limits | Use `puppeteer-core` + `@sparticuz/chromium-min`; consider Heroku dyno for PDF service |
| PDF export — CSS compatibility | Ant Design CSS-in-JS invisible to react-pdf | Build separate PDF component tree using react-pdf primitives only |
| Multi-year calculator | Rounding at intermediate steps compounds year-over-year | Round at display layer only; extend spreadsheet fixture tests first |
| Multi-year calculator | Stale emission factors baked into 10-year projections | Update EPA factors before building multi-year; version emission factor set on Project |
| AI recommendations | LLM re-calculates numbers and hallucinates wrong values | Prohibit arithmetic in prompt; validate output contains no new numbers |
| AI recommendations | Latency blocks page render | Keep LLM call async/client-initiated; never in `getServerSideProps` |

---

## Sources

- Auth.js v5 migration guide: [https://authjs.dev/getting-started/migrating-to-v5](https://authjs.dev/getting-started/migrating-to-v5) — HIGH confidence
- Auth.js session protection patterns: [https://authjs.dev/getting-started/session-management/protecting](https://authjs.dev/getting-started/session-management/protecting) — HIGH confidence
- NextAuth v5 pages router `getServerSideProps` bug: [https://github.com/nextauthjs/next-auth/issues/12217](https://github.com/nextauthjs/next-auth/issues/12217) — MEDIUM confidence
- NextAuth session management and persistence issues: [https://clerk.com/articles/nextjs-session-management-solving-nextauth-persistence-issues](https://clerk.com/articles/nextjs-session-management-solving-nextauth-persistence-issues) — MEDIUM confidence
- Puppeteer on Vercel deployment guide: [https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel](https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel) — HIGH confidence
- react-pdf + Ant Design performance issue: [https://github.com/diegomura/react-pdf/issues/1006](https://github.com/diegomura/react-pdf/issues/1006) — MEDIUM confidence
- react-pdf SSR/packaging issues: [https://github.com/diegomura/react-pdf/issues/2624](https://github.com/diegomura/react-pdf/issues/2624) — MEDIUM confidence
- JavaScript floating point in financial calculations: [https://www.robinwieruch.de/javascript-rounding-errors/](https://www.robinwieruch.de/javascript-rounding-errors/) — HIGH confidence
- LLM numerical hallucination: [https://medium.grid.is/numbers-dont-lie-but-ai-might-54674fb05d26](https://medium.grid.is/numbers-dont-lie-but-ai-might-54674fb05d26) — MEDIUM confidence
- LLM tool integration for reliable calculations: [https://www.astera.com/type/blog/llm-hallucination-how-to-reduce-it/](https://www.astera.com/type/blog/llm-hallucination-how-to-reduce-it/) — MEDIUM confidence
- Rate limiting for Next.js API routes: [https://upstash.com/blog/nextjs-ratelimiting](https://upstash.com/blog/nextjs-ratelimiting) — HIGH confidence
- API versioning URL vs header: [https://medium.com/@lordmoma/api-versioning-url-path-vs-header-query-string-dfc1e2db1386](https://medium.com/@lordmoma/api-versioning-url-path-vs-header-query-string-dfc1e2db1386) — MEDIUM confidence
- Codebase-specific concerns: `/Users/derekalanrowe/Dev/ChartReuse/.planning/codebase/CONCERNS.md` — HIGH confidence (direct code audit)
