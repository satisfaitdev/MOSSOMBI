import { NextResponse } from 'next/server';
import { getApiBaseUrl, getAccessToken } from '@/lib/auth';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ success: false, error: 'NOT_AUTHENTICATED' }, { status: 401 });
  const { id } = await ctx.params;
  const upstream = await fetch(`${getApiBaseUrl()}/admin/agencies/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
  });
  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? { success: false }, { status: upstream.status });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ success: false, error: 'NOT_AUTHENTICATED' }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const upstream = await fetch(`${getApiBaseUrl()}/admin/agencies/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? { success: false }, { status: upstream.status });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ success: false, error: 'NOT_AUTHENTICATED' }, { status: 401 });
  const { id } = await ctx.params;
  const upstream = await fetch(`${getApiBaseUrl()}/admin/agencies/${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  });
  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? { success: false }, { status: upstream.status });
}
