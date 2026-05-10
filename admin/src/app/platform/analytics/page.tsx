'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Building2, Truck, ShoppingBag, Loader2, AlertCircle } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalAgencies: number;
  pendingAgencies: number;
  activeAgencies: number;
  totalAds: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        // Fetch agencies data for stats
        const agenciesRes = await fetch('/api/platform/agencies', { cache: 'no-store' });
        const agenciesJson = await agenciesRes.json().catch(() => null);

        const agencies = agenciesJson?.success ? (agenciesJson.data || []) : [];

        setStats({
          totalUsers: 0,
          totalAgencies: agencies.length,
          pendingAgencies: agencies.filter((a: any) => a.status === 'pending').length,
          activeAgencies: agencies.filter((a: any) => a.status === 'approved').length,
          totalAds: 0,
        });
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-zinc-500 text-sm">Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Agences',
      value: stats?.totalAgencies ?? 0,
      icon: Building2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      iconBg: 'bg-blue-500/10',
    },
    {
      label: 'Agences Actives',
      value: stats?.activeAgencies ?? 0,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      iconBg: 'bg-emerald-500/10',
    },
    {
      label: 'En Attente',
      value: stats?.pendingAgencies ?? 0,
      icon: Users,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      iconBg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="text-blue-500" size={28} />
          <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
        </div>
        <p className="text-sm text-zinc-500 max-w-lg">
          Vue d'ensemble des statistiques clés de la plateforme Mossombi.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`glass-card rounded-2xl p-6 border ${card.bgColor} relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
          >
            <div className={`absolute -right-4 -top-4 ${card.color} opacity-5 group-hover:opacity-10 transition-opacity`}>
              <card.icon size={100} />
            </div>
            <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center mb-4`}>
              <card.icon className={card.color} size={22} />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1">{card.label}</p>
            <p className={`text-4xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="glass-card rounded-2xl p-8 border border-zinc-800/50 text-center">
        <BarChart3 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-300 mb-2">Module Analytics en développement</h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Les graphiques détaillés de revenus, trafic et performances seront disponibles dans une prochaine mise à jour.
          Les données ci-dessus reflètent les chiffres réels de votre base de données.
        </p>
      </div>
    </div>
  );
}
