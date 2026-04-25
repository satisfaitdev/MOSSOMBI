import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'admin_access_token';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
const DEFAULT_CALLING_CODE = process.env.DEFAULT_CALLING_CODE || '+242';

function normalizeIdentifier(raw: string, callingCode?: string) {
  const identifier = String(raw || '').trim();
  if (!identifier) return identifier;
  if (identifier.includes('@')) return identifier;

  // Téléphone: si l'utilisateur tape un numéro local (ex: 066...), on le convertit en E.164
  if (identifier.startsWith('+')) return identifier;
  const digits = identifier.replace(/\D/g, '');
  if (!digits) return identifier;
  const code = String(callingCode || '').trim() || DEFAULT_CALLING_CODE;
  return `${code}${digits}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const identifier = normalizeIdentifier(body?.identifier, body?.callingCode);
    const password = String(body?.password || '').trim();

    if (!identifier || !password) {
      return NextResponse.json({ success: false, error: 'identifier et password requis' }, { status: 400 });
    }

    const upstream = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const json = await upstream.json().catch(() => null);

    if (!upstream.ok || !json?.success) {
      const message = json?.error || json?.message || 'Connexion échouée';
      return NextResponse.json({ success: false, error: message }, { status: upstream.status || 401 });
    }

    const accessToken = json?.data?.access_token;
    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Token manquant' }, { status: 500 });
    }

    const res = NextResponse.json({ success: true });

    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: accessToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 jour
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
