import { NextResponse } from 'next/server';
import { fetchMe, isAdminRole } from '@/lib/auth';

export async function GET() {
  const me = await fetchMe();
  if (!me.ok) {
    return NextResponse.json({ success: false, error: me.error }, { status: 401 });
  }

  const role = me.user?.role ? String(me.user.role) : null;
  const ok = isAdminRole(role);

  if (!ok) {
    return NextResponse.json({ success: false, error: 'ADMIN_REQUIRED' }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: me.user });
}
