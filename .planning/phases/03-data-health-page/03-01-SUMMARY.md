---
phase: 03-data-health-page
plan: 01
subsystem: database
tags: [prisma, postgresql, migration, data-health]

# Dependency graph
requires: []
provides:
  - DataHealthIssue Prisma model with composite unique key (issueType, entityId)
  - Migration SQL file for production deployment
  - Local DB table DataHealthIssue ready for scan engine upserts
affects:
  - 03-02 (scan engine — upserts into DataHealthIssue)
  - 03-03 (admin page — queries DataHealthIssue)
  - 03-04 (acknowledge API — updates DataHealthIssue)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Manual migration SQL + prisma db push pattern for local dev with schema drift"
    - "Composite @@unique([issueType, entityId]) as upsert key for idempotent re-scans"

key-files:
  created:
    - prisma/migrations/20260305200000_data_health_issue/migration.sql
  modified:
    - prisma/schema.prisma

key-decisions:
  - "entityId uses @db.Uuid even with no FK — entity IDs are UUIDs across Project/LineItem tables"
  - "acknowledgedByUserId is plain String? (no @db.Uuid) — references User.id which is a Supabase auth UID (plain string)"
  - "@@unique([issueType, entityId]) is the upsert key — prevents duplicate rows on re-scan"
  - "Applied via prisma db push instead of migrate dev due to schema drift in local dev DB"

patterns-established:
  - "DataHealthIssue status lifecycle: open -> acknowledged -> resolved"
  - "severity values: error | warning; status values: open | acknowledged | resolved"

requirements-completed: [INP-05]

# Metrics
duration: 2min
completed: 2026-03-05
---

# Phase 3 Plan 01: DataHealthIssue Schema Foundation Summary

**Prisma DataHealthIssue model with composite unique key and migration SQL — enables idempotent re-scan upserts for the data health scan engine**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T02:12:11Z
- **Completed:** 2026-03-05T02:14:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- DataHealthIssue model added to schema.prisma with all 12 fields and correct column types
- Migration SQL file created at the correct path for production deployment via `prisma migrate deploy`
- Local database synced via `prisma db push`; table confirmed with count query returning 0
- Prisma client regenerated automatically — `prisma.dataHealthIssue` available to TypeScript

## Task Commits

Each task was committed atomically:

1. **Task 1: Add DataHealthIssue model to schema.prisma** - `1c9ad54` (feat)
2. **Task 2: Create migration SQL and apply locally** - `1ad9105` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `prisma/schema.prisma` - Added DataHealthIssue model with 12 fields, @@unique composite key
- `prisma/migrations/20260305200000_data_health_issue/migration.sql` - SQL for production migration

## Decisions Made
- `entityId` uses `@db.Uuid` even though there is no FK constraint — entity IDs across Project/SingleUseLineItem/ReusableLineItem are all PostgreSQL UUIDs
- `acknowledgedByUserId` is plain `String?` with no `@db.Uuid` — matches `User.id` which is a Supabase auth UID (plain string, not a PostgreSQL UUID column type)
- `@@unique([issueType, entityId])` is the upsert key for the scan engine — without it, re-scans would create duplicate rows instead of updating existing ones
- Used `prisma db push` instead of `prisma migrate dev` — local dev DB had schema drift (manual migrations applied directly) that would require a destructive reset

## Deviations from Plan

None - plan executed exactly as written. The `prisma db push` fallback was explicitly specified in the plan for drift scenarios.

## Issues Encountered
- Local Postgres.app server was not running — started via `open -a "Postgres"` before migration
- `prisma migrate dev` detected schema drift (local DB ahead of migration history) — used `prisma db push` fallback as specified in the plan

## User Setup Required
None — no external service configuration required for this plan.

**Production deployment note:** Run `npx prisma migrate deploy` against production Supabase using `DATABASE_URL` at port 5432 (not 6543) to apply `prisma/migrations/20260305200000_data_health_issue/migration.sql`.

## Next Phase Readiness
- DataHealthIssue table exists in local DB; Prisma client recognizes it
- Plan 02 (scan engine) can now upsert issue records into this table
- Production deployment of the migration SQL is required before Plan 02 or 03 can be deployed

---
*Phase: 03-data-health-page*
*Completed: 2026-03-05*

## Self-Check: PASSED

- prisma/schema.prisma: FOUND
- prisma/migrations/20260305200000_data_health_issue/migration.sql: FOUND
- .planning/phases/03-data-health-page/03-01-SUMMARY.md: FOUND
- Commit 1c9ad54 (Task 1): FOUND
- Commit 1ad9105 (Task 2): FOUND
