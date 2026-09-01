# Build → Review Protocol (Chart-Reuse)

Adopted 2026-08-26 from Replit's task-execution methodology, adapted for this repo. Applies
to every non-trivial build request: the first working draft is **not** completion. Work is
complete only when the outcome is verified with evidence, or a genuine external blocker is
named.

## The loop

```
Define outcome → Investigate → Hypothesize/plan → Implement small → Verify in layers →
Critical second pass → (on failure: classify, learn, change approach) → Report evidence
```

## 1. Define the outcome before acting

- What should change; what must NOT change.
- What the user sees when it works (the actual screen, not the code).
- Which audience the feature serves (Madhavi = math backend, Derek = UX frontend,
  partners = API/docs, funders = reports) and what that audience needs from it.
- How success is objectively verified.

## 2. Verification layers (run in this order)

| Layer | Chart-Reuse concretely |
|---|---|
| **A — Static** | `npx tsc --noEmit`, `yarn lint`, `yarn prisma:validate` when schema touched |
| **B — Focused tests** | `node --experimental-vm-modules node_modules/.bin/jest <file>` for the changed area; golden specs for anything touching the v2 engine |
| **C — Broad tests** | `yarn test:ci` (full suite) |
| **D — Runtime (HTTP)** | `npx dotenv-cli -e .env -- npx tsx scripts/verify-cr2-admin-runtime.ts` — every route, unauthorized redirect, API data vs Postgres, cell-edit round trip |
| **E — Runtime (browser)** | Load the changed pages in a REAL browser and read the console. HTTP checks cannot see hydration errors, client-side crashes, or render races. Get a session without touching credentials: `... verify-cr2-admin-runtime.ts --keep --print-cookie`, set the printed cookie via the browser tooling, drive the pages, check `read_console_messages` for errors, screenshot; then `... --cleanup` |

Layers D and E are mandatory for UI work. A passing compile is not a working screen, and
**a 200 with correct HTML is not a working page either** — hydration runs only in a browser
(learned 2026-08-27: `toLocaleString()` dates in SSR pages threw "Text content does not
match server-rendered HTML" on the Command Center; HTTP checks all passed).

## 3. Product-level acceptance (beyond "it renders")

- **Databases are connected, not made up** — numbers on screen trace to real rows
  (spot-check with psql / the API response).
- **UX is navigable** — every menu key registered in BOTH `layouts/AdminLayout.tsx` and
  `layouts/BaseLayout.tsx` (`adminLinks`); no dead links; deep links (`?kind=`, `?openName=`)
  actually open what they promise.
- **Experience matches promised value** — re-read the original request and walk the flow as
  the intended audience would.
- **Missing states handled** — loading, empty, error, unauthorized, stale.

## 4. Failure discipline

Classify before retrying: implementation / wrong assumption / test artifact / environment /
data / auth / external. **Known environment traps here:**

- Stale dev server: global-cached PrismaClient survives HMR — apply schema changes with
  `./scripts/apply-migration.sh <name>` (it stops the server for you), and if you ever see
  the guard's 503 ("Dev server is stale…", from lib/devSchemaGuard.ts): kill the process
  on :3000, `rm -rf .next`, `yarn dev`.
- `yarn prisma:sync` destroys schema.prisma (see CLAUDE.md). Never run it.
- Local `prisma migrate dev/deploy` fail; apply migration SQL via psql.
- Menu-key crash ("Menu link key not found") = key registered in one layout but not the other.
- Hydration mismatch ("Text content does not match server-rendered HTML") = locale/time/random
  formatting rendered during SSR. Never call `toLocaleString`/`toLocaleDateString` on data an
  SSR page renders directly — use `components/common/LocalDate.tsx` (deterministic first
  render, locale swap after mount).

Never repeat the same failing action without new evidence.

## 5. Report evidence, not confidence

Every completion report distinguishes: **Changed / Verified (with what check) /
Not verified / Limitations / Blocked**. "It should work" is banned when only part of the
flow was exercised.

## Completion rule

Mark done only when all four hold:
1. The requested outcome is implemented.
2. Automated checks pass, or failures are explained.
3. The real behavior was exercised where the environment permits.
4. No unverified assumption is presented as success.
