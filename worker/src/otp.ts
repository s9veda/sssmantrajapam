import type { Env } from './env';
import { issueToken } from './auth';
import { generateOtp, safeEqual } from './crypto';
import { sendOtpEmail } from './email';
import { isEmail, json, normalizeContact, readJson } from './http';
import { logUpstream, q, sb, selectRows } from './supabase';
import type { ApiUser } from './types';

const MAX_ATTEMPTS = 5;
const USER_COLS = 'id,name,email,phone,verified';

const hasSupabase = (env: Env) => Boolean(env.SUPABASE_URL && env.SUPABASE_KEY);
const missingConfig = () => json(500, { error: 'Server is not configured' });

export async function sendOtp(req: Request, env: Env): Promise<Response> {
  if (!hasSupabase(env)) return missingConfig();
  const payload = await readJson(req);
  if (!payload) return json(400, { error: 'Invalid JSON' });

  const { contact: rawContact, type } = payload;
  if (!rawContact || !type) return json(400, { error: 'Contact and type required' });
  if (typeof rawContact !== 'string') return json(400, { error: 'Invalid email address' });
  if (type !== 'signup' && type !== 'signin') return json(400, { error: 'Invalid type' });
  const contact = normalizeContact(rawContact);
  if (!isEmail(contact)) return json(400, { error: 'Invalid email address' });

  try {
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const recent = await selectRows(
      env,
      `otp_codes?contact=eq.${q(contact)}&created_at=gte.${q(since)}&select=id`,
      'send_otp rate limit',
    );
    if (recent && recent.length >= 3) {
      return json(429, { error: 'Too many OTP requests. Try again later.' });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const insertRes = await sb(env, 'otp_codes', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ contact, code, type, expires_at: expiresAt, attempts: 0 }),
    });
    if (!insertRes.ok) {
      await logUpstream('send_otp insert', insertRes);
      return json(500, { error: 'Failed to store OTP' });
    }

    const emailResult = await sendOtpEmail(env, contact, code);
    if (!emailResult.success) return json(500, { error: emailResult.error || 'Failed to send OTP' });

    return json(200, { ok: true, message: 'OTP sent' });
  } catch (err) {
    console.error('send_otp error', err);
    return json(500, { error: 'Internal server error' });
  }
}

async function deleteOtp(env: Env, id: string): Promise<void> {
  const res = await sb(env, `otp_codes?id=eq.${q(id)}`, { method: 'DELETE' });
  if (!res.ok) await logUpstream('otp delete', res);
}

async function authResponse(env: Env, user: ApiUser): Promise<Response> {
  if (!env.SESSION_SECRET) {
    console.error('SESSION_SECRET is not set');
    return json(500, { error: 'Server is not configured' });
  }
  const token = await issueToken(env, user);
  return json(200, { ok: true, user, token });
}

export async function verifyOtp(req: Request, env: Env): Promise<Response> {
  if (!hasSupabase(env)) return missingConfig();
  if (!env.SESSION_SECRET) return missingConfig();
  const payload = await readJson(req);
  if (!payload) return json(400, { error: 'Invalid JSON' });

  const { contact: rawContact, code, type, name, device_id } = payload;
  if (!rawContact || !code || !type) return json(400, { error: 'Contact, code, and type required' });
  if (typeof rawContact !== 'string' || (typeof code !== 'string' && typeof code !== 'number')) {
    return json(400, { error: 'Contact, code, and type required' });
  }
  if (type !== 'signup' && type !== 'signin') return json(400, { error: 'Invalid type' });
  const contact = normalizeContact(rawContact);
  const submitted = String(code).trim();

  try {
    const now = new Date().toISOString();
    const otps = await selectRows<{ id: string; code: string; attempts: number | null }>(
      env,
      `otp_codes?contact=eq.${q(contact)}&type=eq.${q(type)}&expires_at=gte.${q(now)}&select=id,code,attempts&order=created_at.desc&limit=1`,
      'verify_otp lookup',
    );
    if (!otps) return json(500, { error: 'Failed to verify OTP' });
    if (otps.length === 0) return json(400, { error: 'Invalid or expired OTP' });

    const otp = otps[0];
    const attempts = otp.attempts ?? 0;
    if (attempts >= MAX_ATTEMPTS) {
      await deleteOtp(env, otp.id);
      return json(429, { error: 'Too many failed attempts. Request a new code.' });
    }

    if (!(await safeEqual(submitted, otp.code))) {
      const next = attempts + 1;
      if (next >= MAX_ATTEMPTS) {
        await deleteOtp(env, otp.id);
        return json(429, { error: 'Too many failed attempts. Request a new code.' });
      }
      const patch = await sb(env, `otp_codes?id=eq.${q(otp.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ attempts: next }),
      });
      if (!patch.ok) await logUpstream('verify_otp attempts patch', patch);
      return json(400, { error: 'Invalid or expired OTP' });
    }

    await deleteOtp(env, otp.id);

    const field = isEmail(contact) ? 'email' : 'phone';

    if (type === 'signup') {
      const cleanName = typeof name === 'string' ? name.trim() : '';
      if (!cleanName) return json(400, { error: 'Name required for signup' });

      const existing = await selectRows<ApiUser>(
        env,
        `users?${field}=eq.${q(contact)}&select=${USER_COLS}`,
        'verify_otp existing user',
      );
      if (existing && existing.length > 0) {
        if (existing[0].verified) return json(409, { error: 'Account already exists. Please sign in.' });
        const update: Record<string, unknown> = { name: cleanName, verified: true };
        if (typeof device_id === 'string' && device_id) update.device_id = device_id;
        const updateRes = await sb(env, `users?id=eq.${q(existing[0].id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(update),
        });
        if (!updateRes.ok) {
          await logUpstream('verify_otp update user', updateRes);
          return json(500, { error: 'Failed to update user' });
        }
        const rows = (await updateRes.json()) as ApiUser[];
        return authResponse(env, pickUser(rows[0] ?? { ...existing[0], name: cleanName, verified: true }));
      }

      const insertData: Record<string, unknown> = { name: cleanName, verified: true, [field]: contact };
      if (typeof device_id === 'string' && device_id) insertData.device_id = device_id;
      const createRes = await sb(env, 'users', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(insertData),
      });
      if (!createRes.ok) {
        let errCode: string | undefined;
        try {
          errCode = ((await createRes.clone().json()) as { code?: string }).code;
        } catch {
          // ignore
        }
        await logUpstream('verify_otp create user', createRes);
        if (errCode === '23505') return json(409, { error: 'Account already exists' });
        return json(500, { error: 'Failed to create user' });
      }
      const created = (await createRes.json()) as ApiUser[];
      return authResponse(env, pickUser(created[0]));
    }

    const users = await selectRows<ApiUser>(
      env,
      `users?${field}=eq.${q(contact)}&verified=eq.true&select=${USER_COLS}`,
      'verify_otp find user',
    );
    if (!users) return json(500, { error: 'Failed to find user' });
    if (users.length === 0) return json(404, { error: 'No verified account found. Please sign up.' });
    return authResponse(env, pickUser(users[0]));
  } catch (err) {
    console.error('verify_otp error', err);
    return json(500, { error: 'Internal server error' });
  }
}

export function pickUser(u: Record<string, any>): ApiUser {
  return { id: u.id, name: u.name, email: u.email ?? null, phone: u.phone ?? null, verified: u.verified !== false };
}

export { authResponse };
