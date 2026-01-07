import React, { useRef } from 'react';
import { View, TextInput, Pressable, ScrollView, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Search, X, MapPin } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';

interface MapViewProps {
  /** Coordonnées actuelles */
  coords: { lat: number; lng: number };
  /** Callback quand les coordonnées changent */
  onCoordsChange: (coords: { lat: number; lng: number }) => void;
  /** Adresse confirmée */
  address: string;
  /** Callback quand l'adresse change */
  onAddressChange: (address: string) => void;
  /** Query de recherche */
  searchQuery: string;
  /** Callback quand la recherche change */
  onSearchQueryChange: (query: string) => void;
  /** Résultats de recherche */
  searchResults: {
    id: string | number;
    name: string;
    fullAddress: string;
    coords: { lat: number; lng: number };
  }[];
  /** Afficher les résultats de recherche */
  showSearchResults: boolean;
  /** Callback pour afficher/masquer les résultats */
  onShowSearchResultsChange: (show: boolean) => void;
  /** État de chargement de la recherche */
  isSearching?: boolean;
  /** Hauteur de la carte (défaut: 300) */
  mapHeight?: number;
  /** Niveau de zoom (défaut: 17) */
  zoom?: number;
  /** Placeholder pour la recherche */
  searchPlaceholder?: string;
  /** Placeholder pour l'adresse */
  addressPlaceholder?: string;
  /** Label pour l'adresse confirmée */
  addressLabel?: string;
}

/**
 * Composant MapView avec OpenStreetMap
 * 
 * Fonctionnalités:
 * - Carte interactive OpenStreetMap
 * - Marqueur draggable
 * - Recherche d'adresses via Nominatim
 * - Suggestions autocomplétées
 * - Champ d'adresse confirmée
 * 
 * @example
 * ```tsx
 * <MapView
 *   coords={coords}
 *   onCoordsChange={setCoords}
 *   address={address}
 *   onAddressChange={setAddress}
 *   searchQuery={searchQuery}
 *   onSearchQueryChange={setSearchQuery}
 *   searchResults={results}
 *   showSearchResults={showResults}
 *   onShowSearchResultsChange={setShowResults}
 *   isSearching={isSearching}
 * />
 * ```
 */
export const MapView: React.FC<MapViewProps> = ({
  coords,
  onCoordsChange,
  address,
  onAddressChange,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  showSearchResults,
  onShowSearchResultsChange,
  isSearching = false,
  mapHeight = 300,
  zoom = 17,
  searchPlaceholder = 'Rechercher une adresse...',
  addressPlaceholder = 'Ex: Avenue de la Paix, Gombe',
  addressLabel = 'Adresse confirmée',
}) => {
  const { colors } = useTheme();
  const mapRef = useRef<any>(null);

  const handleAddressSelect = (selectedAddress: typeof searchResults[0]) => {
    onCoordsChange(selectedAddress.coords);
    onAddressChange(selectedAddress.fullAddress || selectedAddress.name);
    
    if (mapRef.current) {
      mapRef.current.injectJavaScript(`
        if (typeof updateMarker === 'function') {
          updateMarker(${selectedAddress.coords.lat}, ${selectedAddress.coords.lng});
        }
      `);
    }
    
    onSearchQueryChange('');
    onShowSearchResultsChange(false);
  };

  const generateMapHTML = (latitude: number, longitude: number) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https://*.tile.openstreetmap.org https://unpkg.com data:; script-src https://unpkg.com 'unsafe-inline'; style-src https://unpkg.com 'unsafe-inline'; connect-src 'none'; child-src 'none'; frame-ancestors 'none';" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: true,
          minZoom: 3,
          maxZoom: 19
        }).setView([${latitude}, ${longitude}], ${zoom});
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);
        
        var marker = L.marker([${latitude}, ${longitude}], {
          draggable: true
        }).addTo(map);
        
        marker.on('dragend', function(e) {
          var pos = marker.getLatLng();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerMoved',
            lat: pos.lat,
            lng: pos.lng
          }));
        });
        
        window.updateMarker = function(lat, lng) {
          marker.setLatLng([lat, lng]);
          map.setView([lat, lng], map.getZoom());
        };
      </script>
    </body>
    </html>
  `;

  return (
    <View>
      {/* Barre de recherche */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.md, paddingHorizontal: SPACING.md }}>
        <Search size={20} color={colors.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textTertiary}
          style={{ flex: 1, padding: SPACING.md, color: colors.text, fontSize: TYPOGRAPHY.sizes.md }}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          blurOnSubmit={false}
        />
        {isSearching && <Text style={{ color: colors.primary, fontSize: TYPOGRAPHY.sizes.xs, marginRight: SPACING.sm }}>🔄</Text>}
        {searchQuery.length > 0 && !isSearching && (
          <Pressable onPress={() => { onSearchQueryChange(''); onShowSearchResultsChange(false); }}>
            <X size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Résultats de recherche */}
      {showSearchResults && searchResults.length > 0 && (
        <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md, maxHeight: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
            {searchResults.map((result) => (
              <Pressable
                key={result.id}
                onPress={() => handleAddressSelect(result)}
                style={{ padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm }}>
                  <MapPin size={18} color={colors.primary} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold }}>{result.name}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.sm, marginTop: 2 }} numberOfLines={2}>{result.fullAddress}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Carte interactive */}
      <View style={{ height: mapHeight, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', borderWidth: 2, borderColor: colors.primary, marginBottom: SPACING.md }}>
        <WebView
          ref={mapRef}
          source={{ html: generateMapHTML(coords.lat, coords.lng) }}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["about:blank", "data:", "https://unpkg.com", "https://a.tile.openstreetmap.org", "https://b.tile.openstreetmap.org", "https://c.tile.openstreetmap.org"]}
          onShouldStartLoadWithRequest={(req) => {
            const allowedPrefixes = [
              "about:blank",
              "data:",
              "https://unpkg.com",
              "https://a.tile.openstreetmap.org",
              "https://b.tile.openstreetmap.org",
              "https://c.tile.openstreetmap.org",
            ];
            return allowedPrefixes.some((prefix) => req.url.startsWith(prefix));
          }}
          setSupportMultipleWindows={false}
          allowFileAccess={false}
          allowsLinkPreview={false}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'markerMoved') {
                onCoordsChange({ lat: data.lat, lng: data.lng });
              }
            } catch (error) {
              console.log('Erreur:', error);
            }
          }}
        />
      </View>

      {/* Champ adresse confirmée */}
      <View>
        <Text style={{ color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }}>
          {addressLabel}
        </Text>
        <TextInput
          value={address}
          onChangeText={onAddressChange}
          placeholder={addressPlaceholder}
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={2}
          style={{ backgroundColor: colors.card, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border, minHeight: 60, textAlignVertical: 'top', padding: SPACING.md }}
        />
      </View>
    </View>
  );
};

export default MapView;
