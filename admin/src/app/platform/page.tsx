"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  Store,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agencyCount, setAgencyCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeAds, setActiveAds] = useState(0);
  const [recentAgencies, setRecentAgencies] = useState<any[]>([]);
  const [period, setPeriod] = useState("today");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [agenciesRes, adsRes] = await Promise.all([
          fetch("/api/platform/agencies", { cache: "no-store" }),
          fetch("/api/ads", { cache: "no-store" }),
        ]);

        const agenciesJson = await agenciesRes.json().catch(() => null);
        const adsJson = await adsRes.json().catch(() => null);

        const agencies = agenciesJson?.success ? (agenciesJson.data || []) : [];
        const ads = adsJson?.success ? (adsJson.data || []) : [];

        setAgencyCount(agencies.length);
        setPendingCount(agencies.filter((a: any) => a.status === "pending").length);
        setActiveAds(ads.filter((a: any) => a.status === "active" || !a.status).length);
        setRecentAgencies(
          agencies
            .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 4)
            .map((a: any) => ({
              id: a.id || a._id,
              name: a.name || a.business_name || "N/A",
              host: a.host_name || a.owner_name || "N/A",
              status: a.status || "pending",
              date: a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : "N/A",
            }))
        );
      } catch (e: any) {
        setError(e?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/platform/agencies/${id}/approve`, { method: "POST" });
      const json = await res.json();
      if (json?.success) {
        setRecentAgencies((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a))
        );
      }
    } catch (e) {
      console.error("Approve failed:", e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/platform/agencies/${id}/reject`, { method: "POST" });
      const json = await res.json();
      if (json?.success) {
        setRecentAgencies((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a))
        );
      }
    } catch (e) {
      console.error("Reject failed:", e);
    }
  };

  const stats = [
    {
      title: "Agences Affiliées",
      value: agencyCount.toLocaleString("fr-FR"),
      icon: Store,
      color: "emerald",
      isPositive: true,
      change: "+" + agencyCount,
    },
    {
      title: "Annonces Actives",
      value: activeAds.toLocaleString("fr-FR"),
      icon: TrendingUp,
      color: "blue",
      isPositive: true,
      change: "+" + activeAds,
    },
    {
      title: "Agences en Attente",
      value: pendingCount.toLocaleString("fr-FR"),
      icon: Users,
      color: "amber",
      isPositive: false,
      change: pendingCount.toString(),
    },
    {
      title: "Remboursements & Litiges",
      value: "Voir détails",
      icon: Wallet,
      color: "rose",
      isPositive: false,
      change: "N/A",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-zinc-500 text-sm">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vue Globale <span className="text-blue-500">Live</span></h1>
          <p className="text-zinc-400 mt-1">Supervision en temps réel du réseau Mossombi.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-zinc-900 border border-[#27272a] text-sm text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="today">Aujourd'hui</option>
            <option value="7days">7 Derniers Jours</option>
            <option value="month">Ce Mois</option>
            <option value="year">Cette Année</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            Télécharger le Rapport
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className={`absolute -right-6 -top-6 w-32 h-32 bg-${stat.color}-500/10 rounded-full blur-3xl group-hover:bg-${stat.color}-500/20 transition-all duration-500`}></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 border border-${stat.color}-500/20`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  stat.isPositive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-zinc-400 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Big Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Croissance du Réseau</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Détails</button>
          </div>
          <div className="flex-1 flex items-end gap-4 px-2 pb-4">
            {[
              { label: "Agences", value: agencyCount, color: "bg-emerald-500" },
              { label: "Annonces", value: activeAds, color: "bg-blue-500" },
              { label: "Attente", value: pendingCount, color: "bg-amber-500" },
            ].map((item) => {
              const maxVal = Math.max(agencyCount, activeAds, pendingCount, 1);
              const h = Math.max((item.value / maxVal) * 100, 8);
              return (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-xs text-zinc-400 font-medium">{item.value}</span>
                  <div className="w-full flex flex-col items-center gap-1" style={{ height: "180px", justifyContent: "flex-end" }}>
                    <div
                      className={`w-full rounded-t-lg ${item.color} transition-all duration-500`}
                      style={{ height: `${h}%`, minHeight: "20px" }}
                    ></div>
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Recent Pending Approvals */}
        <div className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Requêtes Agences</h2>
            <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/20 font-medium">{pendingCount} En attente</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {recentAgencies.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">Aucune agence trouvée</p>
            ) : (
              recentAgencies.map((agency, i) => (
                <div key={i} className="p-4 rounded-xl border border-[#27272a] bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-zinc-200 text-sm">{agency.name}</h3>
                    {agency.status === "pending" && <Clock className="w-4 h-4 text-amber-500" />}
                    {agency.status === "approved" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {agency.status === "rejected" && <XCircle className="w-4 h-4 text-rose-500" />}
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-zinc-500">ID: {agency.id}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Hôte: {agency.host}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-medium">{agency.date}</span>
                  </div>

                  {agency.status === "pending" && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleApprove(agency.id)}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => handleReject(agency.id)}
                        className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <button className="w-full mt-4 text-sm text-center text-zinc-400 hover:text-white py-2 border border-[#27272a] rounded-lg hover:bg-zinc-800/50 transition-colors">
            Voir toutes les requêtes
          </button>
        </div>
      </div>
    </div>
  );
}
