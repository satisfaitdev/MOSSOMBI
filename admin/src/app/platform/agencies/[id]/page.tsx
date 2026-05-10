'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, MapPin, ShieldCheck, CheckCircle2, XCircle, Clock,
  FileText, LayoutGrid, ExternalLink, Loader2, AlertCircle, Calendar, User,
  Trash2, Ban, ShieldOff, ArrowRightLeft, PlusCircle, UserPlus, Users, Edit3, Save, Wallet,
} from 'lucide-react';

type AgencyStatus = 'pending' | 'approved' | 'rejected';
type Agency = {
  id: string; name: string; city: string; address: string; logo_url: string;
  owner_user_id: string | null; status: AgencyStatus; is_active: boolean;
  created_at: string; updated_at: string;
  owner?: { id: string; full_name: string; user_id_display: string; phone: string; avatar_url: string; } | null;
  wallet?: { balance: number; currency: string; status: string; } | null;
};

function Badge({ status }: { status: AgencyStatus }) {
  const c: Record<string, { color: string; icon: any; label: string }> = {
    approved: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2, label: 'Approuvée' },
    rejected: { color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', icon: XCircle, label: 'Rejetée' },
    pending: { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock, label: 'En attente' },
  };
  const { color, icon: Icon, label } = c[status] || c.pending;
  return (<span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${color}`}><Icon size={14} strokeWidth={2.5} />{label}</span>);
}

const SVC_TYPES = [
  { id: 'marketplace', name: 'Marketplace' }, { id: 'billetterie', name: 'Billetterie' },
  { id: 'voyage', name: 'Voyage' }, { id: 'restaurant', name: 'Restaurant' },
  { id: 'taxi', name: 'Taxi / Transport' }, { id: 'location', name: 'Location' },
  { id: 'livreur', name: 'Livreur' },
];

export default function AgencyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agencyId = params.id as string;

  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const api = (path: string) => `/api/platform/agencies/${encodeURIComponent(agencyId)}${path}`;

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(api(''), { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Agence introuvable');
      setAgency(json.data);
      setEditName(json.data.name); setEditCity(json.data.city); setEditAddress(json.data.address);

      const [sr, doc, mem] = await Promise.all([
        fetch(api('/service-requests'), { cache: 'no-store' }),
        fetch(api('/documents'), { cache: 'no-store' }),
        fetch(api('/members'), { cache: 'no-store' }),
      ]);
      const srJ = await sr.json().catch(() => null);
      const docJ = await doc.json().catch(() => null);
      const memJ = await mem.json().catch(() => null);
      if (sr.ok && srJ?.success) setServices(Array.isArray(srJ.data) ? srJ.data : []);
      if (doc.ok && docJ?.success) setDocuments(Array.isArray(docJ.data) ? docJ.data : []);
      if (mem.ok && memJ?.success) setMembers(Array.isArray(memJ.data) ? memJ.data : []);
    } catch (e: any) { setError(e?.message || 'Erreur'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (agencyId) load(); }, [agencyId]);

  async function action(path: string, method = 'POST', body?: any) {
    setActionLoading(true); setError(null);
    try {
      const opts: any = { method, headers: {} };
      if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
      const res = await fetch(api(path), opts);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Action échouée');
      return json;
    } catch (e: any) { setError(e?.message || 'Erreur'); return null; }
    finally { setActionLoading(false); }
  }

  async function handleApprove() { if (!confirm('Approuver cette agence ?')) return; const r = await action('/approve'); if (r) { setAgency(r.data); await load(); } }
  async function handleReject() { if (!confirm('Rejeter cette agence ?')) return; const r = await action('/reject'); if (r) setAgency(r.data); }
  async function handleBlock() { if (!confirm(agency?.is_active ? 'Bloquer cette agence ?' : 'Débloquer cette agence ?')) return; const r = await action('/block'); if (r) setAgency(r.data); }
  async function handleDelete() { if (!confirm('⚠️ SUPPRIMER définitivement cette agence et toutes ses données ?')) return; const r = await action('', 'DELETE'); if (r) router.push('/platform/agencies'); }
  async function handleTransfer() {
    const uid = prompt('ID utilisateur du nouveau propriétaire (UUID) :');
    if (!uid?.trim()) return;
    const r = await action('/transfer', 'POST', { new_owner_id: uid.trim() });
    if (r) await load();
  }
  async function handleAddService() {
    const sid = prompt(`Service à ajouter :\n${SVC_TYPES.map(s => `• ${s.id}`).join('\n')}`);
    if (!sid?.trim()) return;
    const r = await action('/add-service', 'POST', { service_id: sid.trim() });
    if (r) await load();
  }
  async function handleAddMember() {
    const uid = prompt('ID Mossombi de l\'utilisateur à ajouter (ex: mbs-123456) :');
    if (!uid?.trim()) return;
    const role = prompt('Rôle (host / agent / sub_agent) :') || 'host';
    const r = await action('/add-member', 'POST', { user_id_display: uid.trim(), role_in_agency: role.trim() });
    if (r) await load();
  }
  async function handleSaveEdit() {
    const r = await action('', 'PUT', { name: editName.trim(), city: editCity.trim(), address: editAddress.trim() });
    if (r) { setAgency(r.data); setEditing(false); }
  }

  if (loading) return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /><p className="text-zinc-500 text-sm">Chargement...</p></div>);
  if (error && !agency) return (<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><AlertCircle className="w-10 h-10 text-red-500" /><p className="text-red-400">{error}</p><button onClick={() => router.back()} className="mt-4 px-6 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white hover:bg-zinc-700 transition-colors">← Retour</button></div>);
  if (!agency) return null;

  const inputCls = "bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 w-full";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <button onClick={() => router.push('/platform/agencies')} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour aux agences
        </button>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {agency.logo_url ? (<img src={agency.logo_url} alt={agency.name} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border border-zinc-800 shadow-lg" />) : (<div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 shadow-lg"><Building2 size={28} /></div>)}
            <div>
              {editing ? (
                <div className="space-y-3">
                  <input value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} placeholder="Nom" />
                  <input value={editCity} onChange={e => setEditCity(e.target.value)} className={inputCls} placeholder="Ville" />
                  <input value={editAddress} onChange={e => setEditAddress(e.target.value)} className={inputCls} placeholder="Adresse" />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-500 transition-all disabled:opacity-50"><Save size={14} />Sauvegarder</button>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider hover:text-white transition-all">Annuler</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{agency.name}</h1>
                    <Badge status={agency.status} />
                    <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-zinc-600 hover:text-blue-400 transition-colors" title="Modifier"><Edit3 size={16} /></button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500/70" />{agency.city || 'Ville non spécifiée'}{agency.address ? ` • ${agency.address}` : ''}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {agency.status === 'pending' && (<>
              <button onClick={handleReject} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"><XCircle size={14} />Rejeter</button>
              <button onClick={handleApprove} disabled={actionLoading} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"><CheckCircle2 size={14} />Approuver</button>
            </>)}
            <button onClick={handleBlock} disabled={actionLoading} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 ${agency.is_active ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
              {agency.is_active ? <><Ban size={14} />Bloquer</> : <><ShieldCheck size={14} />Débloquer</>}
            </button>
            <button onClick={handleTransfer} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-blue-400 hover:border-blue-500/30 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"><ArrowRightLeft size={14} />Transférer</button>
            <button onClick={handleDelete} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"><Trash2 size={14} />Supprimer</button>
          </div>
        </div>
      </div>

      {error && (<div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-3"><XCircle size={18} />{error}</div>)}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-zinc-800/50">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Wallet size={18} className="text-emerald-400" /></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Solde Agence</p><p className="text-lg font-bold text-emerald-400">{((agency.wallet?.balance ?? 0)).toLocaleString('fr-FR')} <span className="text-xs text-zinc-500">{agency.wallet?.currency || 'XAF'}</span></p></div></div>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-zinc-800/50">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><ShieldCheck size={18} className={agency.is_active ? 'text-emerald-500' : 'text-zinc-600'} /></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Service</p><p className="text-sm font-semibold text-white">{agency.is_active ? 'Actif' : 'Inactif / Bloqué'}</p></div></div>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-zinc-800/50">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><Calendar size={18} className="text-blue-400" /></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Créée le</p><p className="text-sm font-semibold text-white">{new Date(agency.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></div>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-zinc-800/50">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center"><User size={18} className="text-purple-400" /></div>
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Propriétaire</p>
            {agency.owner ? (<><p className="text-sm font-semibold text-white truncate">{agency.owner.full_name}</p><p className="text-[11px] text-zinc-500 font-mono">mbs-{agency.owner.user_id_display?.replace(/\D/g, '') || '—'}</p></>) : (<p className="text-sm font-semibold text-zinc-600">Non assigné</p>)}
          </div></div>
        </div>
      </div>

      {/* Members */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-800/50">
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500"><Users size={14} className="text-blue-500" />Membres ({members.length})</h2>
          <button onClick={handleAddMember} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"><UserPlus size={14} />Ajouter</button>
        </div>
        {members.length === 0 ? (<div className="p-6 rounded-2xl border border-dashed border-zinc-800/60 text-center"><p className="text-sm text-zinc-600 italic">Aucun membre.</p></div>) : (
          <div className="space-y-3">
            {members.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600"><User size={18} /></div>
                  <div><p className="text-sm text-white font-bold">{m.user?.full_name || 'Inconnu'}</p><p className="text-[11px] text-zinc-500 font-mono">{m.user?.user_id_display || m.user_id?.substring(0, 12)}</p></div>
                </div>
                <span className={`text-[10px] font-bold uppercase py-1 px-2.5 rounded-full border ${m.role_in_agency === 'agent' ? 'text-blue-400 border-blue-400/20 bg-blue-400/5' : 'text-purple-400 border-purple-400/20 bg-purple-400/5'}`}>{m.role_in_agency}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Services */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-800/50">
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500"><LayoutGrid size={14} className="text-blue-500" />Services ({services.length})</h2>
          <button onClick={handleAddService} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"><PlusCircle size={14} />Ajouter</button>
        </div>
        {services.length === 0 ? (<div className="p-6 rounded-2xl border border-dashed border-zinc-800/60 text-center"><p className="text-sm text-zinc-600 italic">Aucun service.</p></div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s: any) => (
              <div key={String(s?.id)} className="p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/10 hover:border-zinc-700 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-zinc-100 font-bold">{String(s?.service_id || 'Service')}</p>
                  <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border ${s?.status === 'approved' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : 'text-amber-400 border-amber-400/20 bg-amber-400/5'}`}>{String(s?.status || 'pending')}</span>
                </div>
                {s?.admin_notes && <p className="text-[11px] text-zinc-500">{String(s.admin_notes)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-800/50">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-5"><FileText size={14} className="text-blue-500" />Justificatifs ({documents.length})</h2>
        {documents.length === 0 ? (<div className="p-6 rounded-2xl border border-dashed border-zinc-800/60 text-center text-zinc-600"><p className="text-sm italic">Aucun document soumis.</p></div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((d: any) => (
              <div key={String(d?.id)} className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/10 overflow-hidden hover:border-zinc-700 transition-all">
                <div className="p-4 border-b border-zinc-900/80 bg-zinc-900/20 flex items-center justify-between">
                  <div><p className="text-sm text-zinc-200 font-bold capitalize">{String(d?.doc_type || 'document').replace(/_/g, ' ')}</p><p className="text-[10px] text-zinc-500">Service: {String(d?.service_id || 'Global')}</p></div>
                  <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border ${d?.status === 'approved' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : 'text-amber-400 border-amber-400/20 bg-amber-400/5'}`}>{String(d?.status || 'pending')}</span>
                </div>
                <div className="relative aspect-video bg-zinc-900">
                  {String(d?.file_url || '').match(/^data:image|\.(?:jpg|jpeg|png|gif|webp)$/i) ? (<img src={String(d.file_url)} alt={String(d?.doc_type)} className="w-full h-full object-cover" />) : (<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-600"><FileText size={32} /><p className="text-xs">Document</p></div>)}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><a href={String(d.file_url)} target="_blank" rel="noreferrer" className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2"><ExternalLink size={14} />Voir</a></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
