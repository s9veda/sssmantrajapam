# Architecture

```
Browser / iOS / Android ──► Expo app (src/)
   web: Cloudflare Worker "sssmantrajapam-web" (SSR via expo-server workerd adapter, dist/client as assets)
                          └─► HTTPS ─► Cloudflare Worker "sssmantrajapam-api" (worker/) ─► Supabase, Brevo
```

## App (`src/`)
- `app/` Expo Router: `_layout.tsx` (providers), `(tabs)/` dashboard, breakdown, map; `+middleware.ts` locale redirect + `lang` cookie.
- `context/` `AuthContext` (token + user in AsyncStorage, OTP and review login), `AppContext` (aggregates, submit).
- `services/api.ts` typed client; base URL from `EXPO_PUBLIC_API_BASE_URL`; Bearer token.
- `i18n/` en/es/hi translations and `useTranslation()`.
- `components/ProfileDrawer.tsx`, `AppHeader.tsx` plus shared UI.

## API (`worker/`)
Endpoints: `GET /aggregate`, `GET /fetch_names`, `POST /register_name`, `POST /submit`, `POST /send_otp`,
`POST /verify_otp` (→ `{user, token}`), `GET /session`, `GET /review_login/config`, `POST /review_login`.
Tables: `chants`, `users`, `otp_codes`.

## Web on Cloudflare
`expo export -p web` → `dist/client` (static assets) + `dist/server` (SSR render, middleware, routes manifest).
`cloudflare/server.mjs` wires `createRequestHandler({build:'./server'})`; `wrangler.jsonc` uploads server files
as CommonJS (`.js`) / Text (`.json`) modules because the adapter loads them with dynamic `import()`.
Verified locally with `wrangler dev` (SSR HTML, static assets, `/es/...` → 302 + cookie).

## Known limitations
- SSR always renders English; the chosen locale applies after hydration.
- `/aggregate` reads all rows (Supabase default 1000-row cap), inherited from the original.
