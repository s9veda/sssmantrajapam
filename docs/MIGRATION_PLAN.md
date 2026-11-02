# Migration plan (sainamjapa → this repo)

Done: app screens, i18n, auth + profile drawer, API Worker port, web SSR on Workers (verified locally with `wrangler dev`).

Remaining:
1. Create the Cloudflare Workers (`worker/`, then root), set secrets, attach domains; point `EXPO_PUBLIC_API_BASE_URL` at the API.
2. Test against real Supabase and Brevo (only stubs were used); check `otp_codes` ordering/limit behavior.
3. Replace placeholders (bundle IDs, EAS project, API domain).
4. Run EAS builds; supply review credentials in App Store Connect notes.
5. Cut over DNS from the old Netlify site; leave `sainamjapa` untouched until the new app is live, then retire it.
6. Optional: real map (Leaflet on web / react-native-maps), server-side locale rendering, paginated aggregates.
