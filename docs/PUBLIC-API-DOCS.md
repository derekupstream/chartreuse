# Chart-Reuse Developer Documentation

*For reuse service providers integrating operational data with Chart-Reuse, by Upstream Solutions.*

This page is written for the public website. Everything below describes implemented behavior.

Three documents get casually conflated, so we keep them distinct:

- **Data model** — how Chart-Reuse organizes information.
- **Data ingestion model** — how your information enters and becomes part of that model.
- **API specification** — how your systems communicate with ours.

---

## Overview

Chart-Reuse calculates the cost and environmental impact of replacing single-use foodware with
reusables. Reuse service providers (RSPs) — companies operating reusable container programs —
connect their operational systems to Chart-Reuse so that every customer they serve gets
continuously updated impact reporting: greenhouse gas avoided, water saved, landfill waste
diverted, and single-use items displaced.

The integration is deliberately small: one HTTPS request per customer per reporting period,
carrying counts you already track. Impact is calculated with the same standardized model for
every provider, which is what makes results comparable across programs and meaningful in
aggregate.

---

## Data model

How Chart-Reuse organizes what you send:

```
Provider organization            (you)
 ├── API keys                    (created and revoked by you)
 ├── Activity log                (every API call your systems make)
 └── Client accounts             (one per customer, matched by your client_id)
      ├── Reporting periods      (one per submission; a date range)
      │    └── Product records   (per reusable type: items out, items returned)
      └── Metric results         (computed impact, attached to each period)
```

Each of your customers is an **account**. Your submissions attach **reporting periods** to that
account, each period carrying **product records** and the **metrics** computed from them. Your
customer logs in and sees their own account only; you see every account your data feeds.

---

## Data ingestion model

What you can send, in what structure, through what mechanism, and what happens after you send it.

### Pipeline

```
Your system
    │
    ▼
POST /api/rsp/usage ────────── HTTPS · Bearer key
    │
    ▼
Schema validation ──────────── 400 names the failing field (e.g. events[2].reusable_type)
    │
    ▼
Normalization ──────────────── reusable_type lowercased; unrecognized types priced
    │                          with fallback factors and flagged in warnings[]
    ▼
Record matching ────────────── client_id → client account (unique per provider);
    │                          a first-time client_id creates the account
    ▼
Impact calculation ─────────── items sent out × per-type impact factors
    │                          → kg CO2e · gallons water · lbs waste · items displaced
    ▼
Period stored ──────────────── overlapping date ranges supersede the older record;
    │                          superseded versions are retained, never double-counted
    ▼
Available immediately ──────── API response · customer dashboard · provider portal ·
                               GET /api/rsp/impact
```

### What we ingest

One record type: a **usage period** — for one customer, over one date range, how many items of
each reusable product type went out and came back.

### Schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `client_id` | string | yes | Your stable identifier for the customer. Case-sensitive. This is the matching key: the same value always routes to the same account, and a new value creates a new account. |
| `client_name` | string | no | Display name, used only when a first submission creates the account. |
| `date_min` | string `YYYY-MM-DD` | yes | First day of the reporting period. Plain date; no timezone applies. |
| `date_max` | string `YYYY-MM-DD` | yes | Last day of the period. Must be on or after `date_min`. |
| `events[]` | array | yes | One entry per product type per period. |
| `events[].reusable_type` | string | yes | Product type, case-insensitive: `bowl`, `container`, `cup`, `fork`, `glass`, `knife`, `plate`, `spoon`, `tray`, `utensils`. Other values are accepted, priced with generic fallback factors, and flagged. |
| `events[].out_warehouse_events` | integer ≥ 0 | yes | Items sent out to the customer. **This is what impact is calculated from.** |
| `events[].in_warehouse_events` | integer ≥ 0 | yes | Items returned. Stored for return-rate reporting; does not itself drive impact. |
| `dry_run` | boolean | no | `true` validates and prices the payload without storing anything. Never creates accounts. |

### Example payload

```json
{
  "client_id": "riverfront-cafe-01",
  "client_name": "Riverfront Cafe",
  "date_min": "2026-07-01",
  "date_max": "2026-07-31",
  "events": [
    { "reusable_type": "cup",  "out_warehouse_events": 12400, "in_warehouse_events": 11780 },
    { "reusable_type": "bowl", "out_warehouse_events": 3100,  "in_warehouse_events": 2890 }
  ]
}
```

### Ingestion semantics

- **Mechanism.** REST over HTTPS with a JSON body. No SDK required, no file uploads, no webhooks.
- **Single vs. bulk.** One customer per request; a batch is a loop of independent requests.
- **Create vs. update.** Submissions only add. To correct a period, re-send the same date range —
  the new record **supersedes** any overlapping older ones, and the response's
  `superseded_count` tells you how many were replaced.
- **Record matching.** `client_id` is the external key. Unique per provider; two customers can
  never share one, and a typo'd value creates a visible new account rather than silently
  misrouting data.
- **Duplicates.** There is no duplicate rejection. Overlapping periods supersede, so re-sending
  is always safe.
- **Processing model.** Synchronous — metrics are computed and returned in the response. There
  is no ingestion queue; data appears on dashboards immediately.
- **Transformations.** Product types are lowercased; impact metrics are calculated per type.
  Counts themselves are stored exactly as sent.
- **Versioning and history.** Superseded periods are retained with a `superseded` status and
  excluded from every total. Nothing is silently overwritten.
- **Atomicity.** A request is stored whole (`200`) or rejected whole (`4xx`). Warnings accompany
  a `200` and mean "stored, but fix this" — treat a non-empty `warnings[]` as a failed
  integration test.

---

## API specification

### Base URL and authentication

```
Base URL:        https://chartreuse-bay.vercel.app
Authentication:  Authorization: Bearer cr_rsp_<64 hex characters>
```

