---
gsd_state_version: 1.0
milestone: v1.8
milestone_name: Data Governance Admin Overhaul
status: planning
stopped_at: Completed 03-data-health-page-02-PLAN.md
last_updated: "2026-03-05T03:19:33.397Z"
last_activity: 2026-03-04 — Roadmap created for v1.8 Data Governance Admin Overhaul
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 7
  completed_plans: 6
  percent: 50
---

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

Progress: [█████░░░░░] 50%

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
| Phase 01-navigation-and-labels P01 | 1 | 1 tasks | 1 files |
| Phase 01-navigation-and-labels P02 | 12 | 2 tasks | 6 files |
| Phase 02-overview-redesign P01 | 3 | 2 tasks | 1 files |
| Phase 02-overview-redesign P02 | 3 | 2 tasks | 1 files |
| Phase 03-data-health-page P01 | 2 | 2 tasks | 2 files |
| Phase 03-data-health-page P02 | 8 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

- **Auth**: Supabase Auth (not Firebase, not NextAuth) — migration complete, all routes protected
- **DB**: Supabase PostgreSQL in production, local Postgres.app for dev
- **RSP API**: Bearer token (cr_rsp_{64hex}), SHA-256 hash stored, Sharewares format
- **AI Insights**: Async LLM rendering, pre-calculated context passed to LLM, stored in project.recommendations
- **PDF Export**: Deferred — browser print-to-PDF planned for Share & Export milestone
- **DataHealthIssue**: Lightweight model only — open → acknowledged → resolved (no full workflow system)
- [Phase 01-navigation-and-labels]: Kept data-science/pipeline in DATA_SCIENCE_KEYS without nav link; Lineage is new primary entry at /admin/data-science/lineage
- [Phase 01-navigation-and-labels]: data-science/inputs added to DATA_SCIENCE_KEYS proactively for Phase 3 Inputs page
- [Phase 01-navigation-and-labels]: Pipeline selectedMenuItem set to 'data-science/pipeline-legacy' to decouple legacy page from primary nav highlight
- [Phase 01-navigation-and-labels]: Admin page copy uses governance/audit trail framing consistently: 'Factors', 'AI Data Uploader', 'Trace how a metric was produced'
- [Phase 02-overview-redesign]: Tasks 1+2 merged into single commit for TypeScript consistency — removing publishedSections from props required simultaneous render layer updates
- [Phase 02-overview-redesign]: alertOverride pattern on KpiCardBlock: boolean prop allows server-side isStale to override zero-value all-clear display for Test Runs card
- [Phase 02-overview-redesign]: Tasks 1+2 combined into single commit for file consistency — removing old sections and adding new ones must be atomic to avoid linter failures
- [Phase 02-overview-redesign]: SECTION_CARDS placed inside component body — JSX icon values require component scope
- [Phase 02-overview-redesign]: How It Works Collapse has no defaultActiveKey — starts closed per OVW-04 locked decision
- [Phase 03-data-health-page]: entityId uses @db.Uuid even with no FK — entity IDs across Project/LineItem tables are all PostgreSQL UUIDs
- [Phase 03-data-health-page]: acknowledgedByUserId is plain String? (no @db.Uuid) — references User.id which is Supabase auth UID (plain string)
- [Phase 03-data-health-page]: @@unique([issueType, entityId]) is the DataHealthIssue upsert key — prevents duplicate rows on re-scan
- [Phase 03-data-health-page]: Prisma.InputJsonValue cast required for Json? fields — Record<string,unknown> not assignable to Prisma Json input type
- [Phase 03-data-health-page]: Entity-prefixed issueType for negative_case_cost checks ensures @@unique([issueType, entityId]) key uniqueness across entity types
- [Phase 03-data-health-page]: status absent from upsert update block — preserves acknowledged/resolved state on re-scan

### Pending Todos

None captured yet.

### Blockers/Concerns

- Calculator multi-year projections: EPA WARM 2025 factor update should happen first to avoid baking stale constants into 10-year charts (future milestone)
- Phase 3 requires a Prisma migration for `DataHealthIssue` — run `npx prisma migrate deploy` against production after local dev

## Session Continuity

Last session: 2026-03-05T03:19:33.386Z
Stopped at: Completed 03-data-health-page-02-PLAN.md
Resume file: None
