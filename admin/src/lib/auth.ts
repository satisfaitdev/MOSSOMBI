import { cookies } from 'next/headers';

export type UserRole = 'user' | 'agent' | 'admin' | 'super_admin';

export type AuthUser = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: UserRole | string | null;
  is_super_admin?: boolean | null;
};

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'admin_access_token';

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
}

export async function getAccessToken() {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE_NAME)?.value || null;
}

export function isAdminRole(role?: string | null) {
  return role === 'admin' || role === 'super_admin';
}

export async function fetchMe() {
  const token = await getAccessToken();
  if (!token) return { ok: false as const, error: 'NOT_AUTHENTICATED' };

  const res = await fetch(`${getApiBaseUrl()}/users/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    return { ok: false as const, error: json?.error || json?.message || 'UNAUTHORIZED' };
  }

  return { ok: true as const, user: json.data as AuthUser };
}
