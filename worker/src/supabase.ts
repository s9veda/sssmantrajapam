import type { Env } from './env';

export const q = encodeURIComponent;

export function sb(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    apikey: env.SUPABASE_KEY,
    Authorization: `Bearer ${env.SUPABASE_KEY}`,
    ...((init.headers as Record<string, string>) || {}),
  };
  if (init.body) headers['Content-Type'] = 'application/json';
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
}

/** Logs the upstream error body server-side only. */
export async function logUpstream(label: string, res: Response): Promise<void> {
  let body = '';
  try {
    body = await res.text();
  } catch {
    // ignore
  }
  console.error(`[supabase] ${label} failed: HTTP ${res.status} ${body}`);
}

export async function selectRows<T = Record<string, any>>(
  env: Env,
  path: string,
  label: string,
): Promise<T[] | null> {
  const res = await sb(env, path);
  if (!res.ok) {
    await logUpstream(label, res);
    return null;
  }
  return (await res.json()) as T[];
}
