# Sai Mantra Japam

One Expo app (Expo Router, SDK 58) for **iOS, Android and web**, plus a Cloudflare Worker API.

| Part | Path | Runs on |
|------|------|---------|
| App (native + web SSR) | `src/`, `app.json` | iOS/Android via EAS; web via Cloudflare Workers (`wrangler.jsonc`) |
| API | `worker/` | Cloudflare Worker `sssmantrajapam-api` (Supabase + Brevo) |

Docs: [requirements](docs/REQUIREMENTS.md), [architecture](docs/ARCHITECTURE.md), [migration plan](docs/MIGRATION_PLAN.md).

## Develop

```bash
npm install
cp .env.example .env          # set EXPO_PUBLIC_API_BASE_URL
(cd worker && npm install && cp .dev.vars.example .dev.vars && npm run dev)   # API on :8787
npm start                     # press i / a / w
npm run lint && npm run typecheck
```

## Deploy

**API** — see [worker/README.md](worker/README.md). Set secrets with `wrangler secret put`
(`SUPABASE_URL`, `SUPABASE_KEY`, `SESSION_SECRET`, optional `BREVO_*`, `REVIEW_LOGIN_EMAIL`, `REVIEW_LOGIN_PASSWORD`, `ALLOWED_ORIGINS`), then deploy from `worker/`.

**Web** — `EXPO_PUBLIC_API_BASE_URL=<api url> npm run deploy:web` (runs `expo export -p web`, then `wrangler deploy`).
`npm run preview:web` runs it locally under workerd. `wrangler.jsonc` serves `dist/client` as assets and uploads
`dist/server` as CommonJS/Text modules, which the `expo-server/adapter/workerd` handler imports at runtime.

**Mobile** — `eas build` / `eas submit` (profiles in `eas.json`).

## Sign-in and App Store review

The header profile icon opens a drawer: email OTP sign-in/up, language, sign out. If the Worker has
`REVIEW_LOGIN_EMAIL` and `REVIEW_LOGIN_PASSWORD` set, the drawer also shows "App Store review access"
(email + password, no OTP). Put those credentials in App Store Connect review notes.

## Locales

`/en`, `/es`, `/hi` URLs are redirected by `src/app/+middleware.ts` to the bare path plus a `lang` cookie;
the client picks the language from the cookie, then stored preference, then device locale.

## Placeholders to replace

Bundle IDs (`com.s9veda.sssmantrajapam`), EAS owner/project, API domain.
