import type { Env } from './env';
import { verifyToken, signToken } from './crypto';
import type { ApiUser, SessionClaims } from './types';

export async function getClaims(request: Request, env: Env): Promise<SessionClaims | null> {
  const h = request.headers.get('Authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (!m) return null;
  return verifyToken(env.SESSION_SECRET, m[1].trim());
}

export function issueToken(env: Env, user: ApiUser): Promise<string> {
  return signToken(env.SESSION_SECRET, { sub: user.id, name: user.name, email: user.email ?? null });
}
