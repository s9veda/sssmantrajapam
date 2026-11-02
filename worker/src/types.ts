// Request/response shapes of the API. The app can mirror these.

export interface ApiError {
  error: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  verified: boolean;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface LocationCount {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  count: number;
}

/** GET /aggregate */
export interface AggregateResponse {
  ok: true;
  total: number;
  daily: DailyCount[];
  locations: LocationCount[];
}

/** GET /fetch_names */
export interface FetchNamesResponse {
  ok: true;
  names: string[];
}

/** POST /register_name */
export interface RegisterNameRequest {
  name: string;
  device_id?: string;
}
export interface RegisterNameResponse {
  ok: true;
  name: string;
}

/** POST /submit (Authorization: Bearer <token> optional) */
export interface SubmitRequest {
  name?: string;
  date: string; // YYYY-MM-DD, not in the future
  count: number; // integer >= 0
  /** Ignored by the server; identity comes from the bearer token. */
  user_id?: string;
  device_id?: string;
}
export interface SubmitResponse {
  ok: true;
  inserted: unknown[];
}

export type OtpType = 'signup' | 'signin';

/** POST /send_otp */
export interface SendOtpRequest {
  contact: string;
  type: OtpType;
  name?: string;
}
export interface SendOtpResponse {
  ok: true;
  message: string;
}

/** POST /verify_otp */
export interface VerifyOtpRequest {
  contact: string;
  code: string;
  type: OtpType;
  name?: string;
  device_id?: string;
}
export interface AuthResponse {
  ok: true;
  user: ApiUser;
  token: string;
}
export type VerifyOtpResponse = AuthResponse;

/** GET /session (Authorization: Bearer <token>); 401 when invalid */
export interface SessionResponse {
  ok: true;
  user: ApiUser;
}

/** GET /review_login/config */
export interface ReviewLoginConfigResponse {
  ok: true;
  enabled: boolean;
}

/** POST /review_login (404 when disabled) */
export interface ReviewLoginRequest {
  email: string;
  password: string;
}
export type ReviewLoginResponse = AuthResponse;

export interface SessionClaims {
  sub: string;
  name: string;
  email: string | null;
  exp: number; // seconds since epoch
}
