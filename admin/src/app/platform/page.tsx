"use client";

import { 
  TrendingUp, 
  Users, 
  Store, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";

export default function DashboardOverview() {
  const stats = [
    {
      title: "Chiffre d'Affaires Brut",
      value: "145,892,000 FCFA",
      change: "+12.5%",
      isPositive: true,
      icon: Wallet,
      color: "blue"
    },
    {
      title: "Utilisateurs Inscrits",
      value: "84,392",
      change: "+5.2%",
      isPositive: true,
      icon: Users,
      color: "indigo"
    },
    {
      title: "Agences Affiliées",
      value: "1,204",
      change: "+18.1%",
      isPositive: true,
      icon: Store,
      color: "emerald"
    },
    {
      title: "Remboursements & Litiges",
      value: "842,500 FCFA",
      change: "-2.4%",
      isPositive: false,
      icon: TrendingUp,
      color: "rose"
    }
  ];

  const recentAgencies = [
    { id: "AG-0012", name: "Alpha Transit", host: "Jean MBONGO", status: "pending", date: "Il y a 2h" },
    { id: "AG-0013", name: "Express Logistics", host: "Marie KABA", status: "approved", date: "Aujourd'hui" },
    { id: "AG-0014", name: "CityRide VIP", host: "Paul NKOUA", status: "pending", date: "Hier" },
    { id: "AG-0015", name: "Mossombi Relais", host: "Boutique Chez Anna", status: "rejected", date: "24 Fév" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vue Globale <span className="text-blue-500">Live</span></h1>
          <p className="text-zinc-400 mt-1">Supervision en temps réel du réseau Mossombi.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-zinc-900 border border-[#27272a] text-sm text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50">
            <option>Aujourd'hui</option>
            <option>7 Derniers Jours</option>
            <option>Ce Mois</option>
            <option>Cette Année</option>
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
              {/* Background Glow */}
              <div className={`absolute -right-6 -top-6 w-32 h-32 bg-${stat.color}-500/10 rounded-full blur-3xl group-hover:bg-${stat.color}-500/20 transition-all duration-500`}></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 border border-${stat.color}-500/20`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  stat.isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
        {/* Left Big Chart Placeholder */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Croissance du Réseau (FCFA)</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Détails</button>
          </div>
          <div className="flex-1 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center bg-zinc-900/30">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Zone dédiée à l'intégration Chart.js/Recharts</p>
            </div>
          </div>
        </div>

        {/* Right Recent Pending Approvals */}
        <div className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Requêtes Agences</h2>
            <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/20 font-medium">9 En attente</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {recentAgencies.map((agency, i) => (
              <div key={i} className="p-4 rounded-xl border border-[#27272a] bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-zinc-200 text-sm">{agency.name}</h3>
                  {agency.status === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                  {agency.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {agency.status === 'rejected' && <XCircle className="w-4 h-4 text-rose-500" />}
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-zinc-500">ID: {agency.id}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Hôte: {agency.host}</p>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-medium">{agency.date}</span>
                </div>
                
                {agency.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                      Accepter
                    </button>
                    <button className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                      Refuser
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 text-sm text-center text-zinc-400 hover:text-white py-2 border border-[#27272a] rounded-lg hover:bg-zinc-800/50 transition-colors">
            Voir toutes les requêtes
          </button>
        </div>
      </div>
    </div>
  );
}
