'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [callingCode, setCallingCode] = useState('+242');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, callingCode }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error || 'Connexion échouée');
        return;
      }

      router.replace('/');
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Connexion échouée');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4 selection:bg-blue-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative">
        <div className="glass-card rounded-3xl p-8 border-zinc-800/50 shadow-2xl transition-all duration-500 hover:border-zinc-700/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">Mossombi <span className="text-zinc-500 font-normal">Admin</span></h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">Command Center Access</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email ou téléphone</label>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    className="appearance-none w-[110px] bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all cursor-pointer"
                    value={callingCode}
                    onChange={(e) => setCallingCode(e.target.value)}
                    aria-label="Pays"
                  >
                    <option value={'+242'}>+242</option>
                    <option value={'+243'}>+243</option>
                    <option value={'+241'}>+241</option>
                    <option value={'+237'}>+237</option>
                    <option value={'+225'}>+225</option>
                    <option value={'+221'}>+221</option>
                    <option value={'+33'}>+33</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-zinc-600">▼</div>
                </div>
                <input
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ex: 06... ou email"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mot de passe</label>
              <input
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-700 font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400 flex items-center gap-3">
                <span className="text-sm">⚠</span> {error}
              </div>
            ) : null}

            <button
              className="group relative w-full overflow-hidden rounded-xl bg-blue-600 py-4 text-sm font-bold text-white transition-all hover:bg-blue-500 shadow-[0_0_25px_rgba(37,99,235,0.25)] hover:shadow-[0_0_35px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'Authentification...' : 'Accéder au Dashboard'}
                {!loading && <span className="group-hover:translate-x-1 transition-transform">→</span>}
              </span>
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">Secured by Mossombi Internal Shield</p>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-zinc-600 text-xs">
          Mossombi Plateforme v1.0.4 • 2026 Tous droits réservés
        </p>
      </div>
    </div>
  );
}
