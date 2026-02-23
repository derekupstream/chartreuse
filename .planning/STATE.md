# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** The calculator's projection engine (GHG, waste, financial) must remain accurate and reliable — everything else is enhancements on top of that foundation.
**Current focus:** Phase 1 — Fork & Own Deployment

## Current Position

Phase: 1 of 4 (Fork & Own Deployment)
Plan: 0 of 2 in current phase
Status: Ready to plan
Last activity: 2026-02-23 — Roadmap created (4 phases, 39 requirements mapped)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

- Auth: Supabase Auth chosen (not Better Auth as research recommended) — migration already partially started by user
- API: Public REST API is v2 scope — deferred out of this milestone
- PDF: Server-generated Puppeteer PDF is v2 scope — browser print-to-PDF (react-to-print) covers Phase 3

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2: Firebase UIDs are current `User.id` primary keys — Supabase migration must map users by email on first login, not overwrite existing User table
- Phase 2: Auth middleware cutover must be atomic (all protected routes in one commit) — partial cutover leaves routes silently unprotected
- Phase 3: EPA WARM 2025 factor update must precede multi-year projections to avoid baking stale constants into 10-year charts
- Phase 4: LLM must never receive raw calculator inputs — all numerical context pre-calculated by rule engine before LLM call

## Session Continuity

Last session: 2026-02-23
Stopped at: Roadmap created, no plans written yet
Resume file: None
