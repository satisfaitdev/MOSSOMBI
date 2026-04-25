"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XOctagon, 
  Eye, 
  Store 
} from "lucide-react";

export default function AgenciesPage() {
  const [activeTab, setActiveTab] = useState("all");

  const agencies = [
    { id: "AG-1502", name: "Premium Transport Biz", host: "Alain K.", phone: "+242 06 123 45 67", status: "pending", commission: "10%", created: "28 Mar 2026" },
    { id: "AG-1498", name: "Alpha Transit", host: "Jean MBONGO", phone: "+242 05 987 65 43", status: "pending", commission: "15%", created: "28 Mar 2026" },
    { id: "AG-1402", name: "CityRide VIP", host: "Paul NKOUA", phone: "+242 06 555 11 22", status: "approved", commission: "12%", created: "10 Mar 2026" },
    { id: "AG-1355", name: "Express Logistics", host: "Marie KABA", phone: "+242 05 111 22 33", status: "approved", commission: "10%", created: "05 Fev 2026" },
    { id: "AG-1301", name: "Mossombi Relais", host: "Anna B.", phone: "+242 06 999 88 77", status: "rejected", commission: "-", created: "15 Jan 2026" },
  ];

  const filteredAgencies = activeTab === "all" 
    ? agencies 
    : agencies.filter(a => a.status === activeTab);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Gestion des <span className="text-blue-500">Agences</span></h1>
          </div>
          <p className="text-zinc-400">Examinez, Validez ou Rejetez les demandes de création d'agences.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center glass-card p-4 rounded-2xl">
        <div className="flex bg-zinc-900 border border-[#27272a] rounded-lg p-1 w-full sm:w-auto">
          {[
            { id: "all", label: "Toutes" },
            { id: "pending", label: "En attente" },
            { id: "approved", label: "Actives" },
            { id: "rejected", label: "Rejetées" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id 
                  ? "bg-blue-600/20 text-blue-400 shadow-[inset_0_0_15px_rgba(37,99,235,0.1)] border border-blue-500/20" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {tab.label}
              {tab.id === "pending" && (
                <span className="ml-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {agencies.filter(a => a.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex w-full sm:w-auto gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher (Nom, ID, Tel)..." 
              className="w-full h-10 bg-zinc-900 border border-[#27272a] rounded-lg pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <button className="px-4 py-2 bg-zinc-900 border border-[#27272a] rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-[#27272a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-[#27272a]">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">ID Agence</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nom & Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Taux Commission</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date Demande</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]/50">
              {filteredAgencies.map((agency) => (
                <tr key={agency.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-zinc-300">{agency.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{agency.name}</span>
                      <span className="text-xs text-zinc-500 mt-0.5">Prop: {agency.host} • {agency.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-zinc-300 font-medium">{agency.commission}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-zinc-400">{agency.created}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {agency.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        En Attente
                      </span>
                    )}
                    {agency.status === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                    {agency.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XOctagon className="w-3.5 h-3.5" />
                        Rejetée
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors" title="Voir les détails">
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {agency.status === 'pending' && (
                        <>
                          <button className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg transition-colors" title="Approuver">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-colors" title="Rejeter">
                            <XOctagon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAgencies.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center">
              <Store className="w-12 h-12 text-zinc-700 mb-4" />
              <h3 className="text-lg font-medium text-white">Aucune agence trouvée</h3>
              <p className="text-zinc-500 mt-1 max-w-sm">Il n'y a actuellement aucune requête d'agence dans cette catégorie.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