Keys are generated self-serve in **Settings → API Integration**, shown once, and stored only as
SHA-256 hashes — we cannot recover a lost key, only issue a new one. Keys are revocable by you,
instantly. To rotate: create the new key, deploy it, deactivate the old; both work during the
overlap. Keys belong in the `Authorization` header and on your server — never in a URL and never
in browser JavaScript, because a key grants write access.

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/rsp/usage` | Submit one usage period for one customer. Supports `dry_run`. |
| `GET` | `/api/rsp/impact` | Current impact totals from everything you've shared — org-wide and per client. Optional `?client_id=` filter. |

### Response — `POST /api/rsp/usage`

```json
{
  "api_signature": "cr-period-8f3c...",
  "status": "accepted",
  "period": {
    "id": "8f3c...",
    "date_min": "2026-07-01",
    "date_max": "2026-07-31",
    "superseded_count": 0,
    "account_created": false
  },
  "metrics": {
    "co2_avoided_kg": 145.51,
    "water_saved_gallons": 5580.0,
    "waste_diverted_lbs": 403.0,
    "single_use_equivalents": 15500
  },
  "warnings": []
}
```

### Response — `GET /api/rsp/impact`

```json
{
  "totals": {
    "co2_avoided_kg": 991.7,
    "water_saved_gallons": 31861.3,
    "waste_diverted_lbs": 2602.4,
    "single_use_equivalents": 67476,
    "period_count": 4,
    "client_count": 2
  },
  "clients": [
    {
      "client_id": "riverfront-cafe-01",
      "client_name": "Riverfront Cafe",
      "period_count": 2,
      "coverage_start": "2026-06-01",
      "coverage_end": "2026-07-31",
      "co2_avoided_kg": 282.2,
      "water_saved_gallons": 9104.6,
      "waste_diverted_lbs": 728.4,
      "single_use_equivalents": 23520
    }
  ]
}
```

### Status codes

| Code | Meaning |
|---|---|
| `200` | Stored (or validated, for a dry run). Check `warnings[]`. |
| `400` | Validation failed. The message names the offending field, including the array index for a bad event. |
| `401` | Missing, malformed, revoked, or deactivated key. |
| `404` | `GET /api/rsp/impact?client_id=...` with an unknown id. |
| `405` | Wrong HTTP method. |
| `500` | A fault on our side. Safe to retry — a failed submission stores nothing. |

### Warnings

| Code | Meaning |
|---|---|
| `unlinked_client_id` | Dry runs only: this `client_id` resolves to no account yet; a real submission will create one. |
| `client_account_created` | Real submissions only: this submission created a new account for a first-time `client_id`. Expected on onboarding; on a typo, a duplicate to merge. |
| `unknown_reusable_type` | One or more types were priced with fallback factors. `details.supportedTypes` lists recognized values. |
| `duplicate_reusable_type` | The same type appeared twice in `events[]`. Send one entry per type. |
| `no_outbound_events` | Every `out_warehouse_events` was zero, so all impact is zero. Usually swapped fields. |

---

## Data dictionary

| Field | Definition | Type | Unit |
|---|---|---|---|
| `out_warehouse_events` | Items sent out from your warehouse to the customer during the period | integer | items |
| `in_warehouse_events` | Items returned to your warehouse during the period | integer | items |
| `co2_avoided_kg` | Greenhouse gas emissions avoided by displacing single-use items, net of washing | number | kg CO₂e |
| `water_saved_gallons` | Water not consumed in single-use manufacturing, net of washing | number | US gallons |
| `waste_diverted_lbs` | Landfill waste avoided | number | pounds |
| `single_use_equivalents` | Single-use items displaced (equals total items sent out) | integer | items |
| `superseded_count` | Older overlapping periods replaced by this submission | integer | periods |

Impact factors are standardized per product type and identical for every provider, which makes
results comparable and summable across programs. They should be treated as provisional while
product-level matching — your specific products matched to the single-use items they displace —
is completed.

---

## Data lifecycle

- **What we store:** your customer identifier, period dates, per-type counts, and the metrics we
  compute. **What we never receive:** pricing, contract terms, revenue, routes, labor data, or
  customer contact lists — the API has no mechanism for sending them.
- **Who sees what:** your customer sees only their own account. You see every account your data
  feeds, every period, and a log of every API call your systems made.
- **History:** corrections supersede rather than overwrite; superseded records are retained and
  excluded from totals, so any past figure can be audited.
- **Benchmarking:** only as aggregated, anonymized comparisons against groups of similar
  programs. No operator or site is identifiable, and no operator sees another's data. This
  commitment is part of the written data agreement.
- **Leaving:** deactivate your keys and submissions stop. Data retention and deletion terms are
  covered in the data agreement.

---

## Integration guide

1. Get registered as a provider and generate an API key in **Settings → API Integration**.
2. Send a **dry run** for one customer. Confirm `warnings` is empty (or only `unlinked_client_id`
   for a genuinely new customer).
3. Dry-run your full set of product types. Confirm no `unknown_reusable_type`.
4. Send one real period. Check the returned `metrics` against your own figures, and confirm the
   client appears under **Settings → API Integration → Your clients**.
5. Backfill history, then move to your regular cadence — monthly is typical.

```bash
curl -X POST https://chartreuse-bay.vercel.app/api/rsp/usage \
  -H "Authorization: Bearer cr_rsp_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "dry_run": true,
    "client_id": "YOUR_CLIENT_ID",
    "date_min": "2026-07-01",
    "date_max": "2026-07-31",
    "events": [
      { "reusable_type": "cup", "out_warehouse_events": 12400, "in_warehouse_events": 11780 }
    ]
  }'
```

Questions about integrating? Contact your Upstream partner manager.
