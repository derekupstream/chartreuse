# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-02)

**Core value:** The calculator's projection engine (GHG, waste, financial) must remain accurate and reliable — everything else is enhancements on top of that foundation.
**Current focus:** Post-M6 stabilization; next up is Calculator Accuracy + Multi-Year Projections

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-04 — Milestone v1.8 started (Data Governance Admin Overhaul)

Progress: [░░░░░░░░░░] 0%

## Completed Since Last STATE.md Update

All of Milestones 1–6 plus post-M6 + DASH work:

- ✅ Fork & Own Deployment (Vercel + Supabase)
- ✅ Auth Modernization (Firebase → Supabase Auth)
- ✅ Responsive UI (mobile, hamburger nav)
- ✅ Factor Library (153 factors, admin CRUD)
- ✅ Data Science Admin (AI import, pipeline traceability, calculations registry, test runs)
- ✅ Methodology governance (TipTap editor, subsections, data lineage)
- ✅ RSP API Integration (org type, API keys, usage ingestion, settings restructure)
- ✅ Project Milestones + Impact Timeline (snapshots, break-even, analytics chart)
- ✅ AI Insights (async LLM rendering on projections dashboard)
- ✅ RSP Test Hub
- ✅ ComputeRun + MetricResult governance layer
- ✅ Analytics lineage visualization + impact simulator
- ✅ User role change + password reset (admin actions)
- ✅ Project Dashboard Charts (DASH-01 SnapshotTimeline + DASH-02 BreakEvenChart)
- ✅ Analytics Saved Views (localStorage filter presets per org)
- ✅ ShareButton redesign (Popover panel with URL input, Copy + Preview buttons)
- ✅ ImpactMultiplier (scale org avg impact across N locations on analytics page)
- ✅ Analytics Share Settings + ScenarioPlanner (Milestone 6 work)
- ✅ Analytics UX overhaul: share toggle bug fix, Print/Export/Share scope dropdowns, Scenarios tab redesign (filters+summary cards on all tabs, ProjectionTimeline 1→2→5→10yr per-project chart, timeline dropdown on chart, Load Scenario inline with buttons)

## Performance Metrics

**Velocity:**
- Total milestones completed: 6+ (M1–M6 + post-M6 work)
- Cadence: roughly 1 milestone per 1–2 days of active development

**By Milestone:**

| Milestone | Description |
|-----------|-------------|
| M1 | Fork + Auth |
| M2 | Responsive + Factor Library |
| M3 | Data Science Admin + AI Import |
| M4 | RSP API |
| M5 | Project Milestones + Impact Timeline |
| M6 | RSP Test Hub + AI Insights |
| Post-M6 | Data Science Governance |

## Accumulated Context

### Decisions

- **Auth**: Supabase Auth (not Firebase, not NextAuth) — migration complete, all routes protected
- **DB**: Supabase PostgreSQL in production, local Postgres.app for dev
- **RSP API**: Bearer token (cr_rsp_{64hex}), SHA-256 hash stored, Sharewares format
- **AI Insights**: Async LLM rendering, pre-calculated context passed to LLM, stored in project.recommendations
- **PDF Export**: Deferred — browser print-to-PDF (react-to-print) planned for Share & Export milestone
- **Public Environmental API**: Deferred to future milestone

### Pending Todos

- None captured yet.

### Blockers/Concerns

- Calculator multi-year projections: EPA WARM 2025 factor update should happen first to avoid baking stale constants into 10-year charts
- AI Recommendations (future): LLM must never receive raw calculator inputs — all numerical context pre-calculated by rule engine before LLM call

## Session Continuity

Last session: 2026-03-04
Stopped at: Analytics UX overhaul — all complete, TypeScript clean, pushed to main
Resume file: None
