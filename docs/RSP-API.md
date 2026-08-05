# Chart-Reuse Usage Intake API

For Reuse Service Providers (RSPs) sending operational usage data to Chart-Reuse.

This document is written to be handed to a partner's engineering team. Everything in it is
implemented in [`pages/api/rsp/usage.ts`](../pages/api/rsp/usage.ts).

---

## Before you can send anything

Three things must exist on the Chart-Reuse side. Upstream sets these up; ask them to confirm all
three before you start, because a submission can succeed while step 3 is missing.

1. **Your organization is registered as a Reuse Service Provider.** Super Admin → RSP Hub →
   Register RSP.
2. **You have an API key.** Either you generate it yourself in Chart-Reuse under
   **Settings → API Integration**, or Upstream generates it for you. The key is shown once and
   never again.
3. **Each of your customers is linked to a Chart-Reuse account.** You send a `client_id` for each
   customer; Upstream maps that string to an account in Super Admin → RSP Hub → _(your org)_ →
   Client links. **If a `client_id` is not mapped, your submission is still accepted and stored,
   but the data never reaches that customer's dashboard.** The response tells you when this
   happens — see [Warnings](#warnings).

---

## Endpoint

```
POST https://chartreuse-bay.vercel.app/api/rsp/usage
Authorization: Bearer cr_rsp_<64 hex characters>
Content-Type: application/json
```

Keys always begin with `cr_rsp_`. Send the key in the `Authorization` header as a bearer token —
never in a query string.

## Request body

| Field                           | Type    | Required | Notes                                                                                                                 |
| ------------------------------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `client_id`                     | string  | yes      | Your identifier for the customer. Case-sensitive; must exactly match what Upstream mapped.                            |
| `date_min`                      | string  | yes      | First day of the reporting period, `YYYY-MM-DD`.                                                                      |
| `date_max`                      | string  | yes      | Last day of the reporting period, `YYYY-MM-DD`. Must be on or after `date_min`.                                       |
| `events`                        | array   | yes      | At least one entry. One entry per reusable type.                                                                      |
| `events[].reusable_type`        | string  | yes      | See [Reusable types](#reusable-types).                                                                                |
| `events[].out_warehouse_events` | number  | yes      | Items sent out to the customer in this period. **This is what impact is calculated from.** Cannot be negative.        |
| `events[].in_warehouse_events`  | number  | yes      | Items returned in this period. Stored for return-rate reporting; does not itself drive impact. Cannot be negative.    |
| `dry_run`                       | boolean | no       | When `true`, the payload is validated and priced but nothing is stored. See [Testing](#testing-without-writing-data). |

```json
{
  "client_id": "berkeley-campus-01",
  "date_min": "2026-07-01",
  "date_max": "2026-07-31",
  "events": [
    { "reusable_type": "cup", "out_warehouse_events": 12400, "in_warehouse_events": 11780 },
    { "reusable_type": "bowl", "out_warehouse_events": 3100, "in_warehouse_events": 2890 }
  ]
}
```

Send **one entry per `reusable_type` per period**. A repeated type is stored as two separate rows
rather than being summed, and you will get a `duplicate_reusable_type` warning.

## Reusable types

These are the values with dedicated impact factors:

`bowl` · `container` · `cup` · `fork` · `glass` · `knife` · `plate` · `spoon` · `tray` · `utensils`

Matching is case-insensitive. **Anything else is accepted but priced with generic fallback
factors**, which makes those results approximate — you'll get an `unknown_reusable_type` warning
listing what wasn't recognised. If you handle a type that isn't on this list, tell Upstream rather
than inventing a name; a real factor can be added for it.

## Response

`200 OK`

```json
{
  "api_signature": "cr-period-8f3c...",
  "status": "accepted",
  "period": {
    "id": "8f3c...",
    "date_min": "2026-07-01",
    "date_max": "2026-07-31",
    "superseded_count": 0
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

`metrics` is what Chart-Reuse computed from your payload. Comparing it against your own
expectation is the quickest way to catch a field-mapping mistake.

### Re-sending a period

Submissions are not rejected as duplicates. If a new period overlaps periods you sent before, the
older ones are **superseded** — marked inactive and replaced by the new one — and
`superseded_count` tells you how many. So correcting a month means simply re-sending it with the
same dates.

`superseded_count` above 3 is flagged internally as unusual; if you see it regularly, your periods
are probably overlapping in a way you didn't intend.

### Warnings

`warnings` is an array of problems that did **not** stop the submission but that you should fix.
An empty array means a clean submission. Treat a non-empty `warnings` array as a failed
integration test, not a success.

| `code`                    | What it means                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `unlinked_client_id`      | No Chart-Reuse account carries this `client_id`. Stored, but invisible to the customer. Ask Upstream to link it.                                       |
| `unknown_reusable_type`   | One or more types were priced with fallback factors. `details.supportedTypes` lists the recognised values.                                             |
| `duplicate_reusable_type` | The same type appeared more than once in `events[]`. Combine them into one entry.                                                                      |
| `no_outbound_events`      | Every `out_warehouse_events` was zero, so all impact metrics are zero. Usually means outbound and inbound were swapped, or the wrong field was mapped. |

## Errors

| Status | Body                                         | Cause                                                                                                                                                           |
| ------ | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | `{ "error": "..." }`                         | Body failed validation. The message names the offending field, including the index for a bad event (e.g. `events[2].reusable_type must be a non-empty string`). |
| `401`  | `{ "error": "Invalid or inactive API key" }` | Missing, malformed, revoked, or deactivated key.                                                                                                                |
| `405`  | `{ "error": "Method not allowed" }`          | Anything other than `POST`.                                                                                                                                     |
| `500`  | `{ "error": "..." }`                         | A fault on our side. Safe to retry; a failed submission stores nothing.                                                                                         |

Validation errors you may hit:

- `client_id, date_min, date_max, and events[] are required`
- `date_min and date_max must be valid ISO dates (YYYY-MM-DD)`
- `date_min must be before date_max`
- `events[n].reusable_type must be a non-empty string`
- `events[n] must have numeric in_warehouse_events and out_warehouse_events`
- `events[n] event counts cannot be negative`

## Testing without writing data

Add `"dry_run": true` to the body (or `?dry_run=true` to the URL). The payload is authenticated,
validated, checked for warnings, and priced exactly as a real submission would be — and then
discarded. Use this to prove your integration end to end, including that your `client_id` resolves,
before any real data lands.

```bash
curl -X POST https://chartreuse-bay.vercel.app/api/rsp/usage \
  -H "Authorization: Bearer cr_rsp_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "dry_run": true,
    "client_id": "berkeley-campus-01",
    "date_min": "2026-07-01",
    "date_max": "2026-07-31",
    "events": [
      { "reusable_type": "cup", "out_warehouse_events": 12400, "in_warehouse_events": 11780 }
    ]
  }'
```

A dry run responds with `"status": "validated"`, `"dry_run": true`, and
`period.account_linked` — a boolean confirming your `client_id` resolved to an account. It has no
`period.id`, because no period was created.

### Recommended go-live sequence

1. Dry-run one period. Confirm `warnings` is empty and `account_linked` is `true`.
2. Dry-run your full set of reusable types. Confirm no `unknown_reusable_type`.
3. Send one real period. Check `metrics` against your own figures.
4. Ask Upstream to confirm the period appears on the customer's dashboard.
5. Backfill history, then move to your regular cadence.

## Operational notes

- **Cadence.** Monthly is typical. Any period length works; overlapping periods supersede.
- **Timezones.** `date_min` and `date_max` are plain dates, stored as dates. No timezone applies.
- **Key rotation.** Generate the new key, deploy it, then have the old one deactivated. Both work
  during the overlap.
- **Every request is logged.** Upstream can see status, outcome, latency, and the warnings you were
  sent for any request — useful when debugging together. Super Admin → RSP Hub → Activity Feed.
- **Impact factors.** The per-item avoided-impact values are currently maintained as constants in
  [`lib/rsp/impactFactors.ts`](../lib/rsp/impactFactors.ts) and are not yet sourced from the Factor
  Library. Treat the returned metrics as provisional pending that work.
