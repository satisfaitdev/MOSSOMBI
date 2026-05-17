import { NextResponse } from 'next/server';
import { getApiBaseUrl, getAccessToken } from '@/lib/auth';

export async function GET() {
  // Optionnel: Vérifier le token ici aussi
  const upstream = await fetch(`${getApiBaseUrl()}/monitoring/logistics-settings`, {
    cache: 'no-store',
  });

  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? { success: false }, { status: upstream.status });
}

export async function POST(req: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ success: false, error: 'NOT_AUTHENTICATED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const upstream = await fetch(`${getApiBaseUrl()}/monitoring/logistics-settings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  });

  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? { success: false }, { status: upstream.status });
}
