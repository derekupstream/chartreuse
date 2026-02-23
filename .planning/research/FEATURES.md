# Feature Landscape

**Domain:** Public Environmental Impact REST API + AI Recommendations for Sustainability SaaS Calculator
**Researched:** 2026-02-23
**Scope:** Subsequent milestone — brownfield Next.js app (ChartReuse) adding a public REST API and AI-driven recommendations

---

## Context: What ChartReuse Already Has

Before listing features to build, it is critical to understand what exists. The calculator engine
(`lib/calculator/`) is already a clean set of pure TypeScript functions. It produces:

- **GHG emissions** (MTCO2e) broken down by: landfill waste (by material), shipping box/cardboard,
  dishwashing utilities, and reusable item transportation.
- **Waste weight** (pounds) broken down by: disposable product weight, disposable shipping box weight.
- **Water usage** (gallons) broken down by: manufacturing water per material, dishwashing water.
- **Financial projections** (baseline vs. forecast cost, ROI%, payback period months).

The engine inputs are a `ProjectInventory` — a rich domain object with single-use items, reusable
items, dishwashers, and utility rates. The public API surface needs to abstract this into a simpler
"usage in, impact out" contract.

Materials covered: Paper, Corrugated Cardboard, Molded Fiber, Wood, Plastics (PET, PP, PS, LDPE,
PLA, EPS Foam, LDPE), Aluminum, Glass, Ceramic, Stainless Steel, Polypropylene, HDPE, Melamine,
Polycarbonate. GHG factors sourced from EPA WARM model.

---

## Table Stakes

Features callers and users expect. Missing any of these means users leave or integrators give up.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **API key issuance (self-serve)** | Every developer API requires keys; keyless APIs are not taken seriously | Low | Store in Postgres; hash the secret; show once on creation |
| **API key scoped rate limiting** | Prevents one caller from DDoSing the endpoint; required for "free to use" sustainability | Low-Med | Token bucket per key. Standard: anonymous=no access, key=100-1000 req/day. Upstash Redis is idiomatic on Vercel. |
| **HTTP 429 + Retry-After header** | Callers need to know they are limited; `Retry-After` is the standard backoff signal | Low | Pair with `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` response headers |
| **Single-call "usage → impact" endpoint** | The core value: send product usage, get GHG/waste/water back in one call | Med | See schema design below. Analogous to Climatiq's `/data/v1/estimate` endpoint |
| **Structured error responses** | Callers cannot debug silent failures; JSON `{error, message, code}` is expected | Low | RFC 7807 Problem Details format is the 2025 standard |
| **HTTPS + CORS headers** | Every public API surveyed (Climatiq, Carbon Interface, 1ClickImpact) uses HTTPS + CORS enabled | None | Already handled by Vercel; add `Access-Control-Allow-Origin: *` for public reads |
| **OpenAPI / Swagger spec** | Devs expect machine-readable docs they can paste into Postman or code-gen from | Med | Write the spec first; generate the route from it or validate request/response against it |
| **Versioned endpoint path** | `/api/v1/impact` prevents breaking callers when the schema changes | Low | Put version in path, not headers — simpler for callers |
| **Per-request audit trail (caller side)** | API callers need to know what factors were used in a calculation, so they can cite sources | Low-Med | Return `emission_factors_used: [{material, epa_warm_factor, year}]` in response |

---

## Differentiators

