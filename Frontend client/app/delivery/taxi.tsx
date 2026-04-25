import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View, StyleSheet, Dimensions, ScrollView, Animated, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { MapPin, Clock, ChevronLeft, Navigation2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SPACING, TYPOGRAPHY } from '@/constants/colors';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Row, Stack, Section } from '@/components/ui';
import { apiService } from '@/services/api';
import { useSuccessModal } from '@/hooks';
import { SuccessModal } from '@/components/organisms/modals';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location'; // Corrected import
import io from 'socket.io-client'; // Corrected import
import Constants from 'expo-constants';
import { router } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CAR_TYPES = [
  { id: 'economy', name: 'Économique', subtitle: '4 places', pricePerKm: 500, emoji: '🚗' },
  { id: 'comfort', name: 'Confort', subtitle: '4 places', pricePerKm: 700, emoji: '🚙' },
  { id: 'van', name: 'Van', subtitle: '7 places', pricePerKm: 1000, emoji: '🚐' },
  { id: 'premium', name: 'Premium', subtitle: '4 places', pricePerKm: 1500, emoji: '🚕' },
];

export default function TaxiScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [carType, setCarType] = useState('economy');
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const successModal = useSuccessModal({ autoClose: true, navigateBack: false });

  const [clientCoords, setClientCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);

  const [activeRide, setActiveRide] = useState<any | null>(null);
  const activeRideIdRef = useRef<string>('');

  const socketRef = useRef<any>(null);
  const mapWebViewRef = useRef<WebView>(null);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const lastDriverPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastRouteFetchAtRef = useRef<number>(0);
  const lastRouteKeyRef = useRef<string>('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    try {
      const safeDrivers = Array.isArray(nearbyDrivers)
        ? nearbyDrivers
            .map((d) => ({
              user_id: String((d as any)?.user_id || ''),
              lat: Number((d as any)?.lat),
              lng: Number((d as any)?.lng),
              is_visible: (d as any)?.is_visible === undefined ? true : Boolean((d as any)?.is_visible),
              full_name: (d as any)?.full_name ? String((d as any)?.full_name) : '',
              avatar_url: (d as any)?.avatar_url ? String((d as any)?.avatar_url) : '',
            }))
            .filter((d) => d.user_id && Number.isFinite(d.lat) && Number.isFinite(d.lng) && d.is_visible)
        : [];

      mapWebViewRef.current?.postMessage(
        JSON.stringify({ type: 'drivers:update', drivers: safeDrivers })
      );
    } catch {
      // ignore
    }
  }, [nearbyDrivers]);

  const getSocketBaseUrl = useCallback((): string => {
    const apiBaseUrl =
      Constants.expoConfig?.extra?.apiBaseUrl ||
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      'http://192.168.1.73:3000/api/v1';
    return String(apiBaseUrl).replace(/\/api\/v\d+\/?$/, '');
  }, []);

  const region = clientCoords
    ? {
      latitude: clientCoords.lat,
      longitude: clientCoords.lng,
    }
    : {
      latitude: -4.325,
      longitude: 15.322,
    };

  const generateMapHTML = (latitude: number, longitude: number, drivers: any[], userAvatarUrl: string, userId: string) => {
    const safeDrivers = Array.isArray(drivers)
      ? drivers
        .map((d) => ({
          user_id: String((d as any)?.user_id || ''),
          lat: Number((d as any)?.lat),
          lng: Number((d as any)?.lng),
          is_visible: (d as any)?.is_visible === undefined ? true : Boolean((d as any)?.is_visible),
          full_name: (d as any)?.full_name ? String((d as any)?.full_name) : '',
          avatar_url: (d as any)?.avatar_url ? String((d as any)?.avatar_url) : '',
        }))
        .filter((d) => d.user_id && Number.isFinite(d.lat) && Number.isFinite(d.lng) && d.is_visible)
      : [];

    const driversJson = JSON.stringify(safeDrivers);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
          .leaflet-control-attribution { display: none; }
          .custom-marker {
            background-color: #0ea5e9;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
          }
          .taxi-avatar {
            width: 28px;
            height: 28px;
            border-radius: 14px;
            border: 2px solid #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.35);
            background: #0ea5e9;
            object-fit: cover;
          }
          .taxi-fallback {
            width: 38px;
            height: 38px;
            border-radius: 19px;
            border: 2px solid #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.35);
            background: #0ea5e9;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            color: #111;
          }
          .user-marker {
            background-color: #000;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 3px solid #fff;
            box-shadow: 0 0 15px rgba(0,0,0,0.4);
          }
          .me-avatar {
            width: 30px;
            height: 30px;
            border-radius: 15px;
            border: 2px solid #fff;
            box-shadow: 0 0 12px rgba(0,0,0,0.35);
            background: #111;
            object-fit: cover;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${latitude}, ${longitude}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

          map.createPane('taxisPane');
          map.getPane('taxisPane').style.zIndex = 650;
          map.createPane('userPane');
          map.getPane('userPane').style.zIndex = 700;

          var meAvatarUrl = ${JSON.stringify(String(userAvatarUrl || ''))};
          var meUserId = ${JSON.stringify(String(userId || ''))};
          var meLat = ${latitude};
          var meLng = ${longitude};
          var userIcon = (function() {
            try {
              if (meAvatarUrl) {
                return L.divIcon({
                  className: '',
                  html: '<img class="me-avatar" src="' + String(meAvatarUrl) + '" />',
                  iconSize: [30, 30]
                });
              }
            } catch (e) {}

            return L.divIcon({
              className: '',
              html: '<div class="user-marker"></div>',
              iconSize: [14, 14]
            });
          })();

          L.marker([${latitude}, ${longitude}], { icon: userIcon, pane: 'userPane', zIndexOffset: 1000 })
            .addTo(map)
            .bindTooltip('Moi', { direction: 'top', offset: [0, -12], permanent: true, opacity: 0.9 });

          var taxiMarkersByUserId = {};
          var rideDriverMarker = null;
          var rideRouteLine = null;

          function buildTaxiIcon() {
            return L.divIcon({
              className: '',
              html: '<div class="taxi-fallback">🚕</div>',
              iconSize: [38, 38]
            });
          }

          function hashCode(str) {
            try {
              str = String(str || '');
              var hash = 0;
              for (var i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
              }
              return Math.abs(hash);
            } catch (e) {
              return 1;
            }
          }

          function maybeOffsetTaxi(lat, lng, seed) {
            try {
              var dLat = Math.abs(lat - meLat);
              var dLng = Math.abs(lng - meLng);

              // If too close to user marker (same address / same GPS point), offset slightly (a few meters)
              if (dLat < 0.00002 && dLng < 0.00002) {
                var h = hashCode(seed);
                var angle = (h % 360) * Math.PI / 180;
                var radius = 0.00005; // ~5m
                return {
                  lat: lat + (Math.cos(angle) * radius),
                  lng: lng + (Math.sin(angle) * radius),
                };
              }
            } catch (e) {}

            return { lat: lat, lng: lng };
          }

          function renderDrivers(drivers) {
            try {
              if (!Array.isArray(drivers)) drivers = [];

              Object.keys(taxiMarkersByUserId).forEach(function(uid) {
                if (taxiMarkersByUserId[uid]) {
                  map.removeLayer(taxiMarkersByUserId[uid]);
                }
              });
              taxiMarkersByUserId = {};

              drivers.forEach(function(d) {
                if (!d || !d.user_id) return;
                if (typeof d.lat !== 'number' || typeof d.lng !== 'number') return;
                if (meUserId && String(d.user_id) === String(meUserId)) return;

                var pos = maybeOffsetTaxi(d.lat, d.lng, d.user_id);

                var icon = buildTaxiIcon();
                var label = 'Taxi';

                var m = L.marker([pos.lat, pos.lng], { icon: icon, pane: 'taxisPane', zIndexOffset: 2000 })
                  .addTo(map)
                  .bindTooltip(label, { direction: 'top', offset: [0, -14], permanent: true, opacity: 0.9 });

                taxiMarkersByUserId[String(d.user_id)] = m;
              });
            } catch (e) {}
          }

          function fitToAll(drivers) {
            try {
              var pts = [[${latitude}, ${longitude}]];
              if (Array.isArray(drivers)) {
                drivers.forEach(function(d) {
                  if (!d) return;
                  if (typeof d.lat !== 'number' || typeof d.lng !== 'number') return;
                  pts.push([d.lat, d.lng]);
                });
              }

              if (pts.length <= 1) {
                map.setView([${latitude}, ${longitude}], 18);
                return;
              }

              // If all points are very close (same address), zoom in more to see marker offsets
              var minLat = pts[0][0], maxLat = pts[0][0], minLng = pts[0][1], maxLng = pts[0][1];
              for (var i = 1; i < pts.length; i++) {
                minLat = Math.min(minLat, pts[i][0]);
                maxLat = Math.max(maxLat, pts[i][0]);
                minLng = Math.min(minLng, pts[i][1]);
                maxLng = Math.max(maxLng, pts[i][1]);
              }
              var spanLat = Math.abs(maxLat - minLat);
              var spanLng = Math.abs(maxLng - minLng);
              if (spanLat < 0.0003 && spanLng < 0.0003) {
                map.setView([${latitude}, ${longitude}], 18);
                return;
              }

              var bounds = L.latLngBounds(pts);
              map.fitBounds(bounds, { padding: [30, 30], maxZoom: 18 });
            } catch (e) {
              map.setView([${latitude}, ${longitude}], 18);
            }
          }

          var drivers = ${driversJson};
          renderDrivers(drivers);
          fitToAll(drivers);

          function handleMessage(event) {
            try {
              var msg = event && event.data ? event.data : null;
              if (!msg) return;
              if (typeof msg === 'string') {
                msg = JSON.parse(msg);
              }
              if (!msg || !msg.type) return;
              if (msg.type === 'drivers:update') {
                renderDrivers(msg.drivers);
                return;
              }

              if (msg.type === 'ride:driver_location') {
                var dlat = Number(msg.lat);
                var dlng = Number(msg.lng);
                if (!isFinite(dlat) || !isFinite(dlng)) return;

                var icon = buildTaxiIcon();
                if (!rideDriverMarker) {
                  rideDriverMarker = L.marker([dlat, dlng], { icon: icon, pane: 'taxisPane', zIndexOffset: 3000 })
                    .addTo(map)
                    .bindTooltip('Taxi', { direction: 'top', offset: [0, -14], permanent: true, opacity: 0.95 });
                } else {
                  rideDriverMarker.setLatLng([dlat, dlng]);
                }
                return;
              }

              if (msg.type === 'ride:driver_clear') {
                if (rideDriverMarker) {
                  map.removeLayer(rideDriverMarker);
                  rideDriverMarker = null;
                }
                if (rideRouteLine) {
                  map.removeLayer(rideRouteLine);
                  rideRouteLine = null;
                }
                return;
              }

              if (msg.type === 'ride:route:clear') {
                if (rideRouteLine) {
                  map.removeLayer(rideRouteLine);
                  rideRouteLine = null;
                }
                return;
              }

              if (msg.type === 'ride:route:set') {
                var geom = msg.geometry;
                var coords = geom && geom.coordinates ? geom.coordinates : null;
                if (!Array.isArray(coords) || coords.length < 2) return;

                var latlngs = coords
                  .map(function(pt) {
                    if (!Array.isArray(pt) || pt.length < 2) return null;
                    var lng = Number(pt[0]);
                    var lat = Number(pt[1]);
                    if (!isFinite(lat) || !isFinite(lng)) return null;
                    return [lat, lng];
                  })
                  .filter(function(x) { return x; });

                if (latlngs.length < 2) return;

                if (rideRouteLine) {
                  map.removeLayer(rideRouteLine);
                  rideRouteLine = null;
                }

                rideRouteLine = L.polyline(latlngs, {
                  color: '#0ea5e9',
                  weight: 5,
                  opacity: 0.85
                }).addTo(map);

                try {
                  map.fitBounds(rideRouteLine.getBounds(), { padding: [40, 40], maxZoom: 17 });
                } catch (e) {}
                return;
              }
            } catch (e) {}
          }

          window.addEventListener('message', handleMessage);
          document.addEventListener('message', handleMessage);
        </script>
      </body>
      </html>
    `;
  };

  const refreshNearby = useCallback(async (coords: { lat: number; lng: number }) => {
    try {
      const res = await apiService.getLiveLocations({
        service_id: 'taxi',
        lat: coords.lat,
        lng: coords.lng,
        radius_m: 5000,
        stale_s: 120,
        limit: 60,
      });
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setNearbyDrivers(data.filter((d) => (d as any)?.is_visible === undefined ? true : Boolean((d as any)?.is_visible)));
      }
    } finally {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (!clientCoords) return;
    const t = setInterval(() => {
      refreshNearby(clientCoords);
    }, 8000);
    return () => clearInterval(t);
  }, [clientCoords, refreshNearby]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const pos = await Location.getCurrentPositionAsync({});
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (!mounted) return;
      setClientCoords(coords);
      await refreshNearby(coords);
    })();

    return () => { mounted = false; };
  }, [refreshNearby]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (!mounted || !token) return;

        const socketBaseUrl = getSocketBaseUrl();
        const socket = io(socketBaseUrl, {
          transports: ['websocket'],
          extraHeaders: { Authorization: `Bearer ${token}` },
        });

        socketRef.current = socket;
        socket.emit('subscribe', { service_id: 'taxi', city: '' });

        socket.on('taxi:ride:updated', (ride: any) => {
          const id = String(ride?.id || '');
          if (!id) return;
          if (activeRideIdRef.current && id !== activeRideIdRef.current) return;
          setActiveRide(ride);
        });

        socket.on('taxi:driver:location', (evt: any) => {
          const rideId = String(evt?.ride_id || '');
          if (!rideId) return;
          if (!activeRideIdRef.current || rideId !== activeRideIdRef.current) return;

          const lat = Number(evt?.lat);
          const lng = Number(evt?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

          lastDriverPosRef.current = { lat, lng };
          void maybeFetchDriverPickupRoute({ lat, lng });

          try {
            mapWebViewRef.current?.postMessage(
              JSON.stringify({ type: 'ride:driver_location', lat, lng })
            );
          } catch {
            // ignore
          }
        });

        socket.on('location:update', (evt: any) => {
          const user_id = String(evt?.user_id || '');
          const lat = Number(evt?.lat);
          const lng = Number(evt?.lng);
          if (!user_id || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

          const is_visible = evt?.is_visible === undefined ? true : Boolean(evt?.is_visible);
          if (!is_visible) {
            setNearbyDrivers((prev) => (Array.isArray(prev) ? prev.filter((d) => String((d as any)?.user_id || '') !== user_id) : []));
            return;
          }

          setNearbyDrivers((prev) => {
            const next = Array.isArray(prev) ? [...prev] : [];
            const idx = next.findIndex((d) => String((d as any)?.user_id || '') === user_id);
            const item = { ...(idx >= 0 ? next[idx] : {}), ...evt, user_id, lat, lng };
            if (idx >= 0) next[idx] = item;
            else next.unshift(item);
            return next;
          });
        });
      } catch (err) { }
    })();

    return () => {
      mounted = false;
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [getSocketBaseUrl]);

  useEffect(() => {
    const rideId = String(activeRide?.id || '');
    activeRideIdRef.current = rideId;

    if (!rideId) {
      try {
        mapWebViewRef.current?.postMessage(JSON.stringify({ type: 'ride:driver_clear' }));
      } catch {
        // ignore
      }
      return;
    }

    const socket = socketRef.current;
    if (!socket) return;

    try {
      socket.emit('taxi:ride:subscribe', { ride_id: rideId });
    } catch {
      // ignore
    }

    const status = String(activeRide?.status || '');
    if (['completed', 'canceled'].includes(status)) {
      try {
        socket.emit('taxi:ride:unsubscribe', { ride_id: rideId });
      } catch {
        // ignore
      }
      try {
        mapWebViewRef.current?.postMessage(JSON.stringify({ type: 'ride:driver_clear' }));
      } catch {
        // ignore
      }
      return;
    }

    return () => {
      try {
        socket.emit('taxi:ride:unsubscribe', { ride_id: rideId });
      } catch {
        // ignore
      }
    };
  }, [activeRide?.id, activeRide?.status]);

  useEffect(() => {
    const rideId = String(activeRide?.id || '');
    if (!rideId) return;

    const status = String(activeRide?.status || '');
    if (['completed', 'canceled'].includes(status)) return;

    if (lastDriverPosRef.current) return;

    const pickupLat = Number(activeRide?.pickup_lat);
    const pickupLng = Number(activeRide?.pickup_lng);
    const dropLat = Number(activeRide?.dropoff_lat);
    const dropLng = Number(activeRide?.dropoff_lng);
    if (![pickupLat, pickupLng, dropLat, dropLng].every(Number.isFinite)) return;

    let mounted = true;
    (async () => {
      try {
        const now = Date.now();
        if (now - lastRouteFetchAtRef.current < 8000) return;

        const key = `${pickupLat.toFixed(5)},${pickupLng.toFixed(5)}|${dropLat.toFixed(5)},${dropLng.toFixed(5)}`;
        if (key === lastRouteKeyRef.current) return;

        lastRouteFetchAtRef.current = now;
        lastRouteKeyRef.current = key;

        const res = await apiService.getTaxiRoute({
          from_lat: pickupLat,
          from_lng: pickupLng,
          to_lat: dropLat,
          to_lng: dropLng,
        });
        if (!mounted) return;
        if (!res?.success || !res?.data?.geometry) return;
        mapWebViewRef.current?.postMessage(JSON.stringify({ type: 'ride:route:set', geometry: res.data.geometry }));
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [activeRide?.id, activeRide?.status, activeRide?.pickup_lat, activeRide?.pickup_lng, activeRide?.dropoff_lat, activeRide?.dropoff_lng]);

  const maybeFetchDriverPickupRoute = useCallback(async (driverPos: { lat: number; lng: number }) => {
    const pickupLat = Number(activeRide?.pickup_lat);
    const pickupLng = Number(activeRide?.pickup_lng);
    if (!Number.isFinite(pickupLat) || !Number.isFinite(pickupLng)) return;

    const now = Date.now();
    if (now - lastRouteFetchAtRef.current < 8000) return;

    const key = `${driverPos.lat.toFixed(5)},${driverPos.lng.toFixed(5)}|${pickupLat.toFixed(5)},${pickupLng.toFixed(5)}`;
    if (key === lastRouteKeyRef.current) return;

    lastRouteFetchAtRef.current = now;
    lastRouteKeyRef.current = key;

    try {
      const res = await apiService.getTaxiRoute({
        from_lat: driverPos.lat,
        from_lng: driverPos.lng,
        to_lat: pickupLat,
        to_lng: pickupLng,
      });
      if (!res?.success || !res?.data?.geometry) return;
      mapWebViewRef.current?.postMessage(JSON.stringify({ type: 'ride:route:set', geometry: res.data.geometry }));
    } catch {
      // ignore
    }
  }, [activeRide?.pickup_lat, activeRide?.pickup_lng]);

  const canProceed = () => {
    if (currentStep === 0) return pickupAddress !== '' && destinationAddress !== '';
    if (currentStep === 1) return carType !== '';
    if (currentStep === 2) return passengerName && passengerPhone;
    return true;
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!clientCoords) return;
    setLoading(true);
    try {
      const res = await apiService.createTaxiRide({
        pickup_address: pickupAddress,
        dropoff_address: destinationAddress,
        pickup_lat: clientCoords.lat,
        pickup_lng: clientCoords.lng,
        is_shared: false,
        options: {
          car_type: carType,
          pricing_context: {
            traffic_level: 0,
            fuel_shortage: false,
          },
        },
      });

      if (!res?.success || !res?.data?.id) {
        throw new Error(String((res as any)?.error || 'Erreur commande taxi'));
      }

      setActiveRide(res.data);

      const status = String(res?.data?.status || '');
      const msg = status === 'assigned' ? 'Votre chauffeur arrive bientôt' : 'Recherche d\'un chauffeur...';
      successModal.show({
        title: 'Taxi réservé !',
        message: msg,
        animation: 'confetti',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCar = CAR_TYPES.find(c => c.id === carType);
  const estimatedDistance = 8.5;
  const estimatedPrice = selectedCar ? selectedCar.pricePerKm * estimatedDistance : 0;
  const displayedEstimatedPrice = activeRide?.estimated_price !== undefined && activeRide?.estimated_price !== null
    ? Number(activeRide.estimated_price)
    : estimatedPrice;
  const displayedCurrency = activeRide?.currency ? String(activeRide.currency) : 'CDF';
  const canCancelRide = Boolean(activeRide?.id) && !['completed', 'canceled'].includes(String(activeRide?.status || ''));

  const handleCancelRide = useCallback(async () => {
    const rideId = String(activeRide?.id || '');
    if (!rideId) return;
    setLoading(true);
    try {
      const res = await apiService.cancelTaxiRide(rideId);
      if (res?.success && res?.data) {
        setActiveRide(res.data);
      } else {
        setActiveRide((prev: any) => prev ? { ...prev, status: 'canceled' } : prev);
      }
    } finally {
      setLoading(false);
    }
  }, [activeRide?.id]);

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        <WebView
          ref={mapWebViewRef}
          source={{ html: generateMapHTML(region.latitude, region.longitude, nearbyDrivers, String(user?.avatar_url || ''), String(user?.id || '')) }}
          style={styles.map}
          pointerEvents="auto"
        />
      </View>

      {/* Floating Header */}
      {!keyboardVisible && (
        <View style={[styles.floatingHeader, { paddingTop: 60 }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card, shadowColor: colors.text }]}
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
        </View>
      )}

      {/* Booking Panel */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Animated.View style={[
          styles.bottomSheet,
          {
            backgroundColor: colors.card,
            opacity: fadeAnim,
            height: keyboardVisible ? SCREEN_HEIGHT * 0.7 : SCREEN_HEIGHT * 0.5
          }
        ]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {currentStep === 0 && (
              <Stack spacing="lg">
                <Heading level={3}>Où allez-vous ?</Heading>
                <View style={styles.inputGroup}>
                  <Input
                    placeholder="Point de départ"
                    value={pickupAddress}
                    onChangeText={setPickupAddress}
                    icon={<MapPin size={20} color={colors.primary} />}
                    style={styles.input}
                  />
                  <View style={[styles.inputDivider, { backgroundColor: colors.border }]} />
                  <Input
                    placeholder="Destination"
                    value={destinationAddress}
                    onChangeText={setDestinationAddress}
                    icon={<Navigation2 size={20} color="#ef4444" />}
                    style={styles.input}
                  />
                </View>

                <Row justify="space-between" align="center" style={styles.recentRow}>
                  <Row spacing="sm" align="center">
                    <Clock size={16} color={colors.textSecondary} />
                    <Body variant="secondary">Adresses récentes</Body>
                  </Row>
                  <ChevronLeft size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                </Row>
              </Stack>
            )}

            {currentStep === 1 && (
              <Stack spacing="lg">
                <Heading level={3}>Choisir un véhicule</Heading>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carList}>
                  {CAR_TYPES.map((car) => (
                    <Pressable
                      key={car.id}
                      onPress={() => setCarType(car.id)}
                      style={[
                        styles.carCard,
                        {
                          borderColor: carType === car.id ? colors.primary : colors.border,
                          backgroundColor: carType === car.id ? colors.primary + '10' : colors.card
                        }
                      ]}
                    >
                      <Body style={styles.carEmoji}>{car.emoji}</Body>
                      <Body style={{ fontWeight: TYPOGRAPHY.weights.bold }}>{car.name}</Body>
                      <Caption>{car.subtitle}</Caption>
                      <Body style={{ color: colors.primary, fontWeight: TYPOGRAPHY.weights.semibold, marginTop: SPACING.xs }}>
                        {car.pricePerKm * estimatedDistance} CDF
                      </Body>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={[styles.priceBreakdown, { backgroundColor: colors.background }]}>
                  <Row justify="space-between">
                    <Caption>Prix estimé</Caption>
                    <Body style={{ fontWeight: TYPOGRAPHY.weights.bold }}>{displayedEstimatedPrice.toLocaleString()} {displayedCurrency}</Body>
                  </Row>
                </View>
              </Stack>
            )}

            {currentStep === 2 && (
              <Stack spacing="lg">
                <Heading level={3}>Passager</Heading>
                <Stack spacing="md">
                  <Input
                    label="Nom"
                    value={passengerName}
                    onChangeText={setPassengerName}
                    placeholder="Ex: Jean Dupont"
                  />
                  <Input
                    label="Téléphone"
                    value={passengerPhone}
                    onChangeText={setPassengerPhone}
                    placeholder="+243..."
                    keyboardType="phone-pad"
                  />
                </Stack>
              </Stack>
            )}

    {currentStep === 3 && (
              <Stack spacing="lg">
                <Heading level={3}>Confirmation</Heading>
                <Section variant="outlined">
                  <Stack spacing="sm">
                    <Row justify="space-between"><Caption>Véhicule:</Caption><Body>{selectedCar?.name}</Body></Row>
                    <Row justify="space-between"><Caption>Passager:</Caption><Body>{passengerName}</Body></Row>
                    <Row justify="space-between"><Caption>Prix:</Caption><Body style={{ color: colors.primary, fontWeight: 'bold' }}>{displayedEstimatedPrice.toLocaleString()} {displayedCurrency}</Body></Row>
                  </Stack>
                </Section>

                {activeRide && (
                  <Section variant="elevated" style={{ backgroundColor: colors.primary + '10' }}>
                    <Stack spacing="xs">
                      <Row justify="space-between" align="center">
                        <Body style={{ fontWeight: 'bold' }}>Statut du trajet</Body>
                        <Badge variant={activeRide.status === 'completed' ? 'success' : activeRide.status === 'canceled' ? 'error' : 'info'}>
                          {activeRide.status === 'requested' ? 'Recherche...' :
                            activeRide.status === 'assigned' ? 'Assigné' :
                              activeRide.status === 'in_progress' ? 'En cours' :
                                activeRide.status === 'completed' ? 'Terminé' :
                                  activeRide.status === 'canceled' ? 'Annulé' : activeRide.status}
                        </Badge>
                      </Row>
                      {activeRide.driver && (
                        <Row spacing="sm" align="center" style={{ marginTop: 8 }}>
                          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                            <Body style={{ fontWeight: 'bold' }}>{activeRide.driver.full_name?.[0]}</Body>
                          </View>
                          <View>
                            <Body style={{ fontWeight: 'bold' }}>{activeRide.driver.full_name}</Body>
                            <Caption>Chauffeur assigné</Caption>
                          </View>
                        </Row>
                      )}
                    </Stack>
                  </Section>
                )}
              </Stack>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <Row spacing="md" style={styles.actions}>
            {currentStep > 0 && currentStep < 3 && (
              <Button
                title=""
                onPress={handlePrevious}
                variant="outline"
                icon={<ChevronLeft size={24} color={colors.text} />}
                style={styles.backButtonMini}
              />
            )}

            {currentStep === 0 && (
              <Button
                title="Suivant"
                onPress={handleNext}
                variant="primary"
                disabled={!canProceed()}
                fullWidth
                style={{ height: 56, borderRadius: 16 }}
              />
            )}

            {currentStep === 1 && (
              <Button
                title="Confirmer le véhicule"
                onPress={handleNext}
                variant="primary"
                disabled={!canProceed()}
                fullWidth
                style={{ height: 56, borderRadius: 16 }}
              />
            )}

            {currentStep === 2 && (
              <Button
                title="Réserver maintenant"
                onPress={handleSubmit}
                variant="primary"
                disabled={!canProceed()}
                loading={loading}
                fullWidth
                style={{ height: 56, borderRadius: 16 }}
              />
            )}

            {currentStep === 3 && (
              <Button
                title={canCancelRide ? "Annuler le trajet" : "Nouvelle course"}
                onPress={canCancelRide ? handleCancelRide : () => { setActiveRide(null); setCurrentStep(0); }}
                variant={canCancelRide ? "danger" : "outline"}
                loading={loading}
                style={{ flex: 1, height: 56, borderRadius: 16 }}
              />
            )}
          </Row>
        </Animated.View>
      </KeyboardAvoidingView>

      <SuccessModal {...successModal.props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    height: SCREEN_HEIGHT * 0.7,
  },
  map: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  inputDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  recentRow: {
    marginTop: 12,
    padding: 12,
  },
  carList: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  carCard: {
    width: 120,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
  },
  carEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  priceBreakdown: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButtonMini: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
});

