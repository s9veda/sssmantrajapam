# Sai Mantra Japam

One Expo app (Expo Router, SDK 58) for **iOS, Android and web**, plus a Cloudflare Worker API.

| Part | Path | Runs on |
|------|------|---------|
| App (native + web SSR) | `src/`, `app.json` | iOS/Android via EAS; web via Cloudflare Workers (`wrangler.jsonc`) |
| API | `worker/` | Cloudflare Worker `sssmantrajapam-api` (Supabase + Brevo) |

Docs: [requirements](docs/REQUIREMENTS.md), [architecture](docs/ARCHITECTURE.md), [migration plan](docs/MIGRATION_PLAN.md).

## Environments at a glance

Three pieces, one backend. **Everything points at production unless you override it.**

| Component | What it is | Where config lives | Development (local) | Preview | Production |
|-----------|-----------|--------------------|---------------------|---------|------------|
| **API** | Cloudflare Worker `sssmantrajapam-api` (`worker/`) | `worker/wrangler.jsonc` (route), `worker/.dev.vars` (local secrets), `wrangler secret put` (prod secrets) | `cd worker && npm run dev` → `http://localhost:8787` | Use a separate Worker name/route if needed (none set up) | `cd worker && npm run deploy` → `https://app.s9veda.org/api/*` |
| **Web** | Cloudflare Worker `sssmantrajapam-web` (SSR) | `wrangler.jsonc` (route `app.s9veda.org/*`), `app.json` (`web.output: server`) | `npm run web` (Metro) or `npm run preview:web` (workerd; pass `-- --port 8799` if the API is also running) | `wrangler deploy --name <preview-name>` (none set up) | `npm run deploy:web` → `https://app.s9veda.org` |
| **iOS** | Expo dev client / EAS build, bundle ID `com.s9veda.sssmantrajapam` | `app.json`, `eas.json`, `.env` | `npx expo run:ios` + `npx expo start` (simulator) | `eas build -p ios --profile preview` (internal/TestFlight) | `eas build -p ios --profile production` + `eas submit` |
| **Android** | Same app, package `com.s9veda.sssmantrajapam` | `app.json`, `eas.json`, `.env` | `npx expo run:android` + `npx expo start` | `eas build -p android --profile preview` | `eas build -p android --profile production` + `eas submit` |
| **Database** | Supabase (tables `chants`, `users`, `otp_codes`) | API secrets `SUPABASE_URL`, `SUPABASE_KEY` | Same Supabase project as prod unless you point `worker/.dev.vars` at another | — | Prod project |
| **Email (OTP)** | Brevo | API secrets `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | Leave `BREVO_API_KEY` empty → OTP is logged to the Worker console | — | Set all three |
| **Expo/EAS** | Builds and submissions | `app.json` (`owner: s9veda`, `extra.eas.projectId`), `eas.json` | `eas login` | `eas.json` → `preview` | `eas.json` → `production` |
| **Cloudflare** | Hosts both Workers | `wrangler login`; zone `s9veda.org`, proxied DNS record for `app` | — | — | Account `sr.se.369@gmail.com` |

### Which API does the app talk to?

The client (web, iOS, Android) reads **`EXPO_PUBLIC_API_BASE_URL`** at bundle time. If unset it uses `https://app.s9veda.org/api` (production).

| Where you run | Value to use | Set it in |
|---------------|--------------|-----------|
| iOS simulator + local API | `http://localhost:8787` | `.env` |
| Android emulator + local API | `http://10.0.2.2:8787` | `.env` |
| Physical device + local API | `http://<your-LAN-IP>:8787` | `.env` |
| Any dev client against production | *(leave `.env` empty or absent)* | — |
| EAS builds (development/preview/production) | `https://app.s9veda.org/api` | `eas.json` → `build.<profile>.env` |
| Web production | `https://app.s9veda.org/api` (default) | build env at `npm run deploy:web` |

