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
      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
      type="button"
    >
      Déconnexion
    </button>
  );
}
