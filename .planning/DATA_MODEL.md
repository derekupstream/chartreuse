# Data Model: ChartReuse

~35 tables total across 5 domains. Source of truth: `prisma/schema.prisma`.

---

## Core Org Hierarchy

| Table | Purpose |
|-------|---------|
| `Org` | Top-level tenant (org type, Stripe, currency, RSP profile fields) |
| `Account` | Sub-unit of an Org; holds projects and users |
| `User` | Belongs to Org + optionally Account; has ORG_ADMIN or ACCOUNT_ADMIN role |
| `Invite` | Pending email invitations to join an Org/Account |

---

## Projects & Line Items

| Table | Purpose |
|-------|---------|
| `Project` | Core record — settings, metadata, public slug, recommendations |
| `SingleUseLineItem` | Single-use products being replaced |
| `SingleUseLineItemRecord` | Historical actuals records per line item |
| `ReusableLineItem` | Reusable products being adopted |
| `EventFoodwareLineItem` | Simplified line items for event-mode projects |
| `Dishwasher` | Advanced dishwasher specs (fuel type, racks/day, etc.) |
| `DishwasherSimple` | Simplified dishwasher (kWh + water usage) |
| `LaborCost` | Labor costs associated with a project |
| `OtherExpense` | Catch-all additional costs |
| `WasteHaulingCost` | Waste hauling costs (before/after) |
| `TruckTransportationCost` | Transport distance costs |
| `ProjectTag` / `ProjectTagRelation` | Org-defined tags on projects |
| `ProjectMilestone` | Point-in-time KPI snapshots ("Save Snapshot") |

---

## Data Science / Factor Library

| Table | Purpose |
|-------|---------|
| `Factor` | A single emission/impact constant (e.g., CO2 per kg of plastic) |
| `FactorCategory` | Groups factors (materials, utilities, etc.) |
| `FactorSource` | Source citation for a factor (EPA, WARM, etc.) |
| `FactorVersion` | Audit history of value changes per factor |
| `FactorDependency` | Graph of which factors depend on others |
| `ChangeRequest` | Proposed changes to a factor, with review workflow |
| `ImportSession` | AI-powered CSV import sessions (classify → apply) |
| `GoldenDataset` | Reference inputs + expected outputs for regression tests |
| `TestRun` / `TestRunResult` | Calculator test runs against golden datasets |

---

## Governance / Methodology

| Table | Purpose |
|-------|---------|
| `MethodologyDocument` | Rich-text methodology docs (TipTap, versioned, publishable) |
| `MethodologySnapshot` | A named, immutable set of factor versions used in a calculation |
| `MethodologySnapshotFactor` | Join table: snapshot ↔ factor versions |
| `ComputeRun` | Record of every calculator execution (projection, test, actuals ingest) |
| `MetricResult` | Individual metric outputs from a ComputeRun (CO2, water, cost, etc.) |

---

## RSP API (Reuse Service Providers)

| Table | Purpose |
|-------|---------|
| `RspApiKey` | API keys for RSP orgs (SHA-256 hash stored, never plaintext) |
| `UsageTimePeriod` | A time-bounded usage report submitted by an RSP |
| `UsagePeriodProduct` | Per-product breakdown within a usage period |

---

## Admin / Misc

| Table | Purpose |
|-------|---------|
| `UserEvent` | Audit log of user actions |
| `ImpersonationSession` | Admin impersonating a user (time-bounded) |
| `FeedbackSubmission` | In-app feedback from users |
| `AdminInsight` | Cached AI-generated admin insights |

---

*Last updated: 2026-03-02*
