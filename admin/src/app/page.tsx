import Link from 'next/link';
import { fetchMe, isAdminRole, getApiBaseUrl, getAccessToken } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import AdminCard from '@/components/AdminCard';
import { Activity, Database, Network, Megaphone, Building2, ChevronRight, Lock, ShieldAlert, AlertTriangle, Truck } from 'lucide-react';

async function fetchRealStats() {
  try {
    const token = await getAccessToken();
    if (!token) return null;
    const base = getApiBaseUrl();

    const [agenciesRes, adsRes] = await Promise.all([
      fetch(`${base}/admin/agencies`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }).catch(() => null),
      fetch(`${base}/admin/ads`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }).catch(() => null),
    ]);

    const agenciesJson = agenciesRes ? await agenciesRes.json().catch(() => null) : null;
    const adsJson = adsRes ? await adsRes.json().catch(() => null) : null;

    const agencies = agenciesJson?.success ? (agenciesJson.data || []) : [];
    const ads = adsJson?.success ? (adsJson.data || []) : [];

    return {
      totalAgencies: agencies.length,
      pendingAgencies: agencies.filter((a: any) => a.status === 'pending').length,
      activeAgencies: agencies.filter((a: any) => a.status === 'approved').length,
      totalAds: ads.length,
      activeAds: ads.filter((a: any) => a.is_active).length,
      backendOnline: agenciesRes?.ok ?? false,
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const me = await fetchMe();

  if (!me.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-transparent"></div>
        <div className="glass-card rounded-3xl p-10 max-w-sm w-full text-center relative z-10">
          <div className="w-20 h-20 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Lock className="text-zinc-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white tracking-tight">Accès Restreint</h2>
          <p className="text-sm text-zinc-400 mb-10">Veuillez vous authentifier pour accéder au centre de commande.</p>
          <Link
            className="group relative w-full flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-bold text-black transition-all hover:bg-zinc-200"
            href="/login"
          >
            Se Connecter <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  const role = me.user?.role ? String(me.user.role) : null;
  const canAccess = isAdminRole(role);

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-transparent"></div>
        <div className="glass-card rounded-3xl p-10 max-w-sm w-full text-center relative z-10 border-red-900/30">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <ShieldAlert className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white tracking-tight">Accès Refusé</h2>
          <p className="text-sm text-zinc-400 mb-10 leading-relaxed">Votre rôle actuel <span className="text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded">"{role}"</span> ne possède pas les permissions administratives requises.</p>
          <Link
            className="group relative w-full flex items-center justify-center rounded-2xl bg-zinc-800 border border-zinc-700 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-zinc-700 hover:border-zinc-600"
            href="/login"
          >
            Changer de Compte <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  const stats = await fetchRealStats();

  return (
    <DashboardLayout user={me.user}>
      <div className="max-w-[1400px] mx-auto">
        
        {/* Hero Section */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Surveillance Active
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500 mb-4 pb-1">
            Centre de Commande
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl font-light">
            Bienvenue, <span className="text-white font-medium">{me.user.full_name || me.user.email}</span>. Contrôlez l'ensemble de l'écosystème Mossombi depuis ce point central.
          </p>
        </div>

        {/* Top Status Cards - Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-blue-500/5 group-hover:text-blue-500/10 transition-colors duration-500">
              <Activity size={120} />
            </div>
            <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Statut Backend</p>
            <div className="flex items-center gap-3">
              {stats?.backendOnline ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"></div>
                  <span className="text-3xl font-semibold tracking-tight text-white">En Ligne</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
                  <span className="text-3xl font-semibold tracking-tight text-red-400">Hors Ligne</span>
                </>
              )}
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-purple-500/5 group-hover:text-purple-500/10 transition-colors duration-500">
              <Building2 size={120} />
            </div>
            <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Agences</p>
            <span className="text-3xl font-semibold tracking-tight text-white">{stats?.totalAgencies ?? '—'}</span>
            {stats && stats.pendingAgencies > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-xs text-amber-400 font-medium">{stats.pendingAgencies} en attente</span>
              </div>
            )}
          </div>
          
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors duration-500">
              <Megaphone size={120} />
            </div>
            <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Publicités</p>
            <span className="text-3xl font-semibold tracking-tight text-white">{stats?.totalAds ?? '—'}</span>
            {stats && stats.activeAds > 0 && (
              <p className="text-xs text-emerald-400 font-medium mt-2">{stats.activeAds} active(s)</p>
            )}
          </div>
        </div>

        {/* Main Modules - Bento Grid Big Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AdminCard
            title="Ads Manager"
            description="Supervisez les campagnes publicitaires, les bannières, les splash screens et analysez l'engagement."
            icon={<Megaphone size={24} />}
          >
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-black/40 border border-zinc-800/60 rounded-2xl p-5 backdrop-blur-sm">
                <span className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">Total Publicités</span>
                <span className="text-3xl font-semibold text-white">{stats?.totalAds ?? '—'}</span>
              </div>
              <div className="bg-black/40 border border-zinc-800/60 rounded-2xl p-5 backdrop-blur-sm">
                <span className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">Actives</span>
                <span className="text-3xl font-semibold text-blue-400">{stats?.activeAds ?? '—'}</span>
              </div>
            </div>
            
            <Link
              href="/ads"
              className="mt-6 group relative w-full flex items-center justify-between bg-white text-black text-sm font-bold tracking-wide px-6 py-4 rounded-2xl hover:bg-zinc-200 transition-colors"
            >
              <span>Ouvrir Ads Manager</span>
              <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight size={16} />
              </div>
            </Link>
          </AdminCard>

          <AdminCard
            title="Plateforme Hub"
            description="Administrez les agences partenaires, les agents sur le terrain et la configuration des commissions."
            icon={<Building2 size={24} />}
          >
            <div className="space-y-3 mt-2">
              <Link href="/platform/agencies" className="group/item flex items-center justify-between p-4 bg-black/40 border border-zinc-800/60 rounded-2xl backdrop-blur-sm hover:border-zinc-700/80 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-zinc-200">Réseau d'Agences</span>
                    <span className="block text-xs text-zinc-500 mt-0.5">{stats?.totalAgencies ?? 0} agences • {stats?.pendingAgencies ?? 0} en attente</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-500 group-hover/item:text-white group-hover/item:bg-zinc-800 transition-all">
                  <ChevronRight size={14} />
                </div>
              </Link>

              <Link href="/platform/commissions" className="group/item flex items-center justify-between p-4 bg-black/40 border border-zinc-800/60 rounded-2xl backdrop-blur-sm hover:border-zinc-700/80 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
                    <Database size={18} />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-zinc-200">Commissions</span>
                    <span className="block text-xs text-zinc-500 mt-0.5">Règles de partage de revenus</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-500 group-hover/item:text-white group-hover/item:bg-zinc-800 transition-all">
                  <ChevronRight size={14} />
                </div>
              </Link>

              <Link href="/platform/logistics-pricing" className="group/item flex items-center justify-between p-4 bg-black/40 border border-zinc-800/60 rounded-2xl backdrop-blur-sm hover:border-zinc-700/80 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                    <Truck size={18} />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-zinc-200">Logistique</span>
                    <span className="block text-xs text-zinc-500 mt-0.5">Tarifs de livraison et transit</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-500 group-hover/item:text-white group-hover/item:bg-zinc-800 transition-all">
                  <ChevronRight size={14} />
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Link
                href="/platform/agencies"
                className="group w-full flex items-center justify-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-widest py-4 rounded-2xl hover:bg-zinc-200 transition-colors"
              >
                Agences <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/platform/commissions"
                className="group w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 text-white text-xs font-bold uppercase tracking-widest py-4 rounded-2xl hover:bg-zinc-800 transition-colors"
              >
                Commissions <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </AdminCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
