import Link from 'next/link';
import { fetchMe, isAdminRole } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import AdminCard from '@/components/AdminCard';

export default async function Home() {
  const me = await fetchMe();

  if (!me.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-zinc-100">Accès Restreint</h2>
          <p className="text-sm text-zinc-500 mb-8">Veuillez vous authentifier pour accéder au centre de commande.</p>
          <Link
            className="w-full flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            href="/login"
          >
            Se Connecter
          </Link>
        </div>
      </div>
    );
  }

  const role = me.user?.role ? String(me.user.role) : null;
  const canAccess = isAdminRole(role);

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl text-red-500">⚠</span>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-zinc-100">Accès Refusé</h2>
          <p className="text-sm text-zinc-500 mb-8">Votre rôle actuel "{role}" ne possède pas les permissions administratives requises.</p>
          <Link
            className="w-full flex items-center justify-center rounded-2xl bg-zinc-800 px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-zinc-700"
            href="/login"
          >
            Changer de Compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout user={me.user}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Centre de Commande</h1>
          <p className="text-zinc-500 text-lg">Bienvenue, <span className="text-blue-400 font-medium">{me.user.full_name || me.user.email}</span>. Surveillance du système active.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card p-6 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Status Système</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-2xl font-semibold">En Ligne</span>
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Réseau</p>
            <span className="text-2xl font-semibold">Stable</span>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Base de Données</p>
            <span className="text-2xl font-semibold">Synchronisée</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AdminCard
            title="Gestion Publicitaire"
            description="Configuration des bannières, splash screens et fenêtres contextuelles."
          >
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/30">
                <span className="text-sm text-zinc-400">Bannières Actives</span>
                <span className="text-sm font-mono text-blue-400">08</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/30">
                <span className="text-sm text-zinc-400">Taux de Clic</span>
                <span className="text-sm font-mono text-zinc-200">2.4%</span>
              </div>
            </div>
            <Link
              href="/ads"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Accéder au Module <span>→</span>
            </Link>
          </AdminCard>

          <AdminCard
            title="Plateforme"
            description="Gestion des agents certifiés et supervision des agences partenaires."
          >
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/30">
                <span className="text-sm text-zinc-400">Agences</span>
                <span className="text-sm font-mono text-blue-400">↗</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/30">
                <span className="text-sm text-zinc-400">Commissions</span>
                <span className="text-sm font-mono text-blue-400">↗</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <Link
                href="/platform/agencies"
                className="w-full flex items-center justify-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Agences <span>→</span>
              </Link>
              <Link
                href="/platform/commissions"
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Commissions <span>→</span>
              </Link>
            </div>
          </AdminCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
