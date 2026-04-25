import { NextResponse } from 'next/server';
import { getApiBaseUrl, getAccessToken } from '@/lib/auth';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ success: false, error: 'NOT_AUTHENTICATED' }, { status: 401 });

  const { id } = await ctx.params;
  const upstream = await fetch(`${getApiBaseUrl()}/admin/agencies/service-requests/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? { success: false }, { status: upstream.status });
}