Features not universally expected, but that create competitive advantage and mission alignment.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Reusable-vs-single-use framing** | All competitors (Climatiq, Carbon Interface) calculate "what is the carbon of X activity." ChartReuse's niche is the *delta*: "how much do you *save* by switching." Return `baseline`, `forecast`, and `change` for all metrics, not just totals. | Low | Already the engine's native output shape (`ChangeSummary`). Expose it directly. |
| **Multi-material product inputs** | Products have a primary and secondary material (e.g., a paper cup with plastic lining). Accepting `primaryMaterial` + `secondaryMaterial` per item produces materially more accurate outputs than single-material APIs. | Low | Already how the calculator works. Surface it cleanly. |
| **Industry benchmark response field** | Return a `benchmark` object alongside individual results: "your GHG savings are in the 73rd percentile of similar organizations." This creates a data network effect — the more calls, the richer the benchmarks. | High | Requires anonymous aggregation pipeline; see Anti-Features for what NOT to do here |
| **Free tier without paywall** | EPA APIs require data exploration; Climatiq's free tier is 250 calls/month (very restrictive). ChartReuse is positioning as genuinely free for environmental data. Free access builds goodwill and adoption. | Low | Design decision already made in PROJECT.md; rate limiting enforces fairness without paywall |
| **EPA WARM model attribution in response** | Return the emission factor source (`source: "EPA WARM Model"`, `year: 2025`, `factor_value: 0.0011 MTCO2e/lb`) alongside results. This is what makes the data citable in sustainability reports. | Low | Data already in `lib/calculator/constants/materials.ts`. Surface it. |
| **Batch endpoint (`/impact/batch`)** | Allows a single caller to submit multiple product + usage combinations in one HTTP call. Reduces latency for callers computing impact across a fleet. | Med | POST array of items; return array of results. Cap batch size at 50. |
| **Dishwasher utility impact calculation** | Unique to this domain. No other public environmental API accounts for the added water and energy of industrial dishwashing when calculating reusable foodware impact. | Low | Already computed in the engine; surface as optional input section |

---

## AI-Driven Recommendations: Table Stakes vs Differentiators

This is a separate feature stream from the public API. The question is whether to use rule-based logic
or an LLM, and what "recommendations" actually means in this context.

### What "AI Recommendations" Looks Like in a Calculator SaaS

Two implementation approaches exist along a spectrum:

**Approach A: Rule-Based / Threshold Triggers (HIGH confidence recommendation)**
- Read the project's calculated results and fire recommendations when thresholds are crossed.
- Examples: "Your payback period is 28 months — typical reusable programs achieve 18 months. Consider
  reducing reusable repurchase rate." / "Aluminum products account for 67% of your GHG baseline —
  switching to glass or PP would reduce this by ~40%."
- These are deterministic, auditable, and free to run.
- SAP does this for procurement sustainability (matches embeddings to emission factors with similarity
  scores), but the underlying recommendation triggers are still rule-based.
- ChartReuse already has a `showRecommendations` flag and `recommendations (Json)` field on the Project
  model — this is the skeleton for rule-based outputs.

**Approach B: LLM-Generated Natural Language (MEDIUM confidence recommendation)**
- Pass structured project summary data to an LLM (Claude, GPT-4o) with a system prompt. LLM returns
  natural-language narrative recommendations.
- Value: output is readable prose, not a list of triggered rules. Can explain tradeoffs contextually.
- Cost: LLM API cost per project load; latency; hallucination risk on numerical claims.
- Best pattern (2025): use rule-based logic to identify what to recommend; use the LLM only to render
  the recommendation in natural language. Never let the LLM calculate — it calculates badly.

