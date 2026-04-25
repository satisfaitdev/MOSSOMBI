"use client";

import { useState } from "react";
import { 
  AlertTriangle, 
  MessageSquare, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  UserX, 
  Car,
  ChevronRight
} from "lucide-react";

export default function DisputesPage() {
  const [activeTab, setActiveTab] = useState("open");

  const disputes = [
    { id: "TKT-8902", type: "Transport", title: "Chauffeur très en retard, course annulée.", user: "Jean Marc", target: "Mossy Taxi (Ag-1402)", status: "open", priority: "high", date: "Il y a 30 min" },
    { id: "TKT-8895", type: "Marketplace", title: "Produit reçu endommagé", user: "Sara Diop", target: "Boutique Chez Anna", status: "open", priority: "medium", date: "Il y a 2h" },
    { id: "TKT-8750", type: "Fintech", title: "Recharge portefeuille non reçue", user: "Amadou M.", target: "Système MTN", status: "investigating", priority: "critical", date: "Hier 14:30" },
    { id: "TKT-8501", type: "Account", title: "Demande de suppression de compte", user: "Marcelle T.", target: "-", status: "resolved", priority: "low", date: "15 Fév 2026" },
  ];

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'critical': return "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]";
      case 'high': return "bg-orange-500/20 text-orange-400 border border-orange-500/20";
      case 'medium': return "bg-blue-500/20 text-blue-400 border border-blue-500/20";
      case 'low': return "bg-zinc-800 text-zinc-400 border border-zinc-700";
      default: return "bg-zinc-800 text-zinc-400";
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Transport': return <Car className="w-5 h-5 text-emerald-400" />;
      case 'Marketplace': return <Store className="w-5 h-5 text-violet-400" />;
      case 'Fintech': return <Wallet className="w-5 h-5 text-blue-400" />;
      default: return <UserX className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.1)]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Litiges & <span className="text-rose-400">Support</span></h1>
          </div>
          <p className="text-zinc-400">Gérez les conflits, remboursements et plaintes des utilisateurs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left List Column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex gap-2 p-1 bg-zinc-900 border border-[#27272a] rounded-xl">
            {[
              { id: "open", label: "Ouverts" },
              { id: "investigating", label: "En cours" },
              { id: "resolved", label: "Résolus" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.id 
                    ? "bg-zinc-800/80 text-white shadow" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher ticket..." 
              className="w-full h-10 bg-zinc-900 border border-[#27272a] rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[800px] custom-scrollbar pr-2">
            {disputes.map((ticket, i) => (
              <div 
                key={ticket.id} 
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                  i === 0 
                    ? "bg-rose-500/5 border-rose-500/30" 
                    : "bg-zinc-900/40 border-[#27272a] hover:bg-zinc-800/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 w-max ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">{ticket.id}</span>
                </div>
                
                <h3 className={`font-semibold text-sm mb-1 ${i === 0 ? "text-white" : "text-zinc-300"}`}>
                  {ticket.title}
                </h3>
                
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <UserX className="w-3 h-3 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-400 truncate">{ticket.user}</p>
                  </div>
                  <span className="text-xs font-medium text-zinc-600">{ticket.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-0 flex flex-col h-[800px] border border-[#27272a] overflow-hidden">
          
          {/* Ticket Header */}
          <div className="p-6 border-b border-[#27272a] bg-zinc-900/50 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-rose-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-[0_0_10px_rgba(239,68,68,0.5)]">Critique</span>
                  <span className="text-sm text-zinc-500 font-mono">TKT-8902</span>
                  <span className="text-sm text-zinc-500 px-2 border-l border-zinc-700">Il y a 30 min</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Chauffeur très en retard, course annulée.</h2>
                <p className="text-sm text-zinc-400 flex items-center gap-2">
                  Client: <span className="text-blue-400 font-medium cursor-pointer hover:underline">Jean Marc (+242 06 000 00)</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button className="h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors border border-zinc-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> En investigation
                </button>
                <button className="h-9 w-9 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700 flex items-center justify-center">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Target Info */}
            <div className="mt-6 p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Car className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold mb-0.5">Impliqué (Cible)</p>
                  <p className="text-sm text-white font-medium">Mossy Taxi (Ag-1402) - Chauffeur: David</p>
                </div>
              </div>
              <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center font-medium">
                Voir profil partenaire <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>

          {/* Chat Timeline */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#09090b]/40 custom-scrollbar space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-blue-400">JM</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-zinc-200 text-sm">Jean Marc (Client)</span>
                  <span className="text-xs text-zinc-500">14:45</span>
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-tr-xl rounded-b-xl text-sm text-zinc-300 inline-block">
                  J'ai commandé un taxi il y a 40 minutes, l'application affichait 5 minutes. Le chauffeur ne répond pas au téléphone et la somme a été bloquée de mon portefeuille !
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                Assigné à l'équipe Support Niveau 1
              </span>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-emerald-400 text-sm">Automatisé (Système)</span>
                  <span className="text-xs text-zinc-500">14:46</span>
                </div>
                <div className="p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-tr-xl rounded-b-xl text-sm text-zinc-300 inline-block whitespace-pre-line">
                  📦 Vérification de la course ID #TR-00492:
                  - Statut Gps: Le véhicule n'a pas bougé depuis 25 minutes.
                  - Portefeuille: 2500 FCFA mis en séquestre.
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-[#27272a] bg-zinc-900/80 backdrop-blur-md">
            <div className="flex gap-3">
              <button className="h-10 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors border border-zinc-700">
                Notifier le client
              </button>
              <button className="h-10 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium rounded-lg transition-colors border border-rose-500/30 ml-auto">
                Pénaliser l'Agence
              </button>
              <button className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Rembourser 2500 FCFA
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Composants de secours pour eviter l'erreur non definie
function Store(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>; }
function Wallet(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>; }
