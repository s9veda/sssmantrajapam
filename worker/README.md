# sssmantrajapam-api (Cloudflare Worker)

Standalone port of the Sainam Japam Netlify functions. Plain TypeScript, no framework.
Backed by Supabase (PostgREST) and Brevo (email). Schema: `sainamjapa/db/schema.sql`.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/aggregate` | `{ok,total,daily[],locations[]}` |
| GET | `/fetch_names` | `{ok,names[]}` |
| POST | `/register_name` | `{name,device_id}` -> `{ok,name}` |
| POST | `/submit` | `{name,date,count}`; optional `Authorization: Bearer <token>` (identity comes from the token, `user_id` in the body is ignored) |
| POST | `/send_otp` | `{contact,type:'signup'\|'signin',name?}` |
| POST | `/verify_otp` | `{contact,code,type,name?,device_id?}` -> `{ok,user,token}` (max 5 failed attempts per code) |
| GET | `/session` | Bearer token -> `{ok,user}` or 401 |
| GET | `/review_login/config` | `{ok,enabled}` |
| POST | `/review_login` | `{email,password}` -> `{ok,user,token}`; 404 when disabled |

Request/response types: `src/types.ts`.

## Environment

| Name | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_KEY` | yes | Supabase project URL and service key |
| `SESSION_SECRET` | yes | HMAC key for session tokens (30-day, HS256) |
| `BREVO_API_KEY` | no | If unset, OTP emails are logged to the console (dev mode) |
| `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | no | Email sender |
| `REVIEW_LOGIN_EMAIL`, `REVIEW_LOGIN_PASSWORD` | no | App-store reviewer login; enabled only when both are set |
| `ALLOWED_ORIGINS` | no | Comma-separated CORS origins; default `*` |

## Setup

```sh
cd worker
npm install
npx wrangler login
for v in SUPABASE_URL SUPABASE_KEY SESSION_SECRET BREVO_API_KEY BREVO_SENDER_EMAIL BREVO_SENDER_NAME; do
  npx wrangler secret put $v
done
# optional
npx wrangler secret put REVIEW_LOGIN_EMAIL
npx wrangler secret put REVIEW_LOGIN_PASSWORD
npx wrangler secret put ALLOWED_ORIGINS
```

Generate a session secret with `openssl rand -base64 48`.

## Deploy

```sh
npm run deploy
```

The Worker is served at `https://sssmantrajapam-api.<account>.workers.dev`. For a route or
custom domain, add to `wrangler.jsonc` (zone must be on Cloudflare):

```jsonc
"routes": [{ "pattern": "api.example.com", "custom_domain": true }]
```

## Local development

```sh
cp .dev.vars.example .dev.vars   # fill in values; .dev.vars is git-ignored
npm run dev                      # http://localhost:8787
npm run typecheck
npm run smoke                    # offline smoke test with stubbed Supabase/Brevo
```

## Notes

- Auth is bearer-token based (no cookies), so wildcard CORS is acceptable.
- Geolocation uses `CF-Connecting-IP` + ip-api.com with a per-isolate in-memory cache.
- Upstream Supabase error bodies are logged, never returned to clients.
