"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  Truck, 
  Plane, 
  Ship, 
  Zap, 
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Globe,
  MapPin
} from "lucide-react";

interface DeliveryRates {
  label: string;
  price: number;
  unit: string;
  time: string;
  time_unit: string;
}

interface CountryConfig {
  International: Record<string, DeliveryRates>;
  Local: Record<string, DeliveryRates>;
}

type LogisticsMatrix = Record<string, CountryConfig>;

export default function LogisticsPricingPage() {
  const [matrix, setMatrix] = useState<LogisticsMatrix>({});
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

  // Helper for auth token from cookie
  const getAuthToken = () => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; admin_access_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/monitoring/logistics-settings`);
      const json = await res.json();
      if (json.success) {
        setMatrix(json.data || {});
        const countries = Object.keys(json.data || {});
        if (countries.length > 0 && !selectedCountry) {
          setSelectedCountry(countries[0]);
        }
      }
    } catch (err) {
      setError("Impossible de charger les tarifs logistiques.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/monitoring/logistics-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(matrix)
      });
      
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(json.error || "Erreur lors de la sauvegarde.");
      }
    } catch (err) {
      setError("Erreur réseau lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (origin: 'International' | 'Local', methodId: string, field: keyof DeliveryRates, value: any) => {
    if (!selectedCountry) return;
    
    setMatrix(prev => ({
      ...prev,
      [selectedCountry]: {
        ...prev[selectedCountry],
        [origin]: {
          ...prev[selectedCountry][origin],
          [methodId]: {
            ...prev[selectedCountry][origin][methodId],
            [field]: field === 'price' ? parseInt(value) || 0 : value
          }
        }
      }
    }));
  };

  const addCountry = () => {
    const name = prompt("Entrez le nom du pays (ex: Togo, France, etc.)");
    if (!name || matrix[name]) return;

    const defaultConfig: CountryConfig = {
      International: {
        intl_avion_express: { label: "Avion Express", price: 15000, unit: "kg", time: "3-5", time_unit: "jours" },
        intl_avion_normal: { label: "Avion Normal", price: 10000, unit: "kg", time: "7-12", time_unit: "jours" },
        intl_maritime: { label: "Maritime", price: 450000, unit: "cbm", time: "30-45", time_unit: "jours" }
      },
      Local: {
        local_express: { label: "Express", price: 2500, unit: "course", time: "1-3", time_unit: "heures" },
        local_normal: { label: "Normal", price: 1000, unit: "course", time: "24", time_unit: "heures" }
      }
    };

    setMatrix(prev => ({ ...prev, [name]: defaultConfig }));
    setSelectedCountry(name);
  };

  const removeCountry = (name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer les tarifs pour le pays : ${name} ?`)) return;
    const newMatrix = { ...matrix };
    delete newMatrix[name];
    setMatrix(newMatrix);
    if (selectedCountry === name) {
      setSelectedCountry(Object.keys(newMatrix)[0] || "");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium">Chargement des configurations logistiques...</p>
      </div>
    );
  }

  const currentCountryData = selectedCountry ? matrix[selectedCountry] : null;

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Tarification <span className="text-blue-400">Logistique</span></h1>
          </div>
          <p className="text-zinc-400">Gérez les tarifs dynamiques par pays pour l'ensemble du réseau Mossombi.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={addCountry}
            className="h-10 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all flex items-center gap-2 border border-[#27272a]"
          >
            <Plus className="w-4 h-4" /> Ajouter un pays
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : 'Enregistrer tout'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-medium">Réglages mis à jour ! Les changements sont appliqués instantanément sur l'application mobile.</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Pays */}
        <div className="w-full lg:w-64 space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 mb-4">Pays configurés</h3>
          {Object.keys(matrix).length === 0 ? (
            <p className="text-sm text-zinc-600 px-2">Aucun pays configuré.</p>
          ) : (
            Object.keys(matrix).sort().map(country => (
              <div 
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                  selectedCountry === country 
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-sm" 
                    : "bg-zinc-900/50 border-transparent text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className={`w-4 h-4 ${selectedCountry === country ? "text-blue-400" : "text-zinc-600"}`} />
                  <span className="font-medium">{country}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeCountry(country); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Formulaire de tarification */}
        <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          {selectedCountry && currentCountryData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Local Delivery */}
                <div className="glass-card rounded-2xl p-6 border border-[#27272a] space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-3 border-b border-[#27272a] pb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Truck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Logistique Locale ({selectedCountry})</h2>
                      <p className="text-xs text-zinc-500">Livraison de proximité</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {Object.entries(currentCountryData.Local).map(([id, data]) => (
                      <div key={id} className="space-y-3">
                        <label className="flex items-center justify-between text-sm font-semibold text-zinc-300">
                          <span className="flex items-center gap-2">
                            {id.includes('express') ? <Zap className="w-4 h-4 text-amber-400" /> : null}
                            {data.label}
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <input 
                              type="number" 
                              value={data.price}
                              onChange={(e) => handlePriceChange('Local', id, 'price', e.target.value)}
                              className="w-full bg-zinc-900 border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 pr-12 text-sm"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">F</div>
                          </div>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={data.time}
                              onChange={(e) => handlePriceChange('Local', id, 'time', e.target.value)}
                              placeholder="Délai"
                              className="w-full bg-zinc-900 border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 text-sm"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold uppercase">{data.time_unit}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* International Delivery */}
                <div className="glass-card rounded-2xl p-6 border border-[#27272a] space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-3 border-b border-[#27272a] pb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Plane className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Importations / Transit</h2>
                      <p className="text-xs text-zinc-500">Vers le pays : {selectedCountry}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {Object.entries(currentCountryData.International).map(([id, data]) => (
                      <div key={id} className="space-y-3">
                        <label className="flex items-center justify-between text-sm font-semibold text-zinc-300">
                          <span className="flex items-center gap-2">
                            {id.includes('avion') ? <Plane className="w-4 h-4 text-blue-400" /> : <Ship className="w-4 h-4 text-cyan-400" />}
                            {data.label}
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <input 
                              type="number" 
                              value={data.price}
                              onChange={(e) => handlePriceChange('International', id, 'price', e.target.value)}
                              className="w-full bg-zinc-900 border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 pr-12 text-sm"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold uppercase">/{data.unit}</div>
                          </div>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={data.time}
                              onChange={(e) => handlePriceChange('International', id, 'time', e.target.value)}
                              placeholder="Délai"
                              className="w-full bg-zinc-900 border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 text-sm"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold uppercase">{data.time_unit}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              
              {/* Bottom Info */}
              <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-blue-300">Logique de facturation unifiée</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Les prix pour <strong>{selectedCountry}</strong> sont multipliés par le poids (KG) ou volume (CBM) des articles lors du checkout. Assurez-vous que les unités correspondent aux réglages de chaque mode de transport.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[#27272a] rounded-3xl">
              < Globe className="w-12 h-12 text-zinc-800 mb-4" />
              <p className="text-zinc-600">Sélectionnez ou ajoutez un pays pour commencer à configurer ses tarifs.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
