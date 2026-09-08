import { NextResponse } from 'next/server';
import { getApiBaseUrl, getAccessToken } from '@/lib/auth';

export async function GET() {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ success: false, error: 'NOT_AUTHENTICATED' }, { status: 401 });

  const upstream = await fetch(`${getApiBaseUrl()}/live-locations?service_id=courier`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? { success: false }, { status: upstream.status });
}