| Feature | Why Expected / Value | Complexity | Notes |
|---------|----------------------|------------|-------|
| **Rule-based recommendation triggers** | Table stakes — the Project model already has the `recommendations` JSON field. Users expect the dashboard to tell them something actionable. | Low-Med | 5-10 rules based on calculated output fields: payback period, GHG savings %, material mix, dishwasher water delta |
| **LLM narrative rendering** | Differentiator — makes recommendations readable and "AI-native" feeling. Raises perceived product value. | Med | Gate behind feature flag. Structured prompt: system prompt sets constraints (no hallucination of numbers, cite the calculator's values); user message = serialized project summary + triggered rules. Use Claude or GPT-4o. |
| **Per-project recommendation storage** | Already exists: `recommendations (Json)` on Project. Persist generated recommendations so they load instantly on revisit. | Low | Regenerate on project save or on explicit user action |
| **LLM cost guard** | LLM calls cost money; unguarded they can bankrupt a small project. | Low | Rate-limit LLM calls per org per day; cache generated recommendations per project data hash |

---

## Anti-Features

Features to deliberately NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Real-time aggregate benchmarks on every API call** | Querying aggregate statistics synchronously on each `/impact` call adds DB load, introduces variable latency, and risks leaking sparse data. If only 3 organizations have called the API for "aluminum cups," returning a benchmark reveals information about those 3 orgs. | Compute benchmarks asynchronously on a schedule (daily/weekly). Return benchmarks only when sample size >= 10 (k-anonymity minimum). Serve from a precomputed table, not a live query. |
| **Signed-in user requirement for the public API** | The public API's value proposition is frictionless access. Requiring account creation kills adoption. Auth for the internal app (Firebase → NextAuth) is separate from API key issuance. | Issue API keys via a lightweight self-serve form (email + key). No org/subscription required. |
| **GraphQL for the public API** | GraphQL is appropriate for complex relational data with variable client shapes. The impact API has a simple, stable input/output schema. GraphQL adds tooling overhead and complexity for no caller benefit. | REST with JSON. OpenAPI spec. |
| **LLM for numerical calculation** | LLMs hallucinate numbers. Letting an LLM calculate GHG or payback period is a reliability and auditability failure. | The calculator engine does all math. The LLM renders language around the numbers the engine produced. |
| **Storing raw API caller inputs with org/user identifiers** | GDPR/CCPA risk. If the public API is truly anonymous, storing identifiable caller data for "benchmarking" creates legal obligations with no product benefit. | Strip all PII at ingestion. Store only the calculated outputs (anonymized: material counts, GHG delta, waste delta, water delta) with no org name, contact, or IP. |
| **Per-material breakdown in benchmark responses** | Fine-grained material benchmarks increase re-identification risk (e.g., "organization using PLA + Aluminum + Glass is identifiable in a cohort of 8"). | Benchmark only on high-level rollups: total GHG delta, total waste delta by venue type. |
| **Webhook or streaming support** | Impact calculations are synchronous and fast (< 50ms in pure functions). Webhooks and SSE add infrastructure complexity with no benefit at this scale. | Synchronous JSON response. Revisit if calculation time grows beyond 2 seconds. |
| **Paid tier for the public API** | PROJECT.md is explicit: the API is free. Adding a paid tier creates billing infrastructure, support burden, and undercuts the mission positioning ("data sharing for industry benchmarks"). | Rate limit the free tier generously (1000 req/day per key is sustainable on Vercel + Upstash). |

---

## Request/Response Schema Design

Based on analysis of the ChartReuse calculator engine and the Climatiq API (the closest comparable),
the following schema is recommended for the core endpoint.

### Endpoint: `POST /api/v1/impact`

**Authentication:** `Authorization: Bearer <api_key>`

**Request Body:**
```json
{
  "items": [
    {
      "type": "single_use",
      "product_name": "12oz Paper Cup",
      "primary_material": "Paper",
      "primary_material_weight_per_unit_lb": 0.025,
      "secondary_material": "Plastic (#1 PET)",
      "secondary_material_weight_per_unit_lb": 0.002,
      "cases_purchased": 100,
      "units_per_case": 1000,
      "frequency": "Monthly",
      "box_weight_lb": 2.5
    },
    {
      "type": "reusable",
      "product_name": "12oz Ceramic Mug",
      "primary_material": "Ceramic",
      "primary_material_weight_per_unit_lb": 0.8,
      "cases_purchased": 5,
      "units_per_case": 12,
      "annual_repurchase_rate": 0.15
    }
  ],
  "dishwasher": {
    "racks_per_day": 20,
    "operating_days_per_year": 250,
    "type": "door",
    "fuel_type": "electric",
    "energy_star": true
  },
  "region": "US-CA"
}
```

**Response Body:**
```json
{
  "ghg": {
    "baseline_mtco2e": 4.82,
    "forecast_mtco2e": 1.14,
    "change_mtco2e": -3.68,
    "change_percent": -76.3,
    "breakdown": {
      "landfill_waste_mtco2e": { "baseline": 4.12, "forecast": 0.98 },
      "shipping_box_mtco2e":   { "baseline": 0.45, "forecast": 0.11 },
      "dishwashing_mtco2e":    { "baseline": 0.0,  "forecast": 0.05 }
    }
  },
  "waste": {
    "baseline_lb": 2840,
    "forecast_lb": 680,
    "change_lb": -2160,
    "change_percent": -76.1
  },
  "water": {
    "baseline_gal": 10480,
    "forecast_gal": 3210,
    "change_gal": -7270,
    "change_percent": -69.4
  },
  "methodology": {
    "ghg_source": "EPA WARM Model",
    "ghg_factors_year": 2025,
    "emission_factors_used": [
      { "material": "Paper", "mtco2e_per_lb": 0.004685 },
      { "material": "Plastic (#1 PET)", "mtco2e_per_lb": 0.0011 },
      { "material": "Ceramic", "mtco2e_per_lb": 0.000807 }
    ]
  },
  "meta": {
    "request_id": "req_01JMXXXXXX",
    "computed_at": "2026-02-23T14:22:01Z",
    "api_version": "v1"
  }
}
```

**Key design choices (sourced from Climatiq schema analysis and ChartReuse engine types):**
- `baseline` / `forecast` / `change` mirroring ChartReuse's native `ChangeSummary` type
- `methodology` block with factor provenance — required for callers to cite in sustainability reports
- `request_id` for support/debugging without storing PII

---

## Feature Dependencies

```
API key issuance
  → API key rate limiting (requires a key to limit against)
  → Versioned endpoint (key ties to a version)

Single-call impact endpoint
  → OpenAPI spec (spec before code)
  → EPA WARM factor attribution (factors are already in the engine)

Industry benchmark responses
  → Anonymous data ingestion pipeline (raw inputs stripped before storage)
  → Minimum-k threshold enforcement (k >= 10 before surfacing benchmark)
  → Precomputed benchmark table (async job, not live query)

LLM recommendations
  → Rule-based triggers (LLM renders rules, not replaces them)
  → LLM cost guard (rate limit per org per day, cache by data hash)
  → Per-project recommendation storage (already exists as JSON field on Project)
```

---

## MVP Recommendation

For the first shipped increment of these two features:

**Public API MVP (ship in this order):**
1. API key self-serve issuance (email → key → stored hashed in Postgres)
2. `POST /api/v1/impact` — single-item or multi-item request, GHG + waste + water response with methodology block
3. Per-key rate limiting via Upstash Redis (1000 req/day free tier)
4. OpenAPI spec in `/docs/api/openapi.yaml`

**AI Recommendations MVP:**
1. Rule-based triggers on 5 threshold conditions (payback period, GHG savings %, dominant material, dishwasher water delta, repurchase rate outlier)
2. Persist triggered rules to existing `recommendations (Json)` field on Project
3. Render on the projections dashboard as dismissible cards

**Defer to follow-on:**
- Industry benchmarks: requires sufficient API call volume to avoid k-anonymity violations; build the data ingestion pipeline now, surface benchmarks when k >= 10.
- LLM narrative rendering: add after rule-based recommendations are validated and trusted. Complexity and cost without proven user demand is wasteful.
- Batch endpoint: add based on API consumer feedback.
- Dishwasher section in public API: optional input; add after core endpoint is stable.

---

## Sources

- Climatiq API Reference — request/response schema, estimate endpoint, pricing:
  https://www.climatiq.io/docs/api-reference/estimate (MEDIUM confidence — fetched directly)
- Climatiq Pricing — free tier 250 calls/month:
  https://www.climatiq.io/pricing (MEDIUM confidence — from WebSearch)
- Public Environment APIs directory — survey of 19 environment APIs:
  https://publicapis.dev/category/environment (MEDIUM confidence — fetched directly)
- Upstash Redis rate limiting for Next.js — implementation pattern:
  https://upstash.com/blog/nextjs-ratelimiting (MEDIUM confidence — WebSearch verified)
- Zuplo rate limiting best practices 2025:
  https://zuplo.com/learning-center/10-best-practices-for-api-rate-limiting-in-2025 (MEDIUM confidence)
- Speakeasy API rate limiting design:
  https://www.speakeasy.com/api-design/rate-limiting (MEDIUM confidence)
- k-Anonymity and re-identification threshold research:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC2528029/ (HIGH confidence — peer reviewed)
- SAP Sustainability AI recommendations (embedding-based, similarity scores):
  https://news.sap.com/2024/11/accelerating-your-journey-ai-transformative-role-sustainability/ (MEDIUM confidence)
- RecPrompt framework — LLM recommendation patterns:
  https://www.prompthub.us/blog/recprompt-a-prompt-engineering-framework-for-llm-recommendations (LOW confidence — single source)
- De-identified data in SaaS agreements (legal framing):
  https://contractnerds.com/de-identified-data-in-saas-agreements/ (MEDIUM confidence)
- EPA GHG Emission Factors Hub 2025 update:
  https://www.epa.gov/climateleadership/ghg-emission-factors-hub (HIGH confidence — official EPA)
- ChartReuse calculator engine source — materials constants, GHG/waste/water calculations:
  `/Users/derekalanrowe/Dev/ChartReuse/lib/calculator/` (HIGH confidence — primary source)
