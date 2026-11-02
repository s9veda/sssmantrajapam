import type { Env } from './env';
import { clientIp, lookupLocation } from './geo';
import { getClaims } from './auth';
import { json, readJson } from './http';
import { logUpstream, q, sb, selectRows } from './supabase';
import type { ApiUser } from './types';

const hasSupabase = (env: Env) => Boolean(env.SUPABASE_URL && env.SUPABASE_KEY);
const missingConfig = () => json(500, { error: 'Server is not configured' });
const serverError = (msg = 'Internal server error') => json(500, { error: msg });

async function fetchChants(env: Env): Promise<Record<string, any>[] | null> {
  const main = await sb(env, 'chants?select=id,name,date,country,city,latitude,longitude,ip,count,created_at');
  if (main.ok) return (await main.json()) as Record<string, any>[];
  await logUpstream('aggregate main query', main);
  const fallback = await sb(env, 'chants?select=id,name,date,ip,count,created_at');
  if (fallback.ok) return (await fallback.json()) as Record<string, any>[];
  await logUpstream('aggregate fallback query', fallback);
  return null;
}

export async function aggregate(_req: Request, env: Env): Promise<Response> {
  if (!hasSupabase(env)) return missingConfig();
  try {
    const rows = await fetchChants(env);
    if (!rows) return serverError('Failed to aggregate');

    let total = 0;
    const dailyMap: Record<string, number> = {};
    const locMap: Record<string, { country: string; city: string; latitude: number; longitude: number; count: number }> = {};
    for (const r of rows) {
      const c = Number(r.count) || 0;
      total += c;
      dailyMap[r.date] = (dailyMap[r.date] || 0) + c;
      const lat = Number(r.latitude);
      const lon = Number(r.longitude);
      if (r.latitude == null || r.longitude == null || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const key = `${r.country || 'Unknown'}::${r.city || 'Unknown'}::${lat}::${lon}`;
      locMap[key] ??= { country: r.country || 'Unknown', city: r.city || 'Unknown', latitude: lat, longitude: lon, count: 0 };
      locMap[key].count += c;
    }
    const daily = Object.keys(dailyMap)
      .map((date) => ({ date, count: dailyMap[date] }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const locations = Object.values(locMap).sort((a, b) => b.count - a.count);
    return json(200, { ok: true, total, daily, locations });
  } catch (err) {
    console.error('aggregate error', err);
    return serverError();
  }
}

export async function fetchNames(_req: Request, env: Env): Promise<Response> {
  if (!hasSupabase(env)) return missingConfig();
  try {
    const users = await selectRows<{ name: string }>(env, 'users?select=name&order=name.asc', 'fetch_names');
    if (!users) return json(502, { error: 'Failed to fetch names' });
    return json(200, { ok: true, names: users.map((u) => u.name) });
  } catch (err) {
    console.error('fetch_names error', err);
    return serverError();
  }
}

export async function registerName(req: Request, env: Env): Promise<Response> {
  if (!hasSupabase(env)) return missingConfig();
  const payload = await readJson(req);
  if (!payload) return json(400, { error: 'Invalid JSON' });

  const { name, device_id } = payload;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return json(400, { error: 'Name is required' });
  }
  const trimmedName = name.trim();

  try {
    const existing = await selectRows(env, `users?name=eq.${q(trimmedName)}&select=id,name`, 'register_name check');
    if (existing && existing.length > 0) return json(200, { ok: true, name: trimmedName });

    const res = await sb(env, 'users', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        name: trimmedName,
        device_id: typeof device_id === 'string' ? device_id : null,
        verified: false,
      }),
    });
    if (!res.ok) {
      let code: string | undefined;
      try {
        code = ((await res.clone().json()) as { code?: string }).code;
      } catch {
        // ignore
      }
      await logUpstream('register_name insert', res);
      if (res.status === 409 || code === '23505') return json(409, { error: 'Name already registered' });
      return serverError('Failed to register name');
    }
    return json(200, { ok: true, name: trimmedName });
  } catch (err) {
    console.error('register_name error', err);
    return serverError();
  }
}

export async function submit(req: Request, env: Env): Promise<Response> {
  if (!hasSupabase(env)) return missingConfig();
  const payload = await readJson(req);
  if (!payload) return json(400, { error: 'Invalid JSON' });

  const { name, date, count } = payload;
  if (!date || count === undefined || count === null) {
    return json(400, { error: 'Missing required fields: date and count' });
  }
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json(400, { error: 'Invalid date' });
  }
  if (date > new Date().toISOString().slice(0, 10)) {
    return json(400, { error: 'Date cannot be in the future' });
  }
  const parsedCount = typeof count === 'number' ? count : /^\d+$/.test(String(count).trim()) ? Number(count) : NaN;
  if (!Number.isInteger(parsedCount) || parsedCount < 0) {
    return json(400, { error: 'Invalid count value' });
  }

  const ip = clientIp(req);
  const geolocation = await lookupLocation(ip);

  // Identity comes only from a valid bearer token; any client-supplied user_id is ignored.
  const claims = await getClaims(req, env);
  let userId: string | null = null;
  let resolvedName: string | null = typeof name === 'string' && name.trim() ? name.trim() : null;

  if (claims) {
    userId = claims.sub;
    resolvedName = claims.name || resolvedName;
  } else if (resolvedName) {
    // Anonymous: only link to unverified (anonymous) rows, never to a verified user's id
    const users = await selectRows<{ id: string }>(
      env,
      `users?name=eq.${q(resolvedName)}&verified=eq.false&select=id`,
      'submit name lookup',
    );
    if (users && users.length > 0) userId = users[0].id;
  }

  try {
    const res = await sb(env, 'chants', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        user_id: userId,
        name: resolvedName,
        date,
        count: parsedCount,
        ip,
        ...geolocation,
      }),
    });
    if (!res.ok) {
      await logUpstream('submit insert', res);
      return serverError('Failed to save submission');
    }
    return json(200, { ok: true, inserted: await res.json() });
  } catch (err) {
    console.error('submit error', err);
    return serverError();
  }
}

export async function session(req: Request, env: Env): Promise<Response> {
  const claims = await getClaims(req, env);
  if (!claims) return json(401, { error: 'Unauthorized' });
  if (!hasSupabase(env)) return missingConfig();
  const rows = await selectRows<ApiUser>(
    env,
    `users?id=eq.${q(claims.sub)}&verified=eq.true&select=id,name,email,phone,verified`,
    'session lookup',
  );
  if (!rows) return serverError();
  if (rows.length === 0) return json(401, { error: 'Unauthorized' });
  return json(200, { ok: true, user: rows[0] });
}
