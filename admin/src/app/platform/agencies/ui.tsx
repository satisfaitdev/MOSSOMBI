'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Building2,
  ShieldCheck,
  FileText,
  LayoutGrid,
  ChevronRight,
  ExternalLink,
  Ban
} from 'lucide-react';

type AgencyStatus = 'pending' | 'approved' | 'rejected';

type Agency = {
  id: string;
  name: string;
  city: string;
  address: string;
  logo_url: string;
  owner_user_id: string | null;
  status: AgencyStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function normalizeAgency(raw: any): Agency {
  return {
    id: String(raw?.id ?? raw?.t_id ?? ''),
    name: String(raw?.name ?? raw?.t_name ?? ''),
    city: String(raw?.city ?? raw?.t_city ?? ''),
    address: String(raw?.address ?? raw?.t_address ?? ''),
    logo_url: String(raw?.logo_url ?? raw?.t_logo_url ?? ''),
    owner_user_id: raw?.owner_user_id ?? raw?.t_owner_user_id ?? null,
    status: (raw?.status ?? raw?.t_status ?? 'pending') as AgencyStatus,
    is_active: Boolean(raw?.is_active ?? raw?.t_is_active ?? false),
    created_at: String(raw?.created_at ?? raw?.t_created_at ?? ''),
    updated_at: String(raw?.updated_at ?? raw?.t_updated_at ?? ''),
  };
}

function Badge({ status }: { status: AgencyStatus }) {
  const config = {
    approved: {
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      icon: CheckCircle2,
      label: 'Approuvée'
    },
    rejected: {
      color: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
      icon: XCircle,
      label: 'Rejetée'
    },
    pending: {
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      icon: Clock,
      label: 'En attente'
    }
  };

  const { color, icon: Icon, label } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${color}`}>
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
}

export default function AgenciesClient() {
  const [items, setItems] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsAgency, setDetailsAgency] = useState<Agency | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsServices, setDetailsServices] = useState<any[]>([]);
  const [detailsDocuments, setDetailsDocuments] = useState<any[]>([]);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<AgencyStatus | 'all'>('all');

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (status !== 'all') params.set('status', status);

      const res = await fetch(`/api/platform/agencies?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Erreur chargement');
      const arr = Array.isArray(json.data) ? json.data : [];
      setItems(arr.map(normalizeAgency).filter((x: Agency) => Boolean(x.id) && Boolean(x.name)));
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(id: string) {
    if (!id) return;
    if (!confirm('Approuver cette agence ?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/platform/agencies/${encodeURIComponent(id)}/approve`, { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Action échouée');
      await refresh();
      if (detailsAgency?.id === id) setDetailsOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Action échouée');
    }
  }

  async function reject(id: string) {
    if (!id) return;
    if (!confirm('Rejeter cette agence ?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/platform/agencies/${encodeURIComponent(id)}/reject`, { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Action échouée');
      await refresh();
      if (detailsAgency?.id === id) setDetailsOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Action échouée');
    }
  }

  async function refreshDetails(agencyId: string) {
    if (!agencyId) return;
    setDetailsLoading(true);
    try {
      const [srRes, docRes] = await Promise.all([
        fetch(`/api/platform/agencies/${encodeURIComponent(agencyId)}/service-requests`, { cache: 'no-store' }),
        fetch(`/api/platform/agencies/${encodeURIComponent(agencyId)}/documents`, { cache: 'no-store' }),
      ]);

      const srJson = await srRes.json().catch(() => null);
      const docJson = await docRes.json().catch(() => null);

      if (srRes.ok && srJson?.success) setDetailsServices(Array.isArray(srJson.data) ? srJson.data : []);
      if (docRes.ok && docJson?.success) setDetailsDocuments(Array.isArray(docJson.data) ? docJson.data : []);
    } catch {
      // ignore
    } finally {
      setDetailsLoading(false);
    }
  }

  async function approveServiceRequest(serviceRequestId: string) {
    if (!serviceRequestId) return;
    if (!confirm('Approuver ce service ?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/platform/service-requests/${encodeURIComponent(serviceRequestId)}/approve`, {
        method: 'POST',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Action échouée');
      if (detailsAgency?.id) await refreshDetails(detailsAgency.id);
    } catch (e: any) {
      setError(e?.message || 'Action échouée');
    }
  }

  async function rejectServiceRequest(serviceRequestId: string) {
    if (!serviceRequestId) return;
    const admin_notes = prompt('Motif / note admin (optionnel)') || '';
    if (!confirm('Rejeter ce service ?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/platform/service-requests/${encodeURIComponent(serviceRequestId)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Action échouée');
      if (detailsAgency?.id) await refreshDetails(detailsAgency.id);
    } catch (e: any) {
      setError(e?.message || 'Action échouée');
    }
  }

  async function openDetails(a: Agency) {
    if (!a?.id) return;
    setDetailsAgency(a);
    setDetailsOpen(true);
    setDetailsServices([]);
    setDetailsDocuments([]);
    await refreshDetails(a.id);
  }

  async function createManualAgency() {
    const name = prompt('Nom de l\'agence ?');
    if (!name || !name.trim()) return;
    setError(null);
    try {
      const res = await fetch('/api/platform/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Création échouée');
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Création échouée');
    }
  }

  const filtered = useMemo(() => {
    if (status === 'all') return items;
    return items.filter((x) => x.status === status);
  }, [items, status]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Building2 className="text-blue-500" size={32} />
            Agences
          </h1>
          <p className="text-sm text-zinc-500 mt-2 max-w-lg">
            Gérez et validez les demandes d’activation des agences partenaires sur la plateforme Mossombi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une agence..."
              className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl pl-11 pr-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all w-full md:w-64"
            />
          </div>
          <button
            onClick={refresh}
            className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
            title="Recharger"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={createManualAgency}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} />
            Nouvelle
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-zinc-900/40 border border-zinc-800/60 rounded-xl self-start">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setStatus(t as any)}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${status === t
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            {t === 'all' ? 'Toutes' : t === 'pending' ? 'En attente' : t === 'approved' ? 'Approuvées' : 'Rejetées'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-3">
          <XCircle size={18} />
          {error}
        </div>
      )}

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card h-48 rounded-2xl animate-pulse bg-zinc-900/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800/40">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-4 text-zinc-600">
            <Ban size={32} />
          </div>
          <h3 className="text-lg font-medium text-zinc-400">Aucune agence trouvée</h3>
          <p className="text-sm text-zinc-650 mt-1">Ajustez vos filtres ou effectuez une nouvelle recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((a) => (
            <div key={a.id} className="glass-card group flex flex-col rounded-2xl border border-zinc-800/50 hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/5 overflow-hidden">
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate mb-1" title={a.name}>
                      {a.name}
                    </h3>
                    <Badge status={a.status} />
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs">
                        <MapPin size={14} className="text-blue-500/70" />
                        <span className="truncate">{a.city || 'Ville non spécifiée'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500 text-xs">
                        <ShieldCheck size={14} className={a.is_active ? 'text-emerald-500/70' : 'text-zinc-600'} />
                        <span>{a.is_active ? 'Service Actif' : 'Service Inactif'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    {a.logo_url ? (
                      <img src={a.logo_url} alt={a.name} className="w-16 h-16 rounded-2xl object-cover border border-zinc-800 shadow-inner group-hover:border-zinc-700 transition-colors" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-800">
                        <Building2 size={24} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-white/5 border-t border-zinc-800/50 flex items-center justify-between">
                <button
                  onClick={() => openDetails(a)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
                >
                  Détails
                  <ChevronRight size={14} />
                </button>

                <div className="flex items-center gap-2">
                  {a.status === 'pending' && (
                    <>
                      <button
                        onClick={() => reject(a.id)}
                        className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all"
                        title="Rejeter"
                      >
                        <XCircle size={18} />
                      </button>
                      <button
                        onClick={() => approve(a.id)}
                        className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                        title="Approuver"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </>
                  )}
                  {a.status !== 'pending' && (
                    <button
                      onClick={() => openDetails(a)}
                      className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {detailsOpen && detailsAgency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-zinc-800/60 bg-zinc-950 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800/60 flex items-center justify-between gap-6 bg-zinc-900/20">
              <div className="flex items-center gap-5">
                {detailsAgency.logo_url ? (
                  <img src={detailsAgency.logo_url} alt={detailsAgency.name} className="w-14 h-14 rounded-2xl object-cover border border-zinc-800" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700">
                    <Building2 size={24} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white leading-tight">{detailsAgency.name}</h3>
                    <Badge status={detailsAgency.status} />
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 text-xs mt-1">
                    <MapPin size={12} />
                    <span>{detailsAgency.city || '—'} • {detailsAgency.address || '—'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setDetailsOpen(false);
                  setDetailsAgency(null);
                }}
                className="p-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-all"
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Section: Services */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  <LayoutGrid size={14} className="text-blue-500" />
                  Services demandés
                </h4>
                {detailsLoading ? (
                  <div className="h-20 animate-pulse bg-zinc-900/50 rounded-2xl" />
                ) : detailsServices.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-zinc-800/60 text-center">
                    <p className="text-sm text-zinc-600 italic">Aucun service spécifique demandé.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {detailsServices.map((s) => (
                      <div key={String(s?.id)} className="group p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/10 hover:border-zinc-700 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-zinc-100 font-bold">{String(s?.service_id || 'Service')}</p>
                          <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border ${s?.status === 'approved' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : 'text-amber-400 border-amber-400/20 bg-amber-400/5'
                            }`}>
                            {String(s?.status || 'pending')}
                          </span>
                        </div>
                        {s?.admin_notes ? (
                          <div className="text-[11px] text-zinc-500 mb-3">
                            {String(s.admin_notes)}
                          </div>
                        ) : null}
                        {String(s?.status || 'pending') === 'pending' && (
                          <div className="flex items-center justify-end gap-2 mb-3">
                            <button
                              onClick={() => rejectServiceRequest(String(s?.id || ''))}
                              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all"
                              title="Rejeter"
                            >
                              <XCircle size={18} />
                            </button>
                            <button
                              onClick={() => approveServiceRequest(String(s?.id || ''))}
                              className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                              title="Approuver"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          </div>
                        )}
                        {s?.payload_json && Object.keys(s.payload_json).length > 0 && (
                          <div className="pt-3 border-t border-zinc-900">
                            <pre className="text-[10px] leading-relaxed text-zinc-500 font-mono whitespace-pre-wrap">
                              {JSON.stringify(s.payload_json, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section: Documents */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  <FileText size={14} className="text-blue-500" />
                  Justificatifs fournis
                </h4>
                {detailsLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 animate-pulse bg-zinc-900/50 rounded-2xl" />
                    <div className="h-32 animate-pulse bg-zinc-900/50 rounded-2xl" />
                  </div>
                ) : detailsDocuments.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-zinc-800/60 text-center text-zinc-600">
                    <p className="text-sm italic">Aucun document n'a été soumis.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {detailsDocuments.map((d) => (
                      <div key={String(d?.id)} className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/10 overflow-hidden hover:border-zinc-700 transition-all">
                        <div className="p-4 border-b border-zinc-900/80 bg-zinc-900/20 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-zinc-200 font-bold capitalize">{String(d?.doc_type || 'document').replace(/_/g, ' ')}</p>
                            <p className="text-[10px] text-zinc-500 font-medium">Service: {String(d?.service_id || 'Global')}</p>
                          </div>
                          <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border ${d?.status === 'approved' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : 'text-amber-400 border-amber-400/20 bg-amber-400/5'
                            }`}>
                            {String(d?.status || 'pending')}
                          </span>
                        </div>
                        <div className="relative aspect-video bg-zinc-900">
                          {String(d?.file_url || '').startsWith('data:image') || String(d?.file_url || '').match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                              src={String(d.file_url)}
                              alt={String(d?.doc_type)}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-600">
                              <FileText size={32} />
                              <p className="text-xs font-medium">Document Fichier</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <a
                              href={String(d.file_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                            >
                              <ExternalLink size={14} />
                              Voir
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            {detailsAgency.status === 'pending' && (
              <div className="p-6 border-t border-zinc-800/60 bg-zinc-900/40 flex items-center justify-end gap-3">
                <button
                  onClick={() => reject(detailsAgency.id)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <XCircle size={18} />
                  Rejeter
                </button>
                <button
                  onClick={() => approve(detailsAgency.id)}
                  className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10"
                >
                  <CheckCircle2 size={18} />
                  Approuver l'agence
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
