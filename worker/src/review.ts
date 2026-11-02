import type { Env } from './env';
import { safeEqual } from './crypto';
import { isEmail, json, normalizeContact, readJson } from './http';
import { authResponse, pickUser } from './otp';
import { logUpstream, q, sb, selectRows } from './supabase';
import type { ApiUser } from './types';

const REVIEW_NAME = 'App Review';

export const reviewEnabled = (env: Env): boolean =>
  Boolean(env.REVIEW_LOGIN_EMAIL && env.REVIEW_LOGIN_PASSWORD);

export function reviewConfig(_req: Request, env: Env): Response {
  return json(200, { ok: true, enabled: reviewEnabled(env) });
}

export async function reviewLogin(req: Request, env: Env): Promise<Response> {
  if (!reviewEnabled(env)) return json(404, { error: 'Not found' });
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY || !env.SESSION_SECRET) {
    return json(500, { error: 'Server is not configured' });
  }
  const payload = await readJson(req);
  if (!payload) return json(400, { error: 'Invalid JSON' });
  const { email, password } = payload;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return json(400, { error: 'Email and password required' });
  }

  const reviewEmail = normalizeContact(env.REVIEW_LOGIN_EMAIL as string);
  const [emailOk, passOk] = await Promise.all([
    safeEqual(normalizeContact(email), reviewEmail),
    safeEqual(password, env.REVIEW_LOGIN_PASSWORD as string),
  ]);
  if (!emailOk || !passOk || !isEmail(reviewEmail)) return json(401, { error: 'Invalid credentials' });

  try {
    const existing = await selectRows<ApiUser>(
      env,
      `users?email=eq.${q(reviewEmail)}&select=id,name,email,phone,verified`,
      'review_login lookup',
    );
    if (!existing) return json(500, { error: 'Login failed' });

    let row: ApiUser | undefined;
    if (existing.length > 0) {
      if (existing[0].verified) {
        row = existing[0];
      } else {
        const res = await sb(env, `users?id=eq.${q(existing[0].id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ verified: true, name: REVIEW_NAME }),
        });
        if (!res.ok) {
          await logUpstream('review_login update', res);
          return json(500, { error: 'Login failed' });
        }
        row = ((await res.json()) as ApiUser[])[0];
      }
    } else {
      const res = await sb(env, 'users', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ name: REVIEW_NAME, email: reviewEmail, verified: true }),
      });
      if (!res.ok) {
        await logUpstream('review_login insert', res);
        return json(500, { error: 'Login failed' });
      }
      row = ((await res.json()) as ApiUser[])[0];
    }
    if (!row) return json(500, { error: 'Login failed' });
    return authResponse(env, pickUser(row));
  } catch (err) {
    console.error('review_login error', err);
    return json(500, { error: 'Internal server error' });
  }
}
