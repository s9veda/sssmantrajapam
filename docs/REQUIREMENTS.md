# Requirements

Functional scope is inherited from `sainamjapa` (Netlify + Supabase web app and mobile app), delivered as one Expo app.

1. **Dashboard** — worldwide total japam count, daily submit (date + count) via modal.
2. **Breakdown** — aggregates by period/histogram.
3. **Map/locations** — list of contributing locations (geo from IP on the API).
4. **Accounts** — email OTP sign-in/up; anonymous submissions allowed with device id + name.
5. **Profile drawer** — login/logout, language selection, App Store review access (email+password, enabled only when configured on the API).
6. **Localization** — English, Spanish, Hindi; web URLs `/en|/es|/hi/...` still work.
7. **Platforms** — iOS, Android, web (SSR) from one codebase.
8. **Hosting** — web on Cloudflare Workers; API on a separate Cloudflare Worker.

Non-functional: signed session tokens (HMAC, 30 days), CSPRNG OTPs with a 5-attempt limit, no raw backend errors returned to clients.
