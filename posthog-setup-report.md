<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Quippr. The project was migrated from a bare `posthog-js` init (no React provider) to a fully configured setup using `@posthog/react`, with the PostHog token and host managed via environment variables. Six new events were instrumented across four files, covering the full user journey from onboarding through premium conversion. Error tracking (`capture_exceptions: true`) and EU data residency are both configured.

## Changes made

| File | Change |
|------|--------|
| `src/main.tsx` | PostHog initialized via `posthog.init()` with env vars, `/ingest` proxy, `capture_exceptions`, and EU host |
| `vite.config.ts` | Added `/ingest`, `/ingest/static`, `/ingest/array` proxy rules pointing to `eu.i.posthog.com` |
| `src/lib/analytics/posthog.ts` | Removed `initPostHog()`, added `trackHintUsed`, `trackUserSignedIn`, `trackUserSignedOut`, `trackSubscriptionRestored`, `trackOnboardingCompleted`, `trackOnboardingSkipped` helpers |
| `src/contexts/AuthContext.tsx` | Added `user_signed_in` on `SIGNED_IN` auth event; `user_signed_out` on `SIGNED_OUT`; removed dead `"SIGNED_UP"` comparison |
| `src/components/flirtcoach/Onboarding.tsx` | Added `onboarding_completed` (last slide CTA) and `onboarding_skipped` (skip button) |
| `src/components/flirtcoach/Chat.tsx` | Added `hint_used` with `hint_type` property when user picks a hint suggestion |
| `src/components/flirtcoach/Paywall.tsx` | Added `subscription_restored` on successful purchase restore |
| `.env` | Added `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` |
| `.env.example` | Added PostHog env var documentation |

## Events instrumented

| Event name | Description | File |
|------------|-------------|------|
| `conversation_started` | Conversation started with a character and scenario | `src/components/flirtcoach/QuipprApp.tsx` (pre-existing) |
| `hint_requested` | User opened the hints sheet | `src/components/flirtcoach/Chat.tsx` (pre-existing) |
| `hint_used` | User selected and used a hint suggestion | `src/components/flirtcoach/Chat.tsx` |
| `feedback_requested` | User requested AI conversation feedback | `src/components/flirtcoach/Chat.tsx` (pre-existing) |
| `paywall_viewed` | Paywall screen shown | `src/components/flirtcoach/Paywall.tsx` (pre-existing) |
| `purchase_attempted` | User tapped Start Free Trial | `src/components/flirtcoach/Paywall.tsx` (pre-existing) |
| `subscription_restored` | User successfully restored a purchase | `src/components/flirtcoach/Paywall.tsx` |
| `user_signed_up` | New user created an account | `src/contexts/AuthContext.tsx` (pre-existing) |
| `user_signed_in` | Existing user signed in | `src/contexts/AuthContext.tsx` |
| `user_signed_out` | User signed out | `src/contexts/AuthContext.tsx` |
| `conversation_limit_reached` | Free user hit the conversation cap | `src/components/flirtcoach/Home.tsx` / `QuipprApp.tsx` (pre-existing) |
| `onboarding_completed` | User finished the onboarding carousel | `src/components/flirtcoach/Onboarding.tsx` |
| `onboarding_skipped` | User skipped onboarding | `src/components/flirtcoach/Onboarding.tsx` |

## Next steps

We've built insights and a dashboard to keep an eye on user behaviour:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/210310/dashboard/776076)
- [Daily Active Users (sign-ins)](https://eu.posthog.com/project/210310/insights/wINNfnaf)
- [Conversations Started](https://eu.posthog.com/project/210310/insights/XPyE6xYE)
- [Premium Conversion Funnel](https://eu.posthog.com/project/210310/insights/xLFn9Hg3)
- [AI Feature Engagement](https://eu.posthog.com/project/210310/insights/uRyQekvR)
- [Conversation Limit Reached (Churn Signal)](https://eu.posthog.com/project/210310/insights/wdsZ50vo)

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add the exact PostHog env var names (`VITE_PUBLIC_POSTHOG_PROJECT_TOKEN`, `VITE_PUBLIC_POSTHOG_HOST`) to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs. (Currently handled via `supabase.auth.getSession()` on mount, which calls `identifyUser` for persisted sessions.)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-react-tanstack-router-file-based/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
