# RSP Demo Brief

Internal prep for meeting a prospective Reuse Service Provider. Everything in here is true of
the product as of today — the last section lists the honest answers for the places where the
product is still catching up to the pitch.

---

## The story in one paragraph

You already track what leaves your warehouse and what comes back. Once a reporting period
closes, your system sends us one message per customer with those counts. We calculate the
avoided impact — greenhouse gas, water, landfill waste, single-use items displaced — and hand
it back in the same response. Each of your customers gets their own account in Chart-Reuse,
created automatically the first time you send data for them, and they can log in and see their
own results without ever seeing another customer's. You can log in yourself at any time and see
exactly what you've shared, for whom, and what every API call your systems made returned.

## Demo walkthrough (in order)

Prep beforehand: register a demo RSP org in Super Admin → RSP Hub → Register RSP, make sure you
have a login belonging to that org, and have a terminal ready with the curl examples below. Do
this against local dev or be prepared to clean up afterward.

1. **Settings → API Integration.** Log in as the RSP org. Show them generating an API key —
   point out it's shown once, stored only as a hash, and they can revoke it themselves.
2. **A dry run.** Run the dry-run curl (below). Show the response: validated, priced, warnings
   empty, and nothing stored. This is how their dev team proves the integration before any real
   data moves.
3. **A real submission for a new customer.** Same call without `dry_run`, with a `client_name`.
   Show the response: metrics computed, `account_created: true`, and a
   `client_account_created` notice. Their customer now exists in Chart-Reuse — no setup call,
   no spreadsheet.
4. **Your clients.** Refresh the Settings page. The new customer is in the "Your clients" table
   with the period count, the date coverage, and the impact totals from what was just sent.
   This table is the standing answer to "what are we sharing with Chart-Reuse?"
5. **Recent API activity.** Show the log: the dry run, the real submission, each with outcome
   and latency. Then send a deliberately broken call (bad key, or a negative count) and show
   the exact error appearing here — this is their troubleshooting view, no email to us needed.
6. **Re-send the same period.** Same call again. Show `superseded_count: 1` — corrections are
   just re-sends, never duplicates.
7. **The customer's side.** Explain: each client account can have users invited to it, and they
   see only their own account's data. (See "honest answers" below before promising specifics
   about what the customer's dashboard shows today.)
8. **The partner's website (optional showstopper).** Open `http://localhost:3000/reuze-demo.html`
   — a fake RSP site ("ReUze"). Paste a key from `scripts/setup-reuze-demo.ts`, press "Send this
   month's data", and watch the site's own impact widget fill in with lbs waste avoided, gallons
   water saved, and kg CO2e reduced, pulled live from `GET /api/rsp/impact`. This is the "your
   customers' impact on your own marketing site" story, running end to end.

### Demo curl — dry run

```bash
curl -X POST http://localhost:3000/api/rsp/usage \
  -H "Authorization: Bearer cr_rsp_THEIR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "dry_run": true,
    "client_id": "demo-cafe-01",
    "client_name": "Demo Cafe",
    "date_min": "2026-07-01",
    "date_max": "2026-07-31",
    "events": [
      { "reusable_type": "cup",  "out_warehouse_events": 12400, "in_warehouse_events": 11780 },
      { "reusable_type": "bowl", "out_warehouse_events": 3100,  "in_warehouse_events": 2890 }
    ]
  }'
```

Remove the `dry_run` line for the real submission (step 3).

**"Can you share your data ingestion model?"** Yes — it's a public page:
`https://chartreuse-bay.vercel.app/rsp/ingestion-model`. Seven-step pipeline diagram, what's
stored vs never collected, and the data-use commitments. Also embedded in Settings → API
Integration with a copy-link button. No account needed to view it.

## What they share — and what we never see

They send, per customer per period: a customer identifier they choose, a date range, and counts
of items sent out and returned by reusable type. That is the entire payload.

We never receive: pricing, contract terms, revenue, routes, labor data, customer contact lists,
or anything about how they run their operation.

## Security posture (all real today)

- Keys are random 256-bit values, shown once at creation, stored only as SHA-256 hashes. We
  cannot recover a lost key — only issue a new one.
- Keys are revocable by the RSP themselves in Settings, instantly. Rotation = create new,
  deploy, deactivate old; both work during the overlap.
- All traffic is HTTPS. Keys travel in the Authorization header, never in URLs.
- Every request is logged — timestamp, outcome, latency, originating IP — and the RSP can see
  their own log in Settings.
- Data is scoped by organization at the query layer: an RSP sees only accounts linked to their
  org; a customer sees only their own account.

## Data anonymization and benchmarking (commitment, not yet product)

The position to state: customer-level data exists so _that customer_ can see their own impact.
Benchmarking, when it comes, will use only aggregated, anonymized figures — "compared with
similar programs," never "compared with this named operator." No operator or site will be
identifiable, and no operator will see another's data. We are working with legal counsel now to
put that in writing as part of the data agreement, and we'd rather hand them a signed commitment
than a verbal assurance. If they ask to see the agreement: it's in drafting, and their input on
it is welcome — that's a genuine offer, early partners get to shape the terms.

## What their dev team actually does

1. Get a key (self-serve in Settings once we register their org).
2. Write a job that runs when a reporting period closes: pull the counts they already produce,
   POST one JSON message per customer. Any language; no SDK; one endpoint.
3. Map their internal customer IDs to stable `client_id` strings (their choice of format).
4. Dry-run everything first; go live when warnings are empty.
5. Full contract: `docs/RSP-API.md` — written to hand directly to their engineers.

Typical effort if they already produce monthly reporting exports: days, not weeks.

## Honest answers for the hard questions

**"How are the impact numbers calculated?"** Today: per-type factors (a cup, a bowl) applied to
outbound counts — consistent across every provider, so results are comparable and summable. The
next step, in design now, is product-level matching: their specific reusable products matched to
the specific single-use items they displace per venue, run through the same engine as our
projections calculator. Don't call today's numbers "verified" — call them standardized and
provisional, and comparable across operators.

**"What does our customer see when they log in?"** Their account exists and their data routes to
it, and the accounts page shows their submission history. The rich customer-facing impact
dashboard (charts building month over month) is what we're building for the October beta launch.
If they push: today the full per-client impact totals are visible to _the RSP_ in Settings; the
customer-side equivalent lands before beta.

**"Who else is integrating?"** Sharewares and 99Bridges are committed to the October beta. (Only
name them if that's public/agreed — check before the meeting.)

**"Can we get our data back out?"** Yes. `GET /api/rsp/impact` returns their current totals —
org-wide and per client — with the same key, so they can render impact numbers on their own
website. The live demo of exactly that: `scripts/setup-reuze-demo.ts` +
`http://localhost:3000/reuze-demo.html`, a fake RSP site that sends monthly data and displays
the returned lbs waste / gallons water / kg CO2e. One caveat to volunteer: the key grants write
access too, so the call belongs on their server, never in their site's browser JavaScript.

**"What happens if we stop?"** Their keys deactivate, submissions stop, and existing data stays
with their customers' accounts unless removal is agreed. (Data-deletion terms belong in the
legal agreement being drafted — flag it to counsel rather than improvising a policy in the
meeting.)
