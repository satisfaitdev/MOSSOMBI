'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  };

  return (
    <button
      onClick={logout}
      className="rounded-xl border bg-white px-4 py-2 text-sm font-medium"
      type="button"
    >
      Déconnexion
    </button>
  );
}
