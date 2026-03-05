# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04)

**Core value:** The calculator's projection engine (GHG, waste, financial) must remain accurate and reliable — everything else is enhancements on top of that foundation.
**Current focus:** v1.8 Data Governance Admin Overhaul — Phase 1: Navigation & Labels

## Current Position

Phase: 1 of 3 (Navigation & Labels)
Plan: Not yet planned
Status: Ready to plan
Last activity: 2026-03-04 — Roadmap created for v1.8 Data Governance Admin Overhaul

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (this milestone)
- Prior milestones: 6+ shipped at ~1 milestone per 1-2 days of active development

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: n/a (new milestone)
- Trend: —

## Accumulated Context

### Decisions

- **Auth**: Supabase Auth (not Firebase, not NextAuth) — migration complete, all routes protected
- **DB**: Supabase PostgreSQL in production, local Postgres.app for dev
- **RSP API**: Bearer token (cr_rsp_{64hex}), SHA-256 hash stored, Sharewares format
- **AI Insights**: Async LLM rendering, pre-calculated context passed to LLM, stored in project.recommendations
- **PDF Export**: Deferred — browser print-to-PDF planned for Share & Export milestone
- **DataHealthIssue**: Lightweight model only — open → acknowledged → resolved (no full workflow system)

### Pending Todos

None captured yet.

### Blockers/Concerns

- Calculator multi-year projections: EPA WARM 2025 factor update should happen first to avoid baking stale constants into 10-year charts (future milestone)
- Phase 3 requires a Prisma migration for `DataHealthIssue` — run `npx prisma migrate deploy` against production after local dev

## Session Continuity

Last session: 2026-03-04
Stopped at: Roadmap created for v1.8 — Phase 1 ready to plan
Resume file: None
