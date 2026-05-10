"use client";

import { useState } from "react";
import { 
  MapPin, 
  Navigation, 
  Package, 
  Car, 
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function LogisticsMapPage() {
  const [activeTab, setActiveTab] = useState("all");

  const drivers = [
    { id: "DRV-001", name: "David M.", status: "busy", type: "Moto", location: "Centre-ville", eta: "5 min", orderId: "ORD-998" },
    { id: "DRV-002", name: "Sarah K.", status: "available", type: "Voiture", location: "Quartier Nord", eta: "-", orderId: "-" },
    { id: "DRV-003", name: "Marc A.", status: "busy", type: "Fourgonnette", location: "Aéroport", eta: "15 min", orderId: "ORD-982" },
    { id: "DRV-004", name: "Éric T.", status: "offline", type: "Moto", location: "-", eta: "-", orderId: "-" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Suivi <span className="text-emerald-400">Logistique</span></h1>
            <p className="text-sm text-zinc-400">Vue en temps réel de la flotte et des livraisons en cours.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="h-10 px-4 bg-zinc-900 border border-[#27272a] text-zinc-300 font-medium rounded-xl flex items-center gap-2 hover:bg-zinc-800 transition-colors">
            <Filter className="w-4 h-4" /> Filtres
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Fleet List Panel */}
        <div className="lg:col-span-1 glass-card border border-[#27272a] rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#27272a]">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Chercher un livreur ou commande..." 
                className="w-full bg-zinc-900 border border-[#27272a] rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            
            <div className="flex gap-2 mt-4 overflow-x-auto custom-scrollbar pb-1">
              {[
                { id: "all", label: "Tous (4)" },
                { id: "busy", label: "En course (2)" },
                { id: "available", label: "Libres (1)" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                    activeTab === tab.id 
                      ? "bg-zinc-800 text-white border border-zinc-700" 
                      : "text-zinc-500 hover:text-zinc-300 bg-transparent border border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {drivers.filter(d => activeTab === 'all' || d.status === activeTab).map(driver => (
              <div key={driver.id} className="p-3 bg-zinc-900/50 hover:bg-zinc-800/50 border border-transparent hover:border-zinc-700 rounded-xl cursor-pointer transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      driver.status === 'available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                      driver.status === 'busy' ? 'bg-orange-500' : 'bg-zinc-600'
                    }`} />
                    <h3 className="font-semibold text-sm text-zinc-200">{driver.name}</h3>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{driver.id}</span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {driver.type}</span>
                  {driver.status === 'busy' && (
                    <span className="flex items-center gap-1 text-orange-400"><Clock className="w-3 h-3" /> ETA: {driver.eta}</span>
                  )}
                </div>

                {driver.status === 'busy' && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/50 flex justify-between items-center">
                    <span className="text-[10px] uppercase text-zinc-500 font-medium">Commande</span>
                    <span className="text-xs font-mono text-zinc-300">{driver.orderId}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Map Panel (Mocked for UI) */}
        <div className="lg:col-span-3 glass-card border border-[#27272a] rounded-2xl relative overflow-hidden bg-zinc-950 flex flex-col justify-end p-6">
          
          {/* Simulated Map Background - Normally this would be Google Maps / Mapbox */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, #27272a 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}></div>

          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <Navigation className="w-64 h-64 text-emerald-500" />
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="w-10 h-10 bg-zinc-900 border border-[#27272a] rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800">
              +
            </button>
            <button className="w-10 h-10 bg-zinc-900 border border-[#27272a] rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800">
              -
            </button>
          </div>

          {/* Map Overlay Stats */}
          <div className="relative z-10 grid grid-cols-3 gap-4">
            <div className="bg-zinc-900/80 backdrop-blur-md border border-[#27272a] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">En cours</span>
              </div>
              <p className="text-2xl font-bold text-white">42</p>
            </div>
            
            <div className="bg-zinc-900/80 backdrop-blur-md border border-[#27272a] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Flotte Active</span>
              </div>
              <p className="text-2xl font-bold text-white">18</p>
            </div>
            
            <div className="bg-zinc-900/80 backdrop-blur-md border border-rose-500/20 rounded-xl p-4 shadow-[0_0_15px_rgba(225,29,72,0.05)]">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Retards signalés</span>
              </div>
              <p className="text-2xl font-bold text-rose-400">3</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
