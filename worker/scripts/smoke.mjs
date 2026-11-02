// Smoke test: bundles the worker with `wrangler deploy --dry-run`, imports the handler
// and drives it with a fake env and a stubbed global fetch emulating Supabase/Brevo/ip-api.
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outdir = path.join(root, '.wrangler', 'smoke-build');
execFileSync('npx', ['wrangler', 'deploy', '--dry-run', '--outdir', outdir], { cwd: root, stdio: 'pipe' });
const worker = (await import(pathToFileURL(path.join(outdir, 'index.js')).href + `?t=${Date.now()}`)).default;

// ---- in-memory Supabase stub ----
const db = { users: [], otp_codes: [], chants: [] };
let seq = 0;
const sent = [];
const realLog = console.log;
console.log = () => {};
console.error = () => {};
console.warn = () => {};

function filterRows(table, params) {
  let rows = [...db[table]];
  for (const [k, v] of params) {
    if (['select', 'order', 'limit'].includes(k)) continue;
    const m = /^(eq|gte)\.(.*)$/.exec(v);
    if (!m) continue;
    const [, op, val] = m;
    rows = rows.filter((r) => {
      if (op === 'eq') return String(r[k]) === val;
      return String(r[k]) >= val;
    });
  }
  const order = params.get('order');
  if (order) {
    const [col, dir] = order.split('.');
    rows.sort((a, b) => (a[col] < b[col] ? 1 : -1) * (dir === 'desc' ? 1 : -1));
  }
  if (params.get('limit')) rows = rows.slice(0, Number(params.get('limit')));
  return rows;
}

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const method = (init.method || 'GET').toUpperCase();
  const jr = (s, b) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json' } });
  if (url.hostname === 'ip-api.com') return jr(200, { status: 'success', country: 'India', city: 'Pune', lat: 18.5, lon: 73.8 });
  if (url.hostname === 'api.brevo.com') {
    sent.push(JSON.parse(init.body));
    return jr(201, { messageId: 'x' });
  }
  const m = /\/rest\/v1\/(\w+)/.exec(url.pathname);
  assert.ok(m, `unexpected fetch ${url}`);
  const table = m[1];
  if (method === 'GET') return jr(200, filterRows(table, url.searchParams).map((r) => ({ ...r })));
  if (method === 'POST') {
    const row = { id: `id-${++seq}`, created_at: new Date().toISOString(), attempts: 0, ...JSON.parse(init.body) };
    db[table].push(row);
    return jr(201, [row]);
  }
  const rows = filterRows(table, url.searchParams);
  if (method === 'PATCH') {
    const patch = JSON.parse(init.body);
    for (const r of rows) {
      assert.ok(typeof patch.attempts !== 'object', 'attempts must be a number');
      Object.assign(r, patch);
    }
    return jr(200, rows);
  }
  if (method === 'DELETE') {
    db[table] = db[table].filter((r) => !rows.includes(r));
    return new Response(null, { status: 204 });
  }
  throw new Error('unhandled');
};

const env = {
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_KEY: 'k',
  SESSION_SECRET: 'test-secret',
  BREVO_API_KEY: 'b',
};
const call = async (e, method, p, body, headers = {}) => {
  const res = await worker.fetch(
    new Request(`https://api.test${p}`, {
      method,
      headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '8.8.8.8', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    }),
    e,
    {},
  );
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
};
let passed = 0;
const ok = (name, fn) => fn().then(() => { passed++; realLog(`ok - ${name}`); });

await ok('CORS preflight + headers on responses', async () => {
  const r = await call(env, 'OPTIONS', '/submit');
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
  assert.match(r.headers.get('access-control-allow-headers'), /Authorization/);
  const g = await call(env, 'GET', '/review_login/config');
  assert.equal(g.headers.get('access-control-allow-origin'), '*');
  const restricted = await call({ ...env, ALLOWED_ORIGINS: 'https://a.com' }, 'GET', '/aggregate', null, { Origin: 'https://a.com' });
  assert.equal(restricted.headers.get('access-control-allow-origin'), 'https://a.com');
});

await ok('OTP generation is 6 digits', async () => {
  for (let i = 0; i < 20; i++) {
    db.otp_codes = [];
    await call(env, 'POST', '/send_otp', { contact: ' Foo@Bar.com ', type: 'signin' });
    assert.match(db.otp_codes[0].code, /^[1-9]\d{5}$/);
    assert.equal(db.otp_codes[0].contact, 'foo@bar.com');
  }
  assert.ok(sent.length > 0 && sent[0].textContent.includes('Verification Code'));
});

await ok('send_otp rate limit (3 per 15 min)', async () => {
  db.otp_codes = [];
  for (let i = 0; i < 3; i++) assert.equal((await call(env, 'POST', '/send_otp', { contact: 'r@x.com', type: 'signup' })).status, 200);
  assert.equal((await call(env, 'POST', '/send_otp', { contact: 'R@x.com', type: 'signup' })).status, 429);
});

let token, userId;
await ok('verify_otp: attempt limit, success, token, single use', async () => {
  db.otp_codes = [];
  db.users = [];
  await call(env, 'POST', '/send_otp', { contact: 'a@x.com', type: 'signup' });
  const good = db.otp_codes[0].code;
  const bad = good === '123456' ? '654321' : '123456';
  for (let i = 0; i < 4; i++) {
    const r = await call(env, 'POST', '/verify_otp', { contact: 'a@x.com', code: bad, type: 'signup', name: 'Al' });
    assert.equal(r.status, 400);
  }
  assert.equal(db.otp_codes[0].attempts, 4);
  const code = good;
  const r = await call(env, 'POST', '/verify_otp', { contact: ' A@X.com', code, type: 'signup', name: 'Al' });
  assert.equal(r.status, 200);
  assert.equal(r.body.user.email, 'a@x.com');
  assert.ok(r.body.token.split('.').length === 3);
  token = r.body.token;
  userId = r.body.user.id;
  assert.equal(db.otp_codes.length, 0);
  const again = await call(env, 'POST', '/verify_otp', { contact: 'a@x.com', code, type: 'signup', name: 'Al' });
  assert.equal(again.status, 400);
});

