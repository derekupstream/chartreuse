# Requirements: ChartReuse (derekupstream fork)

**Defined:** 2026-02-23
**Core Value:** The calculator's projection engine (GHG, waste, financial) must remain accurate and reliable — everything else is enhancements on top of that foundation.

## v1 Requirements

### Fork & Deployment

- [ ] **FORK-01**: Fork is pushed to derekupstream GitHub from UpstreamSolutions/ChartReuse
- [ ] **FORK-02**: App runs locally against own PostgreSQL database with all Prisma migrations applied
- [ ] **FORK-03**: App is deployed to own Vercel instance with all environment variables configured
- [ ] **FORK-04**: Own Heroku PostgreSQL database provisioned and connected to Vercel deployment
- [ ] **FORK-05**: Own Firebase project configured for initial auth (pre-migration state)
- [ ] **FORK-06**: Own Stripe account configured for billing
- [ ] **FORK-07**: Own Mailgun account configured for transactional email
- [ ] **FORK-08**: App passes end-to-end smoke test: sign up → create project → enter data → view projections

### Auth Modernization

- [ ] **AUTH-01**: User can sign in with email and password via Better Auth (replaces Firebase)
- [ ] **AUTH-02**: User session persists across browser refresh without re-login
- [ ] **AUTH-03**: User can reset password via email link (Mailgun delivery)
- [ ] **AUTH-04**: All protected routes (pages + API) remain protected after Firebase cutover
- [ ] **AUTH-05**: `firebase`, `firebase-admin`, and `nookies` packages removed from codebase
- [ ] **AUTH-06**: All Firebase environment variables removed from Vercel and Heroku deployments

### Calculator Enhancements

- [ ] **CALC-01**: EPA WARM 2025 emission factors replace stale constants in `lib/calculator/constants/carbon-dioxide-emissions.ts`
- [ ] **CALC-02**: Calculator produces multi-year projection output (1-10 year annual slices) in addition to existing single-year results
- [ ] **CALC-03**: Projections dashboard displays multi-year time-series charts (GHG, waste, financial) using existing `@ant-design/plots` components
- [ ] **CALC-04**: Payback period crossover point is visualized on the financial projection chart

### Share & Export

- [ ] **SHARE-01**: A "Share & Export" panel is accessible from the projections page, allowing users to configure what their audience sees
- [ ] **SHARE-02**: User can toggle which sections appear in the shared/exported view (financial projections, environmental impact, product breakdown, bottle station, etc.)
- [ ] **SHARE-03**: User can toggle individual charts and tables within each section for granular control
- [ ] **SHARE-04**: User can choose between **raw data mode** (landfill diversion in kg, water saved in gallons, GHG in kg CO₂e) and **equivalency mode** (e.g. "200 cars off the road", "2,000 trees planted", "$10,000 in avoided mitigation costs") per metric
- [ ] **SHARE-05**: User can set a custom title and narrative text for the shared view
- [ ] **SHARE-06**: User can upload an org logo that appears on the shared view and PDF export
- [ ] **SHARE-07**: Sharing configuration drives both the shareable public link and the PDF export (one config, two outputs)
- [ ] **SHARE-08**: Shareable public link reflects the configured sections, equivalencies, and branding
- [ ] **SHARE-09**: PDF export renders the configured view — all charts, equivalencies, and narrative — printable via browser to A4/US Letter

### Product & UX Improvements

- [ ] **UX-01**: Application is mobile-responsive across all core pages (projects list, project tabs, projections dashboard)
- [ ] **UX-02**: Share pages (public read-only project view) are mobile-responsive and honor the sharing configuration
- [ ] **UX-03**: Main navigation menu is restructured to match customer workflows and modes of use
- [ ] **UX-04**: Settings page includes a dedicated API configuration section (for future API key management)
- [ ] **PERF-01**: Key pages (project list, projections dashboard) load within acceptable performance targets with no unnecessary re-fetches

### Analytics Improvements

- [ ] **ANLT-01**: Analytics page supports filtering by time range (custom date picker, preset ranges)
- [ ] **ANLT-02**: Analytics views (filters, groupings, visible columns) can be saved per user and reloaded

### Projections & Reporting

