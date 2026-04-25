'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminCard from '@/components/AdminCard';

type AdType = 'banner' | 'popup' | 'splash';

type Ad = {
  id: string;
  type: AdType;
  title: string;
  link_url: string;
  image_url: string;
  target_cities?: string[];
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

export default function AdsClient() {
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdType | 'all'>('all');
  const [showDrawer, setShowDrawer] = useState(false);

  const [linkOptions, setLinkOptions] = useState<string[]>([]);

  // Form State
  const [type, setType] = useState<AdType>('banner');
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [priority, setPriority] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [targetCitiesText, setTargetCitiesText] = useState('');

  const previewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/ads', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Erreur chargement');
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/frontend-links', { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success && Array.isArray(json.data)) {
          setLinkOptions(json.data);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const image_url = imageFile ? await fileToDataUrl(imageFile) : '';

      const target_cities = targetCitiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          link_url: linkUrl,
          image_url,
          target_cities,
          priority,
          is_active: isActive,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Création échouée');

      resetForm();
      setShowDrawer(false);
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Création échouée');
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setTitle('');
    setLinkUrl('');
    setPriority(0);
    setIsActive(true);
    setImageFile(null);
    setTargetCitiesText('');
  }

  async function onDelete(id: string) {
    if (!confirm('Supprimer cette publicité ?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/ads/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Suppression échouée');
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Suppression échouée');
    }
  }

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items;
    return items.filter(item => item.type === activeTab);
  }, [items, activeTab]);

  return (
    <div className="space-y-8 relative">
      {/* Header Actions & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/50 pb-6">
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 w-fit">
          {(['all', 'banner', 'popup', 'splash'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === tab
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center justify-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-zinc-200 transition-all shadow-lg"
        >
          <span>+</span> Nouvelle Publicité
        </button>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card h-80 rounded-2xl animate-pulse bg-zinc-900/50"></div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800/50">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 text-zinc-600 text-2xl">
            ∅
          </div>
          <h3 className="text-lg font-medium text-zinc-400">Aucune publicité trouvée</h3>
          <p className="text-sm text-zinc-600 mt-1">Changez de filtre ou créez une nouvelle campagne.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((ad) => (
            <div key={ad.id} className="group glass-card rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(37,99,235,0.1)]">
              {/* Image Preview */}
              <div className="relative h-48 overflow-hidden bg-zinc-900">
                {ad.image_url ? (
                  <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700 font-bold text-xs uppercase tracking-widest bg-gradient-to-br from-zinc-900 to-zinc-950">
                    No Image Preview
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${ad.is_active
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}>
                    {ad.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/50 backdrop-blur-md text-zinc-300 border border-white/10">
                    {ad.type}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-zinc-100 font-semibold truncate mb-1" title={ad.title}>{ad.title}</h3>
                  <p className="text-xs text-zinc-500 truncate font-mono" title={ad.link_url}>{ad.link_url || 'Aucun lien'}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-zinc-800/50 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Priorité</p>
                    <p className="text-sm font-mono text-zinc-300">{ad.priority.toString().padStart(2, '0')}</p>
                  </div>
                  <div className="flex justify-end items-end gap-2">
                    <button
                      onClick={() => onDelete(ad.id)}
                      className="p-2 rounded-lg bg-zinc-900/50 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-zinc-800/50"
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Drawer Overlay */}
      {showDrawer && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300"
            onClick={() => setShowDrawer(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#09090b] border-l border-zinc-800 z-[101] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Nouvelle Publicité</h2>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1 font-medium">Configuration de campagne</p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-10 h-10 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <form id="create-ad-form" onSubmit={onCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Type de Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['banner', 'popup', 'splash'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`py-3 text-[10px] font-bold uppercase tracking-widest border rounded-xl transition-all ${type === t
                          ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Titre de la Campagne</label>
                  <input
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Offre Flash Mars"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Priorité (0-99)</label>
                    <input
                      type="number"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      value={priority}
                      onChange={(e) => setPriority(parseInt(e.target.value || '0', 10))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Visibilité</label>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest border rounded-xl transition-all ${isActive
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                    >
                      {isActive ? 'Actif' : 'Inactif'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">URL de Destination</label>
                  <input
                    list="frontend-links"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://mossombi.com/promo"
                  />
                  <datalist id="frontend-links">
                    {linkOptions.map((href) => (
                      <option key={href} value={href} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Villes cibles</label>
                  <input
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
                    value={targetCitiesText}
                    onChange={(e) => setTargetCitiesText(e.target.value)}
                    placeholder="ex: Brazzaville, Pointe-Noire"
                  />
                  <p className="text-[10px] text-zinc-600">Sépare par virgules. Laisser vide = toutes villes.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Visuel Publicitaire</label>
                  <div className="relative group cursor-pointer">
                    <input
                      required={!previewUrl}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    />
                    <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group-hover:border-zinc-600 bg-zinc-900/30">
                      {previewUrl ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-zinc-800">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Changer l&apos;image</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-3 text-zinc-600 text-xl border border-zinc-800">
                            ↥
                          </div>
                          <p className="text-xs text-zinc-400 font-medium">Glissez un fichier ou cliquez ici</p>
                          <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-tighter">PNG, JPG, WebP max 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <span>⚠</span> {error}
                  </div>
                )}
              </form>
            </div>

            <div className="p-8 border-t border-zinc-800/50 bg-zinc-900/20">
              <button
                form="create-ad-form"
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-4 rounded-xl transition-all shadow-[0_0_25px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? 'Initialisation...' : 'Confirmer la Création'}
                {!creating && <span>→</span>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
