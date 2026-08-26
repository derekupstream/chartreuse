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
| **D — Runtime** | Start/refresh `yarn dev`, exercise the real flow in the browser: navigate the menu, click the thing, watch the network tab, confirm the data on screen is the data in Postgres (`psql chartreuse_local`) — not placeholder/made-up values |

Layer D is mandatory for UI work. A passing compile is not a working screen.

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

- Stale dev server: global-cached PrismaClient survives HMR — if an error claims code or a
  column doesn't exist that is visibly in the file → kill the process on :3000,
  `rm -rf .next`, `yarn dev`.
- `yarn prisma:sync` destroys schema.prisma (see CLAUDE.md). Never run it.
- Local `prisma migrate dev/deploy` fail; apply migration SQL via psql.
- Menu-key crash ("Menu link key not found") = key registered in one layout but not the other.

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