await ok('attempt limit returns 429 on 5th failure', async () => {
  db.otp_codes = [];
  await call(env, 'POST', '/send_otp', { contact: 'z@x.com', type: 'signin' });
  const good = db.otp_codes[0].code;
  const bad = good === '123456' ? '654321' : '123456';
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await call(env, 'POST', '/verify_otp', { contact: 'z@x.com', code: bad, type: 'signin' })).status);
  assert.deepEqual(statuses, [400, 400, 400, 400, 429]);
  assert.equal((await call(env, 'POST', '/verify_otp', { contact: 'z@x.com', code: good, type: 'signin' })).status, 400);
});

await ok('token sign/verify via /session', async () => {
  const s = await call(env, 'GET', '/session', null, { Authorization: `Bearer ${token}` });
  assert.equal(s.status, 200);
  assert.equal(s.body.user.id, userId);
  const [h, p, sig] = token.split('.');
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
  assert.equal(claims.sub, userId);
  assert.ok(Math.abs(claims.exp - (Date.now() / 1000 + 30 * 86400)) < 60);
  const forged = `${h}.${Buffer.from(JSON.stringify({ ...claims, sub: 'evil' })).toString('base64url')}.${sig}`;
  assert.equal((await call(env, 'GET', '/session', null, { Authorization: `Bearer ${forged}` })).status, 401);
  assert.equal((await call({ ...env, SESSION_SECRET: 'other' }, 'GET', '/session', null, { Authorization: `Bearer ${token}` })).status, 401);
  assert.equal((await call(env, 'GET', '/session')).status, 401);
});

await ok('submit with/without token', async () => {
  db.chants = [];
  db.users.push({ id: 'anon-1', name: 'Ravi', verified: false });
  db.users.push({ id: 'ver-1', name: 'Sita', verified: true, email: 's@x.com' });
  const withTok = await call(env, 'POST', '/submit', { name: 'Whoever', date: '2020-01-01', count: 5, user_id: 'evil' }, { Authorization: `Bearer ${token}` });
  assert.equal(withTok.status, 200);
  assert.equal(db.chants[0].user_id, userId);
  assert.equal(db.chants[0].name, 'Al');
  assert.equal(db.chants[0].city, 'Pune');
  const anon = await call(env, 'POST', '/submit', { name: 'Ravi', date: '2020-01-01', count: '7', user_id: 'evil' });
  assert.equal(anon.status, 200);
  assert.equal(db.chants[1].user_id, 'anon-1');
  const verifiedName = await call(env, 'POST', '/submit', { name: 'Sita', date: '2020-01-01', count: 1 });
  assert.equal(verifiedName.status, 200);
  assert.equal(db.chants[2].user_id, null);
  const free = await call(env, 'POST', '/submit', { name: 'Nobody', date: '2020-01-01', count: 1, user_id: 'evil' });
  assert.equal(db.chants[3].user_id, null);
  assert.equal((await call(env, 'POST', '/submit', { name: 'x', date: '2999-01-01', count: 1 })).status, 400);
  assert.equal((await call(env, 'POST', '/submit', { name: 'x', date: '2020-01-01', count: -1 })).status, 400);
  assert.equal((await call(env, 'POST', '/submit', { name: 'x', date: '2020-01-01', count: 1.5 })).status, 400);
  const agg = await call(env, 'GET', '/aggregate');
  assert.equal(agg.body.total, 14);
  assert.equal(agg.body.locations[0].city, 'Pune');
});

await ok('review login enabled/disabled', async () => {
  assert.deepEqual((await call(env, 'GET', '/review_login/config')).body, { ok: true, enabled: false });
  assert.equal((await call(env, 'POST', '/review_login', { email: 'r@x.com', password: 'p' })).status, 404);
  assert.equal((await call({ ...env, REVIEW_LOGIN_EMAIL: 'r@x.com' }, 'GET', '/review_login/config')).body.enabled, false);

  const e2 = { ...env, REVIEW_LOGIN_EMAIL: 'Review@x.com', REVIEW_LOGIN_PASSWORD: 'pw123' };
  assert.equal((await call(e2, 'GET', '/review_login/config')).body.enabled, true);
  assert.equal((await call(e2, 'POST', '/review_login', { email: 'review@x.com', password: 'bad' })).status, 401);
  assert.equal((await call(e2, 'POST', '/review_login', { email: 'other@x.com', password: 'pw123' })).status, 401);
  const r = await call(e2, 'POST', '/review_login', { email: ' REVIEW@x.com', password: 'pw123' });
  assert.equal(r.status, 200);
  assert.equal(r.body.user.name, 'App Review');
  assert.equal(r.body.user.verified, true);
  const s = await call(e2, 'GET', '/session', null, { Authorization: `Bearer ${r.body.token}` });
  assert.equal(s.status, 200);
  const r2 = await call(e2, 'POST', '/review_login', { email: 'review@x.com', password: 'pw123' });
  assert.equal(r2.body.user.id, r.body.user.id);
  assert.equal(db.users.filter((u) => u.email === 'review@x.com').length, 1);
});

console.log = realLog;
console.log(`\n${passed} smoke groups passed`);
