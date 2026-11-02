import type { SessionClaims } from './types';

const enc = new TextEncoder();
const dec = new TextDecoder();
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function hmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}

export async function signToken(
  secret: string,
  claims: Omit<SessionClaims, 'exp'> & { exp?: number },
): Promise<string> {
  const payload: SessionClaims = {
    ...claims,
    exp: claims.exp ?? Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const head = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), enc.encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(new Uint8Array(sig))}`;
}

export async function verifyToken(secret: string | undefined, token: string): Promise<SessionClaims | null> {
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const [head, body, sig] = parts;
    const header = JSON.parse(dec.decode(b64urlDecode(head)));
    if (header.alg !== 'HS256') return null;
    // subtle.verify performs a constant-time MAC comparison
    const ok = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret, 'verify'),
      b64urlDecode(sig),
      enc.encode(`${head}.${body}`),
    );
    if (!ok) return null;
    const claims = JSON.parse(dec.decode(b64urlDecode(body))) as SessionClaims;
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') return null;
    if (claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

/** Constant-time string comparison (compares SHA-256 digests, so length does not leak). */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(da);
  const y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/** Uniform 6-digit code (rejection sampling to avoid modulo bias). */
export function generateOtp(): string {
  const limit = Math.floor(0x100000000 / 900000) * 900000;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return String(100000 + (buf[0] % 900000));
}
