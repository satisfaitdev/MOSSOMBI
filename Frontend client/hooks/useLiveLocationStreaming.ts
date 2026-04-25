import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';

function getSocketBaseUrl(): string {
  const apiBaseUrl =
    Constants.expoConfig?.extra?.apiBaseUrl ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    'http://192.168.1.73:3000/api/v1';

  // API base is typically like http://host:3000/api/v1
  // Socket.IO is hosted on the same server root (http://host:3000)
  return String(apiBaseUrl).replace(/\/api\/v\d+\/?$/, '');
}

type LiveLocationStreamingOptions = {
  enabled: boolean;
  service_id: string;
  city?: string;
  is_busy?: boolean;
  intervalMs?: number;
};

export function useLiveLocationStreaming(options: LiveLocationStreamingOptions) {
  const {
    enabled,
    service_id,
    city = '',
    is_busy = false,
    intervalMs = 2500,
  } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<any>(null);
  const subRoomRef = useRef<string | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number; heading?: number | null; speed?: number | null; accuracy?: number | null } | null>(null);
  const timerRef = useRef<any>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const webWatchIdRef = useRef<number | null>(null);

  const stop = useCallback(async () => {
    setIsStreaming(false);

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }

      if (webWatchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          navigator.geolocation.clearWatch(webWatchIdRef.current);
        } catch {
          // ignore
        }
        webWatchIdRef.current = null;
      }

      const socket = socketRef.current;
      if (socket) {
        try {
          const coords = lastCoordsRef.current;
          if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
            socket.emit('location:update', {
              service_id,
              city,
              lat: coords.lat,
              lng: coords.lng,
              heading: coords.heading,
              speed: coords.speed,
              accuracy: coords.accuracy,
              is_visible: false,
              is_busy: false,
            });
          }
        } catch {
          // ignore
        }

        try {
          if (subRoomRef.current) {
            socket.emit('unsubscribe', { service_id, city });
          }
        } catch {
          // ignore
        }

        try {
          socket.disconnect();
        } catch {
          // ignore
        }
      }

      socketRef.current = null;
      subRoomRef.current = null;
      lastCoordsRef.current = null;
    } catch {
      // ignore
    }
  }, [city, service_id]);

  const start = useCallback(async () => {
    setError(null);

    if (!service_id) {
      setError('service_id requis');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setError('Token manquant: veuillez vous reconnecter');
        return;
      }

      const socketBaseUrl = getSocketBaseUrl();

      const isWeb = Platform.OS === 'web';
      const socket = isWeb
        ? io(socketBaseUrl, {
            transports: ['websocket'],
            auth: {
              token,
            },
          })
        : io(socketBaseUrl, {
            transports: ['websocket'],
            extraHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });

      socketRef.current = socket;

      socket.on('connect_error', (e: any) => {
        const msg = e?.message ? String(e.message) : 'Erreur connexion Socket.IO';
        setError(msg);
      });

      // Viewer subscription (same room used for broadcasts)
      socket.emit('subscribe', { service_id, city }, (ack: any) => {
        if (ack?.success) {
          subRoomRef.current = String(ack?.room || '');
        }
      });

      // Keep latest coords from GPS
      if (isWeb) {
        if (!navigator?.geolocation) {
          setError('Geolocation indisponible sur ce navigateur');
          return;
        }

        webWatchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos?.coords?.latitude;
            const lng = pos?.coords?.longitude;
            if (typeof lat !== 'number' || typeof lng !== 'number') return;

            lastCoordsRef.current = {
              lat,
              lng,
              heading: (pos as any)?.coords?.heading ?? null,
              speed: (pos as any)?.coords?.speed ?? null,
              accuracy: (pos as any)?.coords?.accuracy ?? null,
            };
          },
          (err) => {
            setError(err?.message ? String(err.message) : 'Erreur geolocation navigateur');
          },
          {
            enableHighAccuracy: true,
            maximumAge: 2000,
            timeout: 20000,
          }
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission localisation refusée');
          return;
        }

        locationSubRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 1000,
            distanceInterval: 5,
          },
          (pos) => {
            const lat = pos?.coords?.latitude;
            const lng = pos?.coords?.longitude;
            if (typeof lat !== 'number' || typeof lng !== 'number') return;

            lastCoordsRef.current = {
              lat,
              lng,
              heading: pos?.coords?.heading ?? null,
              speed: pos?.coords?.speed ?? null,
              accuracy: pos?.coords?.accuracy ?? null,
            };
          }
        );
      }

      // Emit to server periodically
      timerRef.current = setInterval(() => {
        const coords = lastCoordsRef.current;
        if (!coords) return;

        socket.emit('location:update', {
          service_id,
          city,
          lat: coords.lat,
          lng: coords.lng,
          heading: coords.heading,
          speed: coords.speed,
          accuracy: coords.accuracy,
          is_visible: true,
          is_busy: Boolean(is_busy),
        });
      }, intervalMs);

      setIsStreaming(true);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Erreur streaming localisation');
    }
  }, [city, intervalMs, is_busy, service_id]);

  useEffect(() => {
    if (enabled) {
      start();
      return () => {
        stop();
      };
    }

    stop();
    return () => {
      // no-op
    };
  }, [enabled, start, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    isStreaming,
    error,
  };
}
