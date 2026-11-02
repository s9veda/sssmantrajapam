const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const geoCache = new Map<string, { data: Geo; timestamp: number }>();

export interface Geo {
  country?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function isPrivateIp(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === '::1' || v.startsWith('127.')) return true;
  if (v.startsWith('192.168.') || v.startsWith('10.') || v.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(v)) return true;
  return v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
}

export function clientIp(request: Request): string | null {
  const ip = request.headers.get('CF-Connecting-IP')?.trim();
  return ip || null;
}

export async function lookupLocation(ip: string | null): Promise<Geo> {
  if (!ip) return {};
  if (isPrivateIp(ip)) return { country: 'Local', city: 'Localhost', latitude: null, longitude: null };

  const cached = geoCache.get(ip);
  if (cached) {
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.data;
    geoCache.delete(ip);
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city,lat,lon`);
    if (!response.ok) {
      console.warn(`[Geolocation] API error for ${ip}: ${response.status}`);
      return {};
    }
    const data = (await response.json()) as Record<string, unknown>;
    if (!data || data.status !== 'success') return {};
    const geo: Geo = {
      country: (data.country as string) || null,
      city: (data.city as string) || null,
      latitude: typeof data.lat === 'number' ? data.lat : null,
      longitude: typeof data.lon === 'number' ? data.lon : null,
    };
    geoCache.set(ip, { data: geo, timestamp: Date.now() });
    return geo;
  } catch (err) {
    console.error(`[Geolocation] Failed to lookup IP ${ip}:`, err instanceof Error ? err.message : err);
    return {};
  }
}
