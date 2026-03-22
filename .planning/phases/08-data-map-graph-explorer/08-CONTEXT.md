# Phase 08: Data Map Graph Explorer

## Vision

Transform the Data Map from a static diagram into a zoomable graph explorer — like Google Maps for data. One central tool with view modes (tabs) filtering the domain and zoom levels controlling detail depth.

## Current State

- System view: 12 entity nodes across 5 layers, path highlighting, rich drawer panels
- RSP API: feed panel + trace graph (just upgraded with colored edges, bidirectional flow, TraceNode)
- Actuals/Projections: project list + trace graphs with animated edges, subtitles, health signals
- All use dagre LR layout, ReactFlow, TraceNode component, NodeDrawer
- 43 Prisma models total, 21 represented in Data Map currently

## Zoom Levels

### Level 1 — System View (EXISTS)
Shows domains/core entities as nodes. Purpose: understand architecture.
Current: 12 nodes in 5 layers. Needs: node clustering when zoomed out (Inputs/Engine/Outputs).

### Level 2 — Table/Schema View (NEW)
Click a System node → expands inline to show table fields from Prisma schema.
Node visually grows to show field list (name, type, relation indicator).
"Zoom out" button collapses back to Level 1.

### Level 3 — Relationship View (NEW)
Click a field → draw edges to related tables via foreign keys.
Dynamic edge creation showing FK relationships.
Example: Project.id → ReusableLineItem.projectId → ComputeRun.projectId

### Level 4 — Row/Data View (NEW)
Click into actual data rows. Shows sample values for a specific record.
Requires new API endpoint to fetch sample data per table.

## Implementation Phases

### Plan 01: Schema Introspection API
- New API: `GET /api/admin/data-map/schema` — returns all Prisma models with fields, types, relations
- Use `prisma._dmmf` or parse schema.prisma at build time into a JSON registry
- Response shape: `{ models: { name, fields: { name, type, isRelation, relatedModel, isList }[] }[] }`

### Plan 02: Expandable System Nodes (Level 1 → 2)
- New `ExpandableNode` component replacing `SystemNode`
- Collapsed state: current behavior (label + count + health)
- Expanded state: shows field list with types, relation arrows, FK indicators
- "Zoom" button on node or double-click to expand
- "Collapse" button or double-click to return
- Dagre re-layout when node dimensions change
- Expanded node width ~280px, height scales with field count

### Plan 03: Relationship Edges (Level 2 → 3)
- Click a relation field → fetch related model's fields → add new expanded node + FK edge
- Dynamic edge creation with animated highlight
- Breadcrumb trail showing expansion path
- "Zoom out" collapses last expansion

### Plan 04: Row/Data View (Level 3 → 4)
- New API: `GET /api/admin/data-map/sample?model=Project&id=xxx`
- Click expanded node header → side drawer shows actual row data
- Field values displayed in Descriptions component
- Link to edit/view the actual record where applicable

### Plan 05: Data Dictionary Integration
- New model or JSON file: field descriptions, usage context, canonical definitions
- Side panel shows on field click: field name, table, type, description, "used in" references
- Seed script to populate descriptions from schema comments or manual entries

### Plan 06: View Mode Enhancements
- Add Factors and Metrics as dedicated view modes (tabs)
- Factors mode: Factors → Factor Versions → Calculator Functions → Compute Runs
- Metrics mode: Metric Results grouped by metricKey → upstream ComputeRuns → source data
- Node clustering at zoom level 1: group into Inputs/Engine/Outputs when zoomed far out

## Key Files to Modify

| File | Changes |
|------|---------|
| `components/admin/data-map/SystemGraph.tsx` | Replace SystemNode with ExpandableNode, handle expand/collapse state |
| `components/admin/data-map/systemGraphLayout.ts` | Dynamic re-layout on expansion, variable node sizes |
| `components/admin/data-map/NodeDrawer.tsx` | Add row data view, data dictionary panel |
| `pages/api/admin/data-map/schema.ts` | NEW — schema introspection endpoint |
| `pages/api/admin/data-map/sample.ts` | NEW — sample row data endpoint |
| `pages/admin/data-science/data-map.tsx` | Add Factors/Metrics mode tabs |

## Dependencies
- No new npm packages needed (ReactFlow + dagre already installed)
- No DB migrations needed for Plans 01-04
- Plan 05 (data dictionary) may need a new Prisma model or JSON config file

## Priority Order
Plan 01 → Plan 02 → Plan 03 → Plan 04 → Plan 05 → Plan 06
(Each plan is independently shippable)
