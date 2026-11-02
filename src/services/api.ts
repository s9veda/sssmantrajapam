import type { AggregateData, ApiResponse, AuthResult, SubmitPayload, User } from '@/types';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.saimantrajapam.org'
).replace(/\/+$/, '');

async function request<T>(path: string, options: RequestInit & { token?: string | null } = {}): Promise<ApiResponse<T>> {
  const { token, headers, ...init } = options;
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, status: response.status, error: typeof data?.error === 'string' ? data.error : `HTTP ${response.status}` };
    }
    return { ok: true, data: data as T };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

export const api = {
  fetchAggregates: () => request<AggregateData>('/aggregate'),

  fetchNames: () => request<{ names: string[] }>('/fetch_names'),

  registerName: (name: string, deviceId: string) =>
    request<{ name: string }>('/register_name', post({ name, device_id: deviceId })),

  submitJapam: (payload: SubmitPayload, token?: string | null) =>
    request<unknown>('/submit', { ...post(payload), token }),

  sendOTP: (contact: string, type: 'signup' | 'signin', name?: string) =>
    request<{ message: string }>('/send_otp', post({ contact, type, name })),

  verifyOTP: (contact: string, code: string, type: 'signup' | 'signin', name?: string, deviceId?: string) =>
    request<AuthResult>('/verify_otp', post({ contact, code, type, name, device_id: deviceId })),

  getSession: (token: string) => request<{ user: User }>('/session', { token }),

  reviewLoginEnabled: () => request<{ enabled: boolean }>('/review_login/config'),

  reviewLogin: (email: string, password: string) =>
    request<AuthResult>('/review_login', post({ email, password })),
};
