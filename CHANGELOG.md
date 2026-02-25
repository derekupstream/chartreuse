# Changelog

All notable changes to Chart-Reuse by Upstream are tracked here.
Milestones represent batches of changes that meaningfully improve the product.

---

## Milestone 2 — Responsive UI (2026-02-25)

**Goal:** Production-grade responsive layout across the entire app — no overflow, no horizontal scrolling, stack on mobile.

### Changes

- **Form wrappers**: Changed `width: 317px` → `max-width: 317px; width: 100%` across 12 form style files (login, signup, reset-password, org/account setup, member invite/edit, etc.) — forms now shrink gracefully on narrow screens instead of overflowing.
- **Project setup wrapper**: Changed `width: 460px` → `max-width: 460px; width: 100%` in `ProjectSetup.tsx` and `components/projects/[id]/styles.tsx`.
- **Common Container**: Added `padding: 0 1rem` for edge-to-edge breathing room on small screens.
- **FormPageLayout logo**: Fixed hardcoded `width: '600px'` → `maxWidth: '600px', width: '100%'` on the logo container; header stacks on mobile with `flex-wrap`.
- **Dashboard content padding**: Reduced `ContentContainer` padding from `2rem` flat to `1rem` on mobile / `2rem` on `≥768px`.
- **Mobile hamburger nav**: Added `MenuOutlined` button (visible `<768px`) + Ant Design `Drawer` with full navigation links on mobile — replaces the `disabledOverflow` horizontal Menu that was clipping on small screens.
- **StepsNavigation**: Made the project step breadcrumb bar horizontally scrollable on mobile (`overflow-x: auto`, scrollbar hidden) with a `min-width: 100px; flex-shrink: 0` per step so labels stay readable.

---

## Milestone 1 — Firebase → Supabase Migration & Production Deploy (2026-02-24)

**Goal:** Replace Firebase auth with Supabase, remove mandatory Stripe from signup, deploy to Vercel.

### Changes

- **Auth provider**: Replaced Firebase Auth entirely with Supabase (`lib/auth/supabaseClient.ts`, `lib/auth/supabaseServer.ts`). Removed `firebaseAdmin.ts` / `firebaseClient.ts` (now dead code).
- **Google OAuth + email/password**: `auth.browser.tsx` now provides `signInWithGoogle`, `signInWithPassword`, and `resetPassword` via Supabase.
- **Login form**: Rebuilt `components/login/LoginForm.tsx` with email/password fields, forgot-password flow, and Google sign-in — replaces Firebase-only Google button.
- **Auth callback**: `pages/auth/callback.tsx` exchanges Supabase code for session, then auto-links by email for seeded Firebase-era users (updates `User.id` to new Supabase UUID via raw SQL).
- **Account linking**: `lib/middleware/getUserFromContext.ts` includes email-based fallback so seeded users are re-linked to their Supabase UUID on first login.
- **Stripe-free signup**: Added `pages/api/user/register.ts` endpoint; removed Stripe checkout from the trial signup flow.
- **Prisma + Supabase production**: Added `binaryTargets` for Vercel Linux, PgBouncer-safe `getDatabaseUrl()` in `lib/prisma.ts`.
- **Seed script**: Added `seedUsers()` + converted all line-item inserts to `createMany` for bulk performance. Seeded 109 orgs, 115 accounts, 291 projects, 2718+ line items.
- **Template text overflow fix**: `ProjectTemplates.tsx` — added `wordBreak: 'break-word'` + `whiteSpace: 'pre-wrap'` to prevent long project names from breaking card layout.
- **Production**: Deployed to https://chartreuse-bay.vercel.app with Supabase (DB + auth) + Vercel.
