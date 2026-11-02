import type { Env } from './env';

export function corsHeaders(request: Request, env: Env): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  const allowed = (env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else {
    headers['Vary'] = 'Origin';
    const origin = request.headers.get('Origin');
    if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    const parsed = text ? JSON.parse(text) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export const normalizeContact = (c: string): string => c.trim().toLowerCase();
export const isEmail = (c: string): boolean => c.includes('@');
