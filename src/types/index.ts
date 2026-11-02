export interface DailyCount {
  date: string;
  count: number;
}

export interface LocationData {
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  count: number;
}

export interface AggregateData {
  total: number;
  daily: DailyCount[];
  locations: LocationData[];
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  verified: boolean;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface SubmitPayload {
  name: string | null;
  date: string;
  count: number;
  device_id?: string;
}

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };
