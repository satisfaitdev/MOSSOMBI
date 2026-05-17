"use client";

import { useEffect, useRef, useState } from "react";
import { X, Save, Trash2, MapPin, Search } from "lucide-react";

interface MapDrawerProps {
  initialBoundary?: number[][];
  cityName: string;
  onSave: (boundary: number[][]) => void;
  onDetectNames?: (names: string[]) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function MapDrawer({ initialBoundary, cityName, onSave, onDetectNames, onClose }: MapDrawerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const drawControlRef = useRef<any>(null);
  const editableLayersRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    // 1. Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("leaflet-draw-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-draw-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet-draw@0.4.14/dist/leaflet.draw.css";
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet JS
    const loadScripts = async () => {
      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      // Load Leaflet Draw plugin
      if (!window.L.Control.Draw) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet-draw@0.4.14/dist/leaflet.draw.js";
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      setLoaded(true);
    };

    loadScripts();
  }, []);

  useEffect(() => {
    if (!loaded || !mapContainerRef.current || mapRef.current) return;

    const L = window.L;

    // Initialize Map
    const map = L.map(mapContainerRef.current).setView([6.37, 2.4], 13); // Default Cotonou
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Try to geocode city name to center map (approximate)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data[0]) {
          map.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 13);
        }
      });

    // Feature group to store editable layers
    const editableLayers = new L.FeatureGroup();
    map.addLayer(editableLayers);
    editableLayersRef.current = editableLayers;

    // Load initial boundary if exists
    if (initialBoundary && initialBoundary.length > 0) {
      const latlngs = initialBoundary.map(p => [p[1], p[0]]); // [lat, lng]
      const polygon = L.polygon(latlngs, { color: '#10b981' });
      editableLayers.addLayer(polygon);
      map.fitBounds(polygon.getBounds());
    }

    const drawOptions = {
      position: 'topleft',
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: { color: '#e11d48', message: 'Intersection interdite' },
          shapeOptions: { color: '#10b981' }
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: editableLayers,
        remove: true
      }
    };

    const drawControl = new L.Control.Draw(drawOptions);
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      editableLayers.clearLayers(); // Allow only one polygon per zone
      editableLayers.addLayer(layer);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loaded, cityName, initialBoundary]);

  const handleSave = () => {
    if (!editableLayersRef.current) return;
    const layers: any[] = Object.values(editableLayersRef.current._layers);
    if (layers.length === 0) {
      alert("Veuillez tracer ou importer une zone avant d'enregistrer.");
      return;
    }

    // Return all polygons as a list of boundaries
    const boundaries = layers.map((layer: any) => {
      const latlngs = layer.getLatLngs()[0];
      return (Array.isArray(latlngs) ? latlngs : [latlngs]).map((ll: any) => [ll.lng, ll.lat]);
    });

    // For now, we take the first one to match existing schema, 
    // but we'll inform the user if we should detect names
    onSave(boundaries[0]); 
  };

  const detectNeighborhoods = async () => {
    if (!editableLayersRef.current) return;
    const layers: any[] = Object.values(editableLayersRef.current._layers);
    if (layers.length === 0) return;

    setIsSearching(true);
    try {
      // Get the first polygon's coordinates for Overpass poly search
      const latlngs = layers[0].getLatLngs()[0];
      const polyCoords = (Array.isArray(latlngs) ? latlngs : [latlngs])
        .map((ll: any) => `${ll.lat} ${ll.lng}`)
        .join(" ");

      const query = `[out:json];(node(poly:"${polyCoords}")["place"~"suburb|neighbourhood|quarter"];way(poly:"${polyCoords}")["place"~"suburb|neighbourhood|quarter"];rel(poly:"${polyCoords}")["place"~"suburb|neighbourhood|quarter"];);out tags;`;
      
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
      });
      const data = await response.json();
      const names = data.elements
        .map((e: any) => e.tags.name)
        .filter((name: string, index: number, self: string[]) => name && self.indexOf(name) === index);

      if (names.length > 0) {
        if (confirm(`Quartiers détectés : ${names.join(", ")}. Voulez-vous les ajouter automatiquement à la liste ?`)) {
          if (onDetectNames) {
            onDetectNames(names);
          } else {
            // Fallback to clipboard if callback not provided
            navigator.clipboard.writeText(names.join(", "));
            alert("Copié dans le presse-papier !");
          }
        }
      } else {
        alert("Aucun quartier nommé n'a été détecté dans cette zone.");
      }
    } catch (error) {
      console.error("Detection error:", error);
      alert("Erreur lors de la détection des quartiers.");
    } finally {
      setIsSearching(false);
    }
  };

  const searchNeighborhood = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", " + cityName
        )}&polygon_geojson=1`,
        { headers: { "User-Agent": "Mossombi-Admin-Panel" } }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const importResult = (result: any) => {
    if (!mapRef.current || !editableLayersRef.current) return;
    const L = window.L;

    if (result.geojson && (result.geojson.type === "Polygon" || result.geojson.type === "MultiPolygon")) {
      // REMOVED clearLayers() to allow multiple imports (additive)
      const layer = L.geoJSON(result.geojson, {
        style: { color: "#10b981", fillColor: "#10b981", fillOpacity: 0.2 }
      });
      
      // Extract coordinates from GeoJSON to the first polygon layer
      layer.eachLayer((l: any) => {
        if (l.getLatLngs) {
          editableLayersRef.current.addLayer(l);
        }
      });

      const bounds = layer.getBounds();
      mapRef.current.fitBounds(bounds);
      setSearchResults([]);
      setSearchQuery("");
    } else {
      // If it's just a point, center on it
      mapRef.current.setView([parseFloat(result.lat), parseFloat(result.lon)], 16);
      alert("Ce résultat n'a pas de contour géométrique précis. Vous pouvez le tracer manuellement à cet endroit.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-[#27272a] rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Tracer la Zone : {cityName}</h2>
              <p className="text-sm text-zinc-500">Utilisez les outils à gauche pour dessiner le périmètre.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-zinc-900 flex flex-col">
          {/* Search Bar Overlay */}
          <div className="absolute top-4 left-14 z-[1000] w-72">
            <div className="bg-zinc-950/90 backdrop-blur-md border border-[#27272a] rounded-2xl overflow-hidden shadow-xl">
              <div className="flex p-2 gap-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchNeighborhood()}
                  placeholder="Rechercher un quartier..."
                  className="flex-1 bg-zinc-900 border-none text-sm text-white focus:ring-0 px-3 py-2 rounded-xl"
                />
                <button 
                  onClick={searchNeighborhood}
                  disabled={isSearching}
                  className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all"
                >
                  {isSearching ? <div className="w-4 h-4 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto border-t border-[#27272a] custom-scrollbar">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => importResult(res)}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-xs text-zinc-300 border-b border-[#27272a]/50 last:border-none group"
                    >
                      <div className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">{res.display_name.split(',')[0]}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{res.display_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20 bg-zinc-950">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-zinc-500 animate-pulse">Chargement de la carte...</p>
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#27272a] flex justify-between items-center bg-zinc-950/50">
          <div className="flex gap-4">
            <button 
              onClick={() => editableLayersRef.current?.clearLayers()}
              className="px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition-all text-sm"
            >
              <Trash2 className="w-4 h-4" /> Effacer tout
            </button>
            <button 
              onClick={detectNeighborhoods}
              disabled={isSearching}
              className="px-4 py-2 text-amber-400 hover:bg-amber-500/10 rounded-xl flex items-center gap-2 transition-all text-sm"
            >
              <MapPin className="w-4 h-4" /> Détecter quartiers
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold rounded-xl border border-zinc-800 transition-all">
              Annuler
            </button>
            <button 
              onClick={handleSave}
              className="px-8 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" /> Appliquer le tracé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
