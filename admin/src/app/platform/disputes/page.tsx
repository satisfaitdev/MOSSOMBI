"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Search,
  Clock,
  UserX,
  Car,
  ChevronRight,
  Store,
  Wallet,
  MoreVertical,
  Loader2,
  AlertCircle,
  ShoppingBag,
  CreditCard
} from "lucide-react";

export default function DisputesPage() {
  const [activeTab, setActiveTab] = useState("open");
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDisputes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/platform/disputes", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        const data = json?.success ? (json.data || []) : [];

        const mapped = data.map((d: any, i: number) => ({
          id: d.id || d._id || `TKT-${String(i + 1).padStart(4, "0")}`,
          type: d.type || "Transport",
          title: d.title || d.description || "Litige",
          user: d.user_name || d.user || "Utilisateur",
          target: d.target_name || d.target || "-",
          status: d.status || "open",
          priority: d.priority || "medium",
          date: d.created_at
            ? new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : "N/A",
        }));
        setDisputes(mapped);
        if (mapped.length > 0) setSelectedTicket(mapped[0]);
      } catch (e: any) {
        setError(e?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchDisputes();
  }, []);

  const handleAction = async (action: string, ticketId: string) => {
    try {
      const res = await fetch(`/api/platform/disputes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ticketId }),
      });
      const json = await res.json();
      console.log(`Action ${action} on ${ticketId}:`, json);
    } catch (e) {
      console.error(`Action ${action} failed:`, e);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]";
      case "high":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/20";
      case "medium":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/20";
      case "low":
        return "bg-zinc-800 text-zinc-400 border border-zinc-700";
      default:
        return "bg-zinc-800 text-zinc-400";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Transport":
        return <Car className="w-5 h-5 text-emerald-400" />;
      case "Marketplace":
        return <ShoppingBag className="w-5 h-5 text-violet-400" />;
      case "Fintech":
        return <CreditCard className="w-5 h-5 text-blue-400" />;
      default:
        return <UserX className="w-5 h-5 text-zinc-400" />;
    }
  };

  const filtered = disputes.filter((t) => activeTab === "all" || t.status === activeTab);
  const tabs = [
    { id: "all", label: `Tous (${disputes.length})` },
    { id: "open", label: `Ouverts (${disputes.filter((d) => d.status === "open").length})` },
    { id: "investigating", label: `En cours (${disputes.filter((d) => d.status === "investigating").length})` },
    { id: "resolved", label: `Résolus (${disputes.filter((d) => d.status === "resolved").length})` },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
        <p className="text-zinc-500 text-sm">Chargement des litiges...</p>
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

  if (disputes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-10 h-10 text-zinc-600" />
        <p className="text-zinc-500 text-sm">Aucun litige trouvé</p>
      </div>
    );
  }

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
            {tabs.map((tab) => (
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
            {filtered.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                  selectedTicket?.id === ticket.id
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

                <h3 className={`font-semibold text-sm mb-1 ${selectedTicket?.id === ticket.id ? "text-white" : "text-zinc-300"}`}>
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
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-6 border-b border-[#27272a] bg-zinc-900/50 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded shadow-[0_0_10px_rgba(239,68,68,0.5)] ${
                          selectedTicket.priority === "critical"
                            ? "bg-red-500 text-white"
                            : "bg-orange-500/20 text-orange-400"
                        }`}
                      >
                        {selectedTicket.priority}
                      </span>
                      <span className="text-sm text-zinc-500 font-mono">{selectedTicket.id}</span>
                      <span className="text-sm text-zinc-500 px-2 border-l border-zinc-700">{selectedTicket.date}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">{selectedTicket.title}</h2>
                    <p className="text-sm text-zinc-400 flex items-center gap-2">
                      Client:{" "}
                      <span className="text-blue-400 font-medium cursor-pointer hover:underline">
                        {selectedTicket.user}
                      </span>
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
                      <p className="text-sm text-white font-medium">{selectedTicket.target}</p>
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
                      <span className="font-semibold text-zinc-200 text-sm">{selectedTicket.user} (Client)</span>
                      <span className="text-xs text-zinc-500">{selectedTicket.date}</span>
                    </div>
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-tr-xl rounded-b-xl text-sm text-zinc-300 inline-block">
                      {selectedTicket.title}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 border-t border-[#27272a] bg-zinc-900/80 backdrop-blur-md">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction("notify", selectedTicket.id)}
                    className="h-10 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors border border-zinc-700"
                  >
                    Notifier le client
                  </button>
                  <button
                    onClick={() => handleAction("penalize", selectedTicket.id)}
                    className="h-10 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium rounded-lg transition-colors border border-rose-500/30 ml-auto"
                  >
                    Pénaliser l&apos;Agence
                  </button>
                  <button
                    onClick={() => handleAction("refund", selectedTicket.id)}
                    className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2"
                  >
                    <Wallet className="w-4 h-4" /> Rembourser
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">
              Sélectionnez un ticket pour voir les détails
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
