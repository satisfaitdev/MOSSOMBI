"use client";

import { useEffect, useRef, useState } from "react";
import { X, Save, Trash2, MapPin, Search } from "lucide-react";

interface OtherZone {
  name: string;
  boundary?: number[][];
}

interface MapDrawerProps {
  initialBoundary?: number[][];
  cityName: string;
  onSave: (boundary: number[][]) => void;
  onDetectNames?: (names: string[]) => void;
  onClose: () => void;
  otherZones?: OtherZone[];
}

declare global {
  interface Window {
    L: any;
  }
}

export default function MapDrawer({ initialBoundary, cityName, onSave, onDetectNames, onClose, otherZones }: MapDrawerProps) {
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

    let isMounted = true;

    // Try to geocode city name to center map (approximate)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`)
      .then(res => {
        if (!res.ok) throw new Error("Nominatim status: " + res.status);
        return res.json();
      })
      .then(data => {
        if (isMounted && mapRef.current && data && data[0]) {
          map.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 13);
        }
      })
      .catch(err => {
        console.error("Error geocoding city name:", err);
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

    console.log("MapDrawer received otherZones:", otherZones);
    
    // Render other zones in the same city as read-only layers
    if (otherZones && otherZones.length > 0) {
      otherZones.forEach(zone => {
        try {
          if (zone.boundary && zone.boundary.length > 0) {
            const latlngs = zone.boundary
              .map(p => {
                if (p && p.length >= 2) {
                  const lat = parseFloat(p[1] as any);
                  const lng = parseFloat(p[0] as any);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    return [lat, lng];
                  }
                }
                return null;
              })
              .filter((p): p is number[] => p !== null);

            if (latlngs.length > 0) {
              const otherPolygon = L.polygon(latlngs, {
                color: '#3b82f6', // Beautiful blue
                fillColor: '#3b82f6',
                fillOpacity: 0.12,
                weight: 2.5,
                dashArray: '6, 6', // dashed outline to signify it is not the active editable zone
                interactive: true
              }).addTo(map);

              // Add a permanent tooltip or a popup with the zone's name
              otherPolygon.bindTooltip(zone.name, {
                permanent: true,
                direction: 'center',
                className: 'bg-zinc-950/80 border border-blue-500/30 text-blue-400 text-[10px] px-1.5 py-0.5 rounded font-bold'
              });
              
              otherPolygon.bindPopup(`<strong>Zone : ${zone.name}</strong><br/>Zone existante (non modifiable ici)`);
              console.log(`Successfully drew read-only zone: ${zone.name}`, latlngs);
            } else {
              console.warn(`No valid coordinates for zone: ${zone.name}`, zone.boundary);
            }
          }
        } catch (err) {
          console.error(`Failed to draw read-only zone: ${zone.name}`, err);
        }
      });
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
      isMounted = false;
      map.remove();
      mapRef.current = null;
    };
  }, [loaded]);

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
    let names: string[] = [];
    
    // Get the first polygon's coordinates for Overpass poly search
    const latlngs = layers[0].getLatLngs()[0];
    const coords = (Array.isArray(latlngs) ? latlngs : [latlngs]);
    const polyCoords = coords
      .map((ll: any) => `${ll.lat} ${ll.lng}`)
      .join(" ");

    // Calculate center point for fallback
    let sumLat = 0, sumLng = 0;
    coords.forEach((ll: any) => {
      sumLat += ll.lat;
      sumLng += ll.lng;
    });
    const centerLat = sumLat / coords.length;
    const centerLng = sumLng / coords.length;

    // 1. Try Overpass API with AbortController timeout (10 seconds)
    const query = `[out:json][timeout:10];(node(poly:"${polyCoords}")["place"~"suburb|neighbourhood|quarter|locality|village|town|city_block|hamlet"];way(poly:"${polyCoords}")["place"~"suburb|neighbourhood|quarter|locality|village|town|city_block|hamlet"];rel(poly:"${polyCoords}")["place"~"suburb|neighbourhood|quarter|locality|village|town|city_block|hamlet"];);out tags;`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.elements) {
          names = data.elements
            .map((e: any) => e.tags?.name)
            .filter((name: string, index: number, self: string[]) => name && self.indexOf(name) === index);
        }
      } else {
        console.warn(`Overpass API returned non-OK status: ${response.status}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn("Overpass API error or timeout, will fallback to Nominatim reverse geocoding:", error);
    }

    // 2. Fallback: Si Overpass ne trouve rien (ou s'il a planté/timeout),
    // on fait un reverse geocoding Nominatim sur le centre du polygone tracé
    if (names.length === 0) {
      try {
        const revRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${centerLat}&lon=${centerLng}&addressdetails=1`,
          { headers: { "User-Agent": "Mossombi-Admin-Panel" } }
        );
        if (revRes.ok) {
          const revData = await revRes.json();
          if (revData && revData.address) {
            const addr = revData.address;
            const detected = addr.suburb || addr.neighbourhood || addr.quarter || addr.subdivision || addr.locality || addr.city_block || addr.village;
            if (detected) {
              names = [detected];
            }
          }
        }
      } catch (revError) {
        console.error("Nominatim fallback error:", revError);
      }
    }

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
      alert("Aucun quartier nommé n'a été détecté dans cette zone. Vous pouvez le saisir manuellement.");
    }
    
    setIsSearching(false);
  };

  const searchNeighborhood = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // 1. Try searching with the city name suffix
      let response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", " + cityName
        )}&polygon_geojson=1`,
        { headers: { "User-Agent": "Mossombi-Admin-Panel" } }
      );
      let data = [];
      if (response.ok) {
        data = await response.json();
      }

      // 2. Fallback to global search if no results found
      if ((!data || data.length === 0) && searchQuery.toLowerCase() !== cityName.toLowerCase()) {
        response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&polygon_geojson=1`,
          { headers: { "User-Agent": "Mossombi-Admin-Panel" } }
        );
        if (response.ok) {
          data = await response.json();
        }
      }

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
      // Si c'est juste un point (fréquent en Afrique où les contours des quartiers ne sont pas tous dessinés),
      // nous générons un carré par défaut de ~1km autour de ce point pour que l'utilisateur n'ait pas à le tracer manuellement.
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      const d = 0.005; // environ 500m de rayon (1km de côté)
      
      const squareCoords = [
        [lat - d, lon - d],
        [lat - d, lon + d],
        [lat + d, lon + d],
        [lat + d, lon - d]
      ];
      
      const polygon = L.polygon(squareCoords, { 
        color: "#10b981", 
        fillColor: "#10b981", 
        fillOpacity: 0.2 
      });
      
      // On l'ajoute à la couche d'édition pour qu'il soit modifiable
      editableLayersRef.current.addLayer(polygon);
      
      // On centre et zoome sur le polygone
      mapRef.current.setView([lat, lon], 15);
      setSearchResults([]);
      setSearchQuery("");
      
      alert("Ce quartier n'a pas de contour géométrique précis dans OpenStreetMap. Une zone par défaut de 1km x 1km a été créée automatiquement autour de ce point. Vous pouvez l'ajuster en déplaçant ses sommets puis cliquer sur Enregistrer.");
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
              <p className="text-xs text-zinc-500 mt-0.5">
                {otherZones && otherZones.length > 0 
                  ? `Zones existantes visibles (en bleu) : ${otherZones.map(z => z.name).join(', ')}`
                  : "Utilisez les outils à gauche pour dessiner le périmètre."}
              </p>
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