After changing `.env`, restart Metro with `npx expo start -c`. `EXPO_PUBLIC_*` values are baked in at bundle time.

### What is Metro (port 8081)?

Metro is the local **bundling server** started by `npx expo start` (and by `npx expo run:ios|android`). A development build or simulator connects to it to download the JavaScript bundle and to hot-reload when you edit code. It serves code only; it never serves data. Data always comes from the API (`EXPO_PUBLIC_API_BASE_URL`).

- Default port is 8081; if it's busy Expo uses 8082, 8083, … (another project's Metro may be holding 8081).
- Dev builds always need Metro. **Release/EAS builds embed the bundle and don't use Metro at all**: `npx expo run:ios --configuration Release`, or `eas build --profile preview`.
- On a device, Metro must be reachable at the Mac's LAN IP. If the dev client says "Failed to load app from http://192.0.0.2:…", the Mac has no real LAN address (e.g. a phone hotspot). Join a normal Wi-Fi, or use `npx expo start --localhost` (simulator) or `--tunnel`.

### API secrets (Worker)

| Name | Required | Local (`worker/.dev.vars`) | Production (`wrangler secret put`) |
|------|----------|---------------------------|-----------------------------------|
| `SUPABASE_URL` | yes | Supabase project URL | same |
| `SUPABASE_KEY` | yes | service-role key | same |
| `SESSION_SECRET` | yes | any long random string | a **different** long random string (`openssl rand -base64 48`) |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | for real OTP email | empty = log OTP to console | set |
| `REVIEW_LOGIN_EMAIL` / `REVIEW_LOGIN_PASSWORD` | for App Store review access | optional | set both (put them in App Store Connect review notes) |
| `ALLOWED_ORIGINS` | no | empty (= `*`) | not needed: web and API share one origin; native apps send no `Origin` |

Changing `SESSION_SECRET` signs everyone out.

## Common commands

```bash
npm install                                            # once
(cd worker && npm install)                             # once
cp .env.example .env                                   # optional; only for a non-prod API
cp worker/.dev.vars.example worker/.dev.vars           # only for running the API locally

npm start                                              # Metro; press i / a / w
npx expo run:ios                                       # build + install the dev client (needs LANG=en_US.UTF-8 for CocoaPods)
npm run lint && npm run typecheck

(cd worker && npm run dev)                             # local API
(cd worker && npm run deploy)                          # deploy API
npm run deploy:web                                     # build + deploy web
```

Run Expo/EAS commands from the **repo root**, never from `worker/`.

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Dev client spins on "searching for development servers" | Metro (see above) isn't running or isn't reachable. Run `npx expo start`, press `i`, or "Enter URL manually" → `http://localhost:8081`. |
| "Unimplemented component" in the simulator | Installed native build is older than the JS. Rebuild: `npx expo run:ios`. |
| `UIKitCore … Presenting view controller … detached view controller` in logs | Harmless dev-launcher warning; look for the actual alert text. |
| `pod install` encoding error | `export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`. |
| No chant count | API unreachable. `curl https://app.s9veda.org/api/aggregate` should return JSON; if running locally, check `.env` and that `worker` dev server is up. |
| `Could not resolve host: app.s9veda.org` | Missing proxied DNS record for `app` in the `s9veda.org` zone. |
| Map screen | Hidden on mobile; on web open `/map?map=1`. |

## Sign-in and App Store review

The header profile icon opens a drawer: email OTP sign-in/up, language, sign out. If the Worker has
`REVIEW_LOGIN_EMAIL` and `REVIEW_LOGIN_PASSWORD` set, the drawer also shows "App Store review access"
(email + password, no OTP). Put those credentials in App Store Connect review notes.

## Locales

`/en`, `/es`, `/hi` URLs are redirected by `src/app/+middleware.ts` to the bare path plus a `lang` cookie;
the client picks the language from the cookie, then stored preference, then device locale.

## Placeholders to replace

Bundle IDs (`com.s9veda.sssmantrajapam`), EAS owner/project, API domain.