- [ ] **PROJ-01**: Equivalency library maps raw impact values to human-scale comparisons (cars off the road, trees planted, Olympic pools, homes powered, mitigation cost savings) using EPA equivalency factors
- [ ] **PROJ-02**: Reporting tools support active reuse systems — track actual usage data against projections and report on real-world impact over time
- [ ] **PROJ-03**: Community-wide projection tools allow modeling impact at scale using venue archetypes (café, stadium, campus, etc.), place-settings (seating/service capacity), and multipliers

### AI Recommendations

- [ ] **AI-01**: Rule-based engine identifies recommendation opportunities from project data (e.g. payback period > threshold, dominant material with high GHG factor, dishwasher water delta outlier, repurchase rate anomaly)
- [ ] **AI-02**: LLM renders identified opportunities as natural-language recommendations on the projections dashboard
- [ ] **AI-03**: Recommendations load asynchronously — page renders without waiting for LLM response
- [ ] **AI-04**: Recommendations are stored per-project in the existing `recommendations (Json)` field on the Project model
- [ ] **AI-05**: LLM is never given arithmetic to perform — all numerical context is pre-calculated by the engine and passed as grounding

## v2 Requirements

### Public REST API

- **API-01**: Public `POST /api/v1/impact` endpoint — callers send reusable product usage counts, receive GHG saved, waste avoided, and water impact
- **API-02**: Self-serve API key issuance — email → API key delivered, SHA-256 hash stored in Postgres
- **API-03**: Per-key rate limiting with HTTP 429 + `Retry-After` and `X-RateLimit-*` headers (Upstash Redis)
- **API-04**: Versioned path (`/api/v1/`) established from first commit
- **API-05**: Structured error responses (RFC 7807 Problem Details format)
- **API-06**: OpenAPI spec at `/docs/api/openapi.yaml`
- **API-07**: EPA WARM factor provenance included in response body (enables citation in sustainability reports)
- **API-08**: Anonymous usage data stored per submission for future industry benchmark aggregation

### Server-Generated PDF

- **PDF-04**: Server-side PDF generation via Puppeteer on Heroku — user clicks button, receives a `.pdf` file download
- **PDF-05**: Generated PDF renders all Ant Design SVG charts faithfully

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app (iOS/Android) | Web-first, same as Upstream version — browser on mobile is sufficient |
| GraphQL API | Simple, stable input/output schema doesn't warrant the overhead |
| Replacing Postgres/Prisma | No reason to change the DB layer; existing schema is solid |
| Competing commercially with Upstream | This is a personal fork and research sandbox |
| LLM performing arithmetic | Hallucination risk; calculator engine owns all numbers |
| Paid API tier | API is free by design; value is in data sharing and adoption |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORK-01 | Phase 1 | Pending |
| FORK-02 | Phase 1 | Pending |
| FORK-03 | Phase 1 | Pending |
| FORK-04 | Phase 1 | Pending |
| FORK-05 | Phase 1 | Pending |
| FORK-06 | Phase 1 | Pending |
| FORK-07 | Phase 1 | Pending |
| FORK-08 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| CALC-01 | Phase 3 | Pending |
| CALC-02 | Phase 3 | Pending |
| CALC-03 | Phase 3 | Pending |
| CALC-04 | Phase 3 | Pending |
| SHARE-01 | Phase 3 | Pending |
| SHARE-02 | Phase 3 | Pending |
| SHARE-03 | Phase 3 | Pending |
| SHARE-04 | Phase 3 | Pending |
| SHARE-05 | Phase 3 | Pending |
| SHARE-06 | Phase 3 | Pending |
| SHARE-07 | Phase 3 | Pending |
| SHARE-08 | Phase 3 | Pending |
| SHARE-09 | Phase 3 | Pending |
| UX-01 | Phase 3 | Pending |
| UX-02 | Phase 3 | Pending |
| UX-03 | Phase 3 | Pending |
| UX-04 | Phase 3 | Pending |
| PERF-01 | Phase 3 | Pending |
| ANLT-01 | Phase 3 | Pending |
| ANLT-02 | Phase 3 | Pending |
| PROJ-01 | Phase 3 | Pending |
| PROJ-02 | Phase 3 | Pending |
| PROJ-03 | Phase 3 | Pending |
| AI-01 | Phase 4 | Pending |
| AI-02 | Phase 4 | Pending |
| AI-03 | Phase 4 | Pending |
| AI-04 | Phase 4 | Pending |
| AI-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 33
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-23 after initial definition*
