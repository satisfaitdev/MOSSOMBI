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
  MapPin,
  X,
  ArrowLeft,
  Navigation
} from "lucide-react";
import MapDrawer from "@/components/MapDrawer";

const NeighborhoodTagInput = ({ 
  neighborhoods, 
  onUpdate 
}: { 
  neighborhoods: string[], 
  onUpdate: (tags: string[]) => void 
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = inputValue.trim().replace(/,$/, "");
      if (tag && !neighborhoods.includes(tag)) {
        onUpdate([...neighborhoods, tag]);
        setInputValue("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdate(neighborhoods.filter(t => t !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-zinc-900/50 border border-[#27272a] rounded-xl focus-within:border-emerald-500/50 transition-all">
        {neighborhoods.map(tag => (
          <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium">
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-emerald-300 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ajouter un quartier... (Entrée)"
          className="flex-1 bg-transparent border-none outline-none text-xs text-white min-w-[120px] py-1"
        />
      </div>
    </div>
  );
};

interface DeliveryRates {
  label: string;
  price: number;
  unit: string;
  time: string;
  time_unit: string;
  fixed_price?: number;
  price_per_kg?: number;
  threshold_weight?: number;
}

interface ZoneConfig {
  neighborhoods: string[];
  multiplier: number;
  fee: number;
  boundary?: number[][]; // [[lng, lat], ...]
}

interface CityConfig {
  zones: Record<string, ZoneConfig>;
  methods?: Record<string, DeliveryRates>;
}

interface OriginConfig {
  methods: Record<string, DeliveryRates>;
}

interface InternationalSectionConfig {
  enabled: boolean;
  origins: Record<string, OriginConfig>;
}

interface SectionConfig {
  enabled: boolean;
  methods: Record<string, DeliveryRates>;
  cities?: Record<string, CityConfig>;
}

interface CountryConfig {
  International: InternationalSectionConfig;
  Local: SectionConfig;
}

type LogisticsMatrix = Record<string, CountryConfig>;

export default function LogisticsPricingPage() {
  const [matrix, setMatrix] = useState<LogisticsMatrix>({});
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedOrigin, setSelectedOrigin] = useState<string>("");
  const [selectedLocalMethod, setSelectedLocalMethod] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string>("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'intl' | 'local' | 'cities'>('intl');
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [showMap, setShowMap] = useState(false);

  const API_BASE = "/api/platform/logistics-settings";

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      const json = await res.json();
      if (json.success) {
        const rawData = json.data || {};
        const migratedData: LogisticsMatrix = {};
        
        Object.entries(rawData).forEach(([country, config]: [string, any]) => {
          let intl = config.International;
          if (!intl) {
            intl = { enabled: true, origins: { "Par défaut": { methods: {} } } };
          } else if (intl.methods && !intl.origins) {
            intl = { 
              enabled: intl.enabled ?? true, 
              origins: { "Par défaut": { methods: intl.methods } } 
            };
          } else if (!intl.origins) {
            intl = { enabled: true, origins: { "Par défaut": { methods: config.International } } };
          }

          migratedData[country] = {
            International: intl,
            Local: config.Local?.methods ? config.Local : { enabled: true, methods: config.Local || {} }
          };
        });

        setMatrix(migratedData);
      } else {
        setError(json.error || "Impossible de charger les tarifs logistiques.");
      }
    } catch (err) {
      setError("Erreur réseau lors du chargement des tarifs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  const handlePriceChange = (origin: 'International' | 'Local', methodId: string, field: keyof DeliveryRates, value: any, originCountry?: string) => {
    if (!selectedCountry) return;
    
    const numericFields: (keyof DeliveryRates)[] = ['price', 'fixed_price', 'price_per_kg', 'threshold_weight'];
    const finalValue = numericFields.includes(field) ? parseFloat(value) || 0 : value;

    setMatrix(prev => {
      const newMatrix = { ...prev };
      const countryConfig = { ...newMatrix[selectedCountry] };
      
      if (origin === 'Local') {
        countryConfig.Local = {
          ...countryConfig.Local,
          methods: {
            ...countryConfig.Local.methods,
            [methodId]: { ...countryConfig.Local.methods[methodId], [field]: finalValue }
          }
        };
      } else {
        const originKey = originCountry || "Par défaut";
        const intl = { ...countryConfig.International };
        intl.origins = { ...intl.origins };
        const originData = { ...intl.origins[originKey] };
        originData.methods = {
          ...originData.methods,
          [methodId]: { ...originData.methods[methodId], [field]: finalValue }
        };
        intl.origins[originKey] = originData;
        countryConfig.International = intl;
      }
      
      newMatrix[selectedCountry] = countryConfig;
      return newMatrix;
    });
  };

  const addCity = () => {
    if (!selectedCountry) return;
    const name = prompt("Nom de la ville (ex: Cotonou, Lomé, Brazzaville)");
    if (!name) return;

    setMatrix(prev => {
      const newMatrix = { ...prev };
      const local = { ...newMatrix[selectedCountry].Local };
      local.cities = { 
        ...(local.cities || {}), 
        [name]: { zones: { "Zone Standard": { neighborhoods: [], multiplier: 1.0, fee: 0 } } } 
      };
      newMatrix[selectedCountry] = { ...newMatrix[selectedCountry], Local: local };
      return newMatrix;
    });
    setSelectedCity(name);
  };

  const removeCity = (cityName: string) => {
    if (!selectedCountry || !confirm(`Supprimer la ville ${cityName} et toutes ses zones ?`)) return;
    setMatrix(prev => {
      const newMatrix = { ...prev };
      const local = { ...newMatrix[selectedCountry].Local };
      const newCities = { ...(local.cities || {}) };
      delete newCities[cityName];
      local.cities = newCities;
      newMatrix[selectedCountry] = { ...newMatrix[selectedCountry], Local: local };
      return newMatrix;
    });
    if (selectedCity === cityName) setSelectedCity("");
  };

  const addZone = (cityName: string) => {
    if (!selectedCountry) return;
    const name = prompt("Nom de la zone (ex: Zone A, Banlieue)");
    if (!name) return;

    setMatrix(prev => {
      const newMatrix = { ...prev };
      const local = { ...newMatrix[selectedCountry].Local };
      if (local.cities && local.cities[cityName]) {
        local.cities[cityName].zones = {
          ...local.cities[cityName].zones,
          [name]: { neighborhoods: [], multiplier: 1.0, fee: 0 }
        };
      }
      newMatrix[selectedCountry] = { ...newMatrix[selectedCountry], Local: local };
      return newMatrix;
    });
    setSelectedZone(name);
  };

  const removeZone = (cityName: string, zoneName: string) => {
    if (!selectedCountry || !confirm(`Supprimer la zone ${zoneName} ?`)) return;
    setMatrix(prev => {
      const newMatrix = { ...prev };
      const local = { ...newMatrix[selectedCountry].Local };
      if (local.cities && local.cities[cityName]) {
        const newZones = { ...local.cities[cityName].zones };
        delete newZones[zoneName];
        local.cities[cityName].zones = newZones;
      }
      newMatrix[selectedCountry] = { ...newMatrix[selectedCountry], Local: local };
      return newMatrix;
    });
    if (selectedZone === zoneName) setSelectedZone("");
  };

  const updateZone = (cityName: string, zoneName: string, field: keyof ZoneConfig, value: any) => {
    setMatrix(prev => {
      const newMatrix = { ...prev };
      const local = { ...newMatrix[selectedCountry].Local };
      if (local.cities && local.cities[cityName] && local.cities[cityName].zones[zoneName]) {
        local.cities[cityName].zones[zoneName] = {
          ...local.cities[cityName].zones[zoneName],
          [field]: value
        };
      }
      newMatrix[selectedCountry] = { ...newMatrix[selectedCountry], Local: local };
      return newMatrix;
    });
  };

  const addMethod = (originName: string) => {
    if (!selectedCountry) return;
    const type = confirm("Est-ce un transport par AVION ? (Annuler pour Maritime)") ? 'avion' : 'maritime';
    const label = prompt(`Nom de la méthode (ex: ${type === 'avion' ? 'Avion Cargo' : 'Fret Maritime'})`);
    if (!label) return;

    const id = `intl_${type}_${Date.now()}`;

    setMatrix(prev => {
      const newMatrix = { ...prev };
      const intl = { ...newMatrix[selectedCountry].International };
      const originData = { ...intl.origins[originName] };
      originData.methods = {
        ...originData.methods,
        [id]: { 
          label, 
          price: type === 'avion' ? 10000 : 450000, 
          unit: type === 'avion' ? "kg" : "cbm", 
          time: "10-15", 
          time_unit: "jours" 
        }
      };
      intl.origins[originName] = originData;
      newMatrix[selectedCountry] = { ...newMatrix[selectedCountry], International: intl };
      return newMatrix;
    });
  };

  const removeMethod = (originName: string, methodId: string) => {
    if (!selectedCountry || !confirm("Supprimer cette méthode de livraison ?")) return;
    setMatrix(prev => {
      const newMatrix = { ...prev };
      const intl = { ...newMatrix[selectedCountry].International };
      const originData = { ...intl.origins[originName] };
      const newMethods = { ...originData.methods };
      delete newMethods[methodId];
      originData.methods = newMethods;
      intl.origins[originName] = originData;
      newMatrix[selectedCountry] = { ...newMatrix[selectedCountry], International: intl };
      return newMatrix;
    });
  };

  const addOrigin = () => {
    if (!selectedCountry) return;
    const name = prompt("Nom du pays d'origine (ex: Chine, France, Dubaï)");
    if (!name || matrix[selectedCountry].International.origins[name]) return;

    setMatrix(prev => {
      const newMatrix = { ...prev };
      const intl = { ...newMatrix[selectedCountry].International };
      intl.origins = { 
        ...intl.origins, 
        [name]: {
          methods: {
            intl_avion_express: { label: "Avion Express", price: 15000, unit: "kg", time: "3-5", time_unit: "jours" },
            intl_avion_normal: { label: "Avion Normal", price: 10000, unit: "kg", time: "7-12", time_unit: "jours" },
            intl_maritime: { label: "Maritime", price: 450000, unit: "cbm", time: "30-45", time_unit: "jours" }
          }
        } 
      };
      newMatrix[selectedCountry] = { ...newMatrix[selectedCountry], International: intl };
      return newMatrix;
    });
    setSelectedOrigin(name);
  };

  const removeOrigin = (originName: string) => {
    if (!selectedCountry || !confirm(`Supprimer l'origine ${originName} ?`)) return;
    setMatrix(prev => {
      const newMatrix = { ...prev };
      const intl = { ...newMatrix[selectedCountry].International };
      const newOrigins = { ...intl.origins };
      delete newOrigins[originName];
      intl.origins = newOrigins;
      newMatrix[selectedCountry] = { ...newMatrix[selectedCountry], International: intl };
      return newMatrix;
    });
    if (selectedOrigin === originName) setSelectedOrigin("");
  };

  const toggleSection = (origin: 'International' | 'Local') => {
    if (!selectedCountry) return;
    setMatrix(prev => ({
      ...prev,
      [selectedCountry]: {
        ...prev[selectedCountry],
        [origin]: {
          ...prev[selectedCountry][origin],
          enabled: !prev[selectedCountry][origin].enabled
        }
      }
    }));
  };

  const addCountry = () => {
    const name = prompt("Entrez le nom du pays (ex: Togo, France, etc.)");
    if (!name || matrix[name]) return;

    const defaultConfig: CountryConfig = {
      International: {
        enabled: true,
        origins: {
          "Chine": {
            methods: {
              intl_avion_express: { label: "Avion Express", price: 15000, unit: "kg", time: "3-5", time_unit: "jours" },
              intl_avion_normal: { label: "Avion Normal", price: 10000, unit: "kg", time: "7-12", time_unit: "jours" },
              intl_maritime: { label: "Maritime", price: 450000, unit: "cbm", time: "30-45", time_unit: "jours" }
            }
          }
        }
      },
      Local: {
        enabled: true,
        methods: {
          local_express: { 
            label: "Express", 
            price: 2500, 
            fixed_price: 2500,
            price_per_kg: 250,
            threshold_weight: 10,
            unit: "course", 
            time: "1-3", 
            time_unit: "heures" 
          },
          local_normal: { 
            label: "Normal", 
            price: 1000, 
            fixed_price: 1000,
            price_per_kg: 100,
            threshold_weight: 10,
            unit: "course", 
            time: "24", 
            time_unit: "heures" 
          }
        }
      }
    };

    setMatrix(prev => ({ ...prev, [name]: defaultConfig }));
    setSelectedCountry(name);
    setView('edit');
  };

  const removeCountry = (name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer les tarifs pour le pays : ${name} ?`)) return;
    const newMatrix = { ...matrix };
    delete newMatrix[name];
    setMatrix(newMatrix);
    if (selectedCountry === name) {
      setSelectedCountry("");
      setView('list');
    }
  };

  const resetSubLevels = () => {
     setSelectedOrigin("");
     setSelectedLocalMethod("");
     setSelectedCity("");
     setSelectedZone("");
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
          {view === 'edit' && (
            <button 
              onClick={() => { setView('list'); resetSubLevels(); }}
              className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-medium rounded-xl transition-all border border-zinc-800 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à la liste
            </button>
          )}
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
          <p className="font-medium">Réglages mis à jour !</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {view === 'list' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {Object.keys(matrix).length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl">
              <Globe className="w-12 h-12 text-zinc-800 mb-4" />
              <p className="text-zinc-600">Aucun pays configuré.</p>
            </div>
          ) : (
            Object.keys(matrix).sort().map(country => (
              <div key={country} className="group glass-card rounded-3xl p-6 border border-[#27272a] hover:border-blue-500/30 transition-all space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all"><MapPin className="w-6 h-6" /></div>
                    <div><h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-all">{country}</h3><p className="text-xs text-zinc-500 uppercase font-bold">Configuré</p></div>
                  </div>
                  <button onClick={() => removeCountry(country)} className="p-2 text-zinc-700 hover:text-red-400 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[10px] uppercase font-black text-zinc-600">
                   <div className="flex flex-col gap-1"><span>Import</span><span className={matrix[country].International.enabled ? "text-blue-400" : "text-zinc-800"}>{matrix[country].International.enabled ? "Activé" : "Désactivé"}</span></div>
                   <div className="flex flex-col gap-1"><span>Local</span><span className={matrix[country].Local.enabled ? "text-emerald-400" : "text-zinc-800"}>{matrix[country].Local.enabled ? "Activé" : "Désactivé"}</span></div>
                </div>
                <button onClick={() => { setSelectedCountry(country); setView('edit'); }} className="w-full py-4 bg-zinc-800 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"><Settings className="w-4 h-4" />Modifier</button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-4 border-b border-[#27272a] pb-6">
             <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center"><MapPin className="w-6 h-6" /></div>
             <div><h2 className="text-2xl font-bold text-white">{selectedCountry}</h2><div className="flex gap-2 mt-1">{matrix[selectedCountry].International.enabled && <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase">International</span>}{matrix[selectedCountry].Local.enabled && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">National</span>}</div></div>
          </div>

          <div className="flex p-1 bg-zinc-900/50 border border-[#27272a] rounded-2xl w-full max-w-2xl mx-auto mb-8">
            <button onClick={() => { setActiveTab('intl'); resetSubLevels(); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'intl' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}><Plane className="w-4 h-4" /> Importations</button>
            <button onClick={() => { setActiveTab('local'); resetSubLevels(); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'local' ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}><Truck className="w-4 h-4" /> Tarifs Nationaux</button>
            <button onClick={() => { setActiveTab('cities'); resetSubLevels(); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'cities' ? "bg-amber-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}><MapPin className="w-4 h-4" /> Villes & Zones</button>
          </div>

          <div className="space-y-8">
            {/* TABS: INTERNATIONAL */}
            {activeTab === 'intl' && (
              <div className="glass-card rounded-2xl p-6 border border-[#27272a] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
                  <div className="flex items-center gap-3">
                    {selectedOrigin && <button onClick={() => setSelectedOrigin("")} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl border border-zinc-700 mr-2 transition-all"><ArrowLeft className="w-4 h-4" /></button>}
                    <div className={`p-2 rounded-lg ${currentCountryData!.International.enabled ? "bg-blue-500/10" : "bg-zinc-800"}`}><Plane className={`w-6 h-6 ${currentCountryData!.International.enabled ? "text-blue-400" : "text-zinc-500"}`} /></div>
                    <div><h2 className="text-lg font-bold text-white">{selectedOrigin ? `Détails : ${selectedOrigin}` : "Origines d'Importation"}</h2><p className="text-xs text-zinc-500">Flux vers {selectedCountry}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!selectedOrigin && <button onClick={addOrigin} className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-1.5 transition-all"><Plus className="w-3.5 h-3.5" /> Ajouter origine</button>}
                    <button onClick={() => toggleSection('International')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${currentCountryData!.International.enabled ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-zinc-900 border-zinc-800 text-zinc-600"}`}>{currentCountryData!.International.enabled ? 'Activé' : 'Désactivé'}</button>
                  </div>
                </div>
                <div className={`space-y-8 transition-all ${currentCountryData!.International.enabled ? "opacity-100" : "opacity-30 pointer-events-none grayscale"}`}>
                  {!selectedOrigin ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {Object.entries(currentCountryData!.International.origins).map(([originName, originConfig]) => (
                        <div key={originName} className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 hover:border-blue-500/30 transition-all space-y-4">
                           <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Globe className="w-4 h-4 text-blue-400" /><span className="font-bold text-white">{originName}</span></div><button onClick={() => removeOrigin(originName)} className="p-1.5 text-zinc-700 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button></div>
                           <button onClick={() => setSelectedOrigin(originName)} className="w-full py-2.5 bg-zinc-800 hover:bg-blue-600 text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all">Modifier</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                       <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Méthodes de transport</h3><button onClick={() => addMethod(selectedOrigin)} className="text-[11px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg border border-blue-500/20 flex items-center gap-1.5 transition-all"><Plus className="w-3 h-3" /> Ajouter</button></div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(currentCountryData!.International.origins[selectedOrigin].methods).map(([id, data]) => (
                            <div key={id} className="p-4 bg-black/20 rounded-2xl border border-zinc-800/50 space-y-4">
                              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{id.includes('avion') ? <Plane className="w-4 h-4 text-blue-400" /> : <Ship className="w-4 h-4 text-cyan-400" />}{data.label}</span><button onClick={() => removeMethod(selectedOrigin, id)} className="p-1.5 text-zinc-700 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button></div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5"><span className="text-[10px] text-zinc-600 font-bold uppercase">Tarif</span><div className="relative"><input type="number" value={data.price} onChange={(e) => handlePriceChange('International', id, 'price', e.target.value, selectedOrigin)} className="w-full bg-zinc-900 border border-[#27272a] rounded-xl px-3 py-2 text-white text-sm pr-10 focus:outline-none focus:border-blue-500/50" /><div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold uppercase">/{data.unit}</div></div></div>
                                <div className="space-y-1.5"><span className="text-[10px] text-zinc-600 font-bold uppercase">Temps</span><div className="relative"><input type="text" value={data.time} onChange={(e) => handlePriceChange('International', id, 'time', e.target.value, selectedOrigin)} className="w-full bg-zinc-900 border border-[#27272a] rounded-xl px-3 py-2 text-white text-sm pr-12 focus:outline-none focus:border-blue-500/50" /><div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold uppercase">{data.time_unit}</div></div></div>
                              </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TABS: LOCAL (NATIONAL) */}
            {activeTab === 'local' && (
              <div className="glass-card rounded-2xl p-6 border border-[#27272a] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
                  <div className="flex items-center gap-3">
                    {selectedLocalMethod && <button onClick={() => setSelectedLocalMethod("")} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl border border-zinc-700 mr-2 transition-all"><ArrowLeft className="w-4 h-4" /></button>}
                    <div className={`p-2 rounded-lg ${currentCountryData!.Local.enabled ? "bg-emerald-500/10" : "bg-zinc-800"}`}><Truck className={`w-6 h-6 ${currentCountryData!.Local.enabled ? "text-emerald-400" : "text-zinc-500"}`} /></div>
                    <div><h2 className="text-lg font-bold text-white">{selectedLocalMethod ? `Détails : ${currentCountryData!.Local.methods[selectedLocalMethod].label}` : "Tarifs Nationaux"}</h2><p className="text-xs text-zinc-500">Par défaut pour {selectedCountry}</p></div>
                  </div>
                  <button onClick={() => toggleSection('Local')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${currentCountryData!.Local.enabled ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-600"}`}>{currentCountryData!.Local.enabled ? 'Activé' : 'Désactivé'}</button>
                </div>
                <div className={`space-y-8 transition-all ${currentCountryData!.Local.enabled ? "opacity-100" : "opacity-30 pointer-events-none grayscale"}`}>
                   {!selectedLocalMethod ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         {Object.entries(currentCountryData!.Local.methods).map(([id, data]) => (
                            <div key={id} className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all space-y-4">
                               <div className="flex items-center gap-3">{id.includes('express') ? <Zap className="w-5 h-5 text-amber-400" /> : <Truck className="w-5 h-5 text-emerald-400" />}<span className="font-bold text-white">{data.label}</span></div>
                               <button onClick={() => setSelectedLocalMethod(id)} className="w-full py-2.5 bg-zinc-800 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all">Modifier</button>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-500 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/20 rounded-3xl border border-zinc-800/50">
                         <div className="space-y-1.5"><span className="text-[10px] text-zinc-500 uppercase font-bold px-1">Prix Fixe (&lt; seuil)</span><input type="number" value={currentCountryData!.Local.methods[selectedLocalMethod].fixed_price ?? currentCountryData!.Local.methods[selectedLocalMethod].price} onChange={(e) => handlePriceChange('Local', selectedLocalMethod, 'fixed_price', e.target.value)} className="w-full bg-zinc-900 border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50" /></div>
                         <div className="space-y-1.5"><span className="text-[10px] text-zinc-500 uppercase font-bold px-1">Seuil Poids (KG)</span><input type="number" value={currentCountryData!.Local.methods[selectedLocalMethod].threshold_weight ?? 10} onChange={(e) => handlePriceChange('Local', selectedLocalMethod, 'threshold_weight', e.target.value)} className="w-full bg-zinc-900 border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50" /></div>
                         <div className="space-y-1.5"><span className="text-[10px] text-zinc-500 uppercase font-bold px-1">Prix / KG (&ge; seuil)</span><input type="number" value={currentCountryData!.Local.methods[selectedLocalMethod].price_per_kg ?? (currentCountryData!.Local.methods[selectedLocalMethod].price / 10)} onChange={(e) => handlePriceChange('Local', selectedLocalMethod, 'price_per_kg', e.target.value)} className="w-full bg-zinc-900 border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50" /></div>
                         <div className="space-y-1.5"><span className="text-[10px] text-zinc-500 uppercase font-bold px-1">Délai estimé</span><div className="flex gap-2"><input type="text" value={currentCountryData!.Local.methods[selectedLocalMethod].time} onChange={(e) => handlePriceChange('Local', selectedLocalMethod, 'time', e.target.value)} className="w-1/2 bg-zinc-900 border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50" /><input type="text" value={currentCountryData!.Local.methods[selectedLocalMethod].time_unit} onChange={(e) => handlePriceChange('Local', selectedLocalMethod, 'time_unit', e.target.value)} className="w-1/2 bg-zinc-900 border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50" /></div></div>
                      </div>
                   )}
                </div>
              </div>
            )}

            {/* TABS: CITIES & ZONES */}
            {activeTab === 'cities' && (
              <div className="glass-card rounded-2xl p-6 border border-[#27272a] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
                  <div className="flex items-center gap-3">
                    {(selectedCity || selectedZone) && <button onClick={() => { if (selectedZone) setSelectedZone(""); else setSelectedCity(""); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl border border-zinc-700 mr-2 transition-all"><ArrowLeft className="w-4 h-4" /></button>}
                    <div className="p-2 rounded-lg bg-amber-500/10"><MapPin className="w-6 h-6 text-amber-400" /></div>
                    <div><h2 className="text-lg font-bold text-white">{selectedZone ? `Zone : ${selectedZone}` : selectedCity ? `Ville : ${selectedCity}` : "Villes & Quartiers"}</h2><p className="text-xs text-zinc-500">Ajustements géographiques</p></div>
                  </div>
                  {!selectedCity && !selectedZone && <button onClick={addCity} className="h-9 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"><Plus className="w-4 h-4" /> Ajouter une ville</button>}
                  {selectedCity && !selectedZone && <button onClick={() => addZone(selectedCity)} className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"><Plus className="w-4 h-4" /> Nouvelle Zone</button>}
                </div>
                
                <div className="space-y-8">
                  {!selectedCity ? (
                    /* LISTE DES VILLES */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       {Object.entries(currentCountryData!.Local.cities || {}).length === 0 ? (
                          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl"><MapPin className="w-10 h-10 text-zinc-800 mb-3" /><p className="text-zinc-600 text-sm">Aucune ville configurée.</p></div>
                       ) : (
                          Object.keys(currentCountryData!.Local.cities || {}).sort().map(city => (
                            <div key={city} className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 hover:border-amber-500/30 transition-all space-y-4">
                               <div className="flex items-center justify-between"><div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-amber-400" /><span className="font-bold text-white uppercase tracking-wider">{city}</span></div><button onClick={() => removeCity(city)} className="p-1.5 text-zinc-700 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button></div>
                               <button onClick={() => setSelectedCity(city)} className="w-full py-2.5 bg-zinc-800 hover:bg-amber-600 text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all">Gérer les zones</button>
                            </div>
                          ))
                       )}
                    </div>
                  ) : !selectedZone ? (
                    /* LISTE DES ZONES D'UNE VILLE */
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                       {Object.keys(currentCountryData!.Local.cities![selectedCity].zones).map(zone => (
                          <div key={zone} className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all space-y-4">
                             <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Navigation className="w-4 h-4 text-emerald-400" /><span className="font-bold text-white uppercase tracking-widest text-[11px]">{zone}</span></div><button onClick={() => removeZone(selectedCity, zone)} className="p-1.5 text-zinc-700 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button></div>
                             <button onClick={() => setSelectedZone(zone)} className="w-full py-2.5 bg-zinc-800 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all">Configurer la zone</button>
                          </div>
                       ))}
                    </div>
                  ) : (
                    /* DÉTAILS D'UNE ZONE SPÉCIFIQUE */
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6 p-6 bg-black/20 rounded-3xl border border-zinc-800/50">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5"><span className="text-[10px] text-zinc-500 uppercase font-bold px-1">Multiplicateur de tarif</span><div className="relative"><input type="number" step="0.1" value={currentCountryData!.Local.cities![selectedCity].zones[selectedZone].multiplier} onChange={(e) => updateZone(selectedCity, selectedZone, 'multiplier', parseFloat(e.target.value) || 1)} className="w-full bg-zinc-900 border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none pr-8" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-bold">x</span></div></div>
                          <div className="space-y-1.5"><span className="text-[10px] text-zinc-500 uppercase font-bold px-1">Frais fixes supplémentaires</span><div className="relative"><input type="number" value={currentCountryData!.Local.cities![selectedCity].zones[selectedZone].fee} onChange={(e) => updateZone(selectedCity, selectedZone, 'fee', parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none pr-8" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-bold">F</span></div></div>
                       </div>
                       <div className="space-y-2">
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] text-zinc-500 uppercase font-bold px-1 text-emerald-400">Quartiers & Secteurs inclus dans cette zone</span>
                           <button 
                             onClick={() => setShowMap(true)}
                             className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition-all"
                           >
                             <Navigation className="w-3 h-3" />
                             {currentCountryData!.Local.cities![selectedCity].zones[selectedZone].boundary ? "Modifier le tracé" : "Tracer sur la carte"}
                           </button>
                         </div>
                         <NeighborhoodTagInput neighborhoods={currentCountryData!.Local.cities![selectedCity].zones[selectedZone].neighborhoods} onUpdate={(tags) => updateZone(selectedCity, selectedZone, 'neighborhoods', tags)} />
                         {currentCountryData!.Local.cities![selectedCity].zones[selectedZone].boundary && (
                           <p className="text-[10px] text-zinc-600 italic px-1 mt-1 flex items-center gap-1">
                             <CheckCircle2 className="w-3 h-3" /> Périmètre géographique défini ({currentCountryData!.Local.cities![selectedCity].zones[selectedZone].boundary.length} points)
                           </p>
                         )}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {showMap && selectedCity && selectedZone && (
              <MapDrawer 
                cityName={selectedCity}
                initialBoundary={currentCountryData!.Local.cities![selectedCity].zones[selectedZone].boundary}
                onClose={() => setShowMap(false)}
                onSave={(boundary) => {
                  updateZone(selectedCity, selectedZone, 'boundary', boundary);
                  setShowMap(false);
                }}
                onDetectNames={(names) => {
                  const currentNames = currentCountryData!.Local.cities![selectedCity].zones[selectedZone].neighborhoods || [];
                  const combined = [...currentNames, ...names];
                  const uniqueNames = combined.filter((name, index) => combined.indexOf(name) === index);
                  updateZone(selectedCity, selectedZone, 'neighborhoods', uniqueNames);
                }}
              />
            )}
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg shrink-0"><CheckCircle2 className="w-5 h-5 text-blue-400" /></div>
              <div className="space-y-1"><p className="text-sm font-bold text-white">Logique de facturation dynamique</p><p className="text-xs text-zinc-400 leading-relaxed">Le système priorise les ajustements par **Ville** et **Zone** s'ils existent, sinon les tarifs nationaux par défaut s'appliquent.</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
