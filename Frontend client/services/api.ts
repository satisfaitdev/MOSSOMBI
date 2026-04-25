/**
 * SERVICE API - MOSSOMBI FRONTEND
 * Connexion aux APIs backend uniquement (pas de Supabase direct)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

// Configuration de base - Utilisation sécurisée des variables d'environnement
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.152.94:3000/api/v1';

// Configuration API chargée
console.log('🔧 API Service - Configuration:', { API_BASE_URL });

// Types pour TypeScript
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  user_id_display: string;
  user_level: string;
  points: number;
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
  last_login_at: string;
  country_code?: string;
  date_of_birth?: string; // Date de naissance
  address?: string; // Adresse
}

export interface BackpackItem {
  id: string;
  name: string;
  description: string;
  category: 'achievement' | 'reward' | 'badge' | 'item';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  metadata: {
    icon?: string;
    points_value?: number;
    usable?: boolean;
    attack?: number;
  };
  is_used: boolean;
  obtained_at: string;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  type: 'recharge' | 'payment' | 'transfer' | 'withdrawal' | 'refund' | 'bonus';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface OnboardingState {
  completed: boolean;
  skipped: boolean;
  preferred_services: string[];
  acquisition_source?: string | null;
  invite_code?: string | null;
  language: 'fr' | 'en' | 'sw' | null;
  updated_at: string | null;
}

export type AdType = 'banner' | 'popup' | 'splash';

export interface Ad {
  id: string;
  type: AdType;
  title: string;
  link_url: string;
  image_url: string;
  target_cities: string[];
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Classe principale du service API
class ApiService {
  private baseURL: string;
  private refreshPromise: Promise<string | null> | null = null;

  private getCacheTtlMs(endpoint: string): number {
    const DEFAULT = 24 * 60 * 60 * 1000;
    if (endpoint.startsWith('/wallet')) return 5 * 60 * 1000;
    if (endpoint.startsWith('/ads')) return 30 * 60 * 1000;
    if (endpoint.startsWith('/users/profile')) return 24 * 60 * 60 * 1000;
    if (endpoint.startsWith('/users/onboarding')) return 24 * 60 * 60 * 1000;
    return DEFAULT;
  }

  private async getCacheNamespace(token?: string | null): Promise<string> {
    try {
      const raw = await AsyncStorage.getItem('user');
      if (!raw) {
        if (token) {
          const safe = token.length > 16 ? token.slice(-16) : token;
          return `token_${safe}`;
        }
        return 'public';
      }
      const u = JSON.parse(raw);
      return String(u?.id || u?.user_id_display || 'public');
    } catch {
      if (token) {
        const safe = token.length > 16 ? token.slice(-16) : token;
        return `token_${safe}`;
      }
      return 'public';
    }
  }

  private async getCacheKey(endpoint: string, token?: string | null): Promise<string> {
    const ns = await this.getCacheNamespace(token);
    return `api_cache:${ns}:${endpoint}`;
  }

  private shouldCache(method: string, endpoint: string) {
    if (method.toUpperCase() !== 'GET') return false;
    if (endpoint.startsWith('/auth')) return false;
    return true;
  }

  private async saveGetCache(endpoint: string, payload: any, token?: string | null) {
    try {
      const value = JSON.stringify({ ts: Date.now(), payload });
      const key = await this.getCacheKey(endpoint, token);
      await AsyncStorage.setItem(key, value);

      if (token) {
        const safe = token.length > 16 ? token.slice(-16) : token;
        const tokenKey = `api_cache:token_${safe}:${endpoint}`;
        if (tokenKey !== key) {
          await AsyncStorage.setItem(tokenKey, value);
        }
      }
    } catch {
      // ignore
    }
  }

  private async readGetCache(endpoint: string, token?: string | null) {
    try {
      const ttlMs = this.getCacheTtlMs(endpoint);
      const now = Date.now();
      const keysToTry: string[] = [];
      keysToTry.push(await this.getCacheKey(endpoint, token));

      if (token) {
        const safe = token.length > 16 ? token.slice(-16) : token;
        keysToTry.push(`api_cache:token_${safe}:${endpoint}`);
      }

      keysToTry.push(`api_cache:public:${endpoint}`);

      for (const key of keysToTry) {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const ts = typeof parsed?.ts === 'number' ? parsed.ts : 0;
        if (!ts || now - ts > ttlMs) {
          try {
            await AsyncStorage.removeItem(key);
          } catch {
          }
          continue;
        }
        const payload = parsed?.payload ?? null;
        if (payload) return payload;
      }

      return null;
    } catch {
      return null;
    }
  }

  private sanitizeForLog(input: any): any {
    const MAX_LEN = 160;
    const sensitiveKeys = new Set(['access_token', 'refresh_token', 'token', 'auth_token']);

    if (typeof input === 'string') {
      const s = input;
      if (s.startsWith('data:')) return '[DATA_URL_REDACTED]';
      if (s.length > MAX_LEN) return `[TRUNCATED len=${s.length}]`;
      return s;
    }

    if (!input || typeof input !== 'object') return input;
    if (Array.isArray(input)) return input.map((x) => this.sanitizeForLog(x));

    const out: any = {};
    for (const [k, v] of Object.entries(input)) {
      if (sensitiveKeys.has(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = this.sanitizeForLog(v);
      }
    }
    return out;
  }

  constructor() {
    console.log('🔧 API Service - Configuration:', {
      API_BASE_URL
    });

    this.baseURL = API_BASE_URL;
  }

  // =====================================================
  // 📢 ADS (PUBLIC)
  // =====================================================

  async getAds(params?: { type?: AdType; city?: string }): Promise<ApiResponse<Ad[]>> {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.city) qs.set('city', params.city);

    const endpoint = qs.toString() ? `/ads?${qs.toString()}` : '/ads';
    const result = await this.request<Ad[]>(endpoint, { method: 'GET' });
    return result as ApiResponse<Ad[]>;
  }

  // =====================================================
  // 🧭 ONBOARDING (AUTH)
  // =====================================================

  async getOnboarding(): Promise<ApiResponse<OnboardingState>> {
    const result = await this.request<OnboardingState>('/users/onboarding', { method: 'GET' });
    return result as ApiResponse<OnboardingState>;
  }

  async updateOnboarding(data: Partial<Pick<OnboardingState, 'completed' | 'skipped' | 'preferred_services' | 'language' | 'acquisition_source' | 'invite_code'>>): Promise<ApiResponse<OnboardingState>> {
    const result = await this.request<OnboardingState>('/users/onboarding', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result as ApiResponse<OnboardingState>;
  }

  async updateUserProfile(data: Partial<Pick<User, 'full_name' | 'email' | 'date_of_birth' | 'address' | 'country_code'>>): Promise<ApiResponse<any>> {
    const result = await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result as ApiResponse<any>;
  }

  async uploadAvatar(params: { uri: string; fileName?: string; mimeType?: string }): Promise<ApiResponse<{ avatar_url: string }>> {
    const form = new FormData();
    form.append('avatar', {
      uri: params.uri,
      name: params.fileName || 'avatar.jpg',
      type: params.mimeType || 'image/jpeg',
    } as any);

    const token = await this.getAuthToken();
    const res = await fetch(`${this.baseURL}/users/avatar`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    });

    const json = await res.json();
    return json as ApiResponse<{ avatar_url: string }>;
  }

  async applyAgency(data: {
    name: string;
    city?: string;
    address?: string;
    logo_url?: string;
    services?: Array<{ service_id: string; payload_json?: Record<string, any> }>;
    documents?: Array<{ service_id?: string; doc_type: string; file_url: string }>;
  }): Promise<ApiResponse<any>> {
    return this.request('/agencies/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyAgency(): Promise<ApiResponse<any>> {
    return this.request('/agencies/my', {
      method: 'GET',
    });
  }

  async updateMyAgency(data: {
    name?: string;
    city?: string;
    address?: string;
    logo_url?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/agencies/my', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async requestMyAgencyService(data: {
    service_id: string;
    payload_json?: Record<string, any>;
  }): Promise<ApiResponse<any>> {
    return this.request('/agencies/my/service-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMyAgencyServiceRequest(id: string): Promise<ApiResponse<any>> {
    return this.request(`/agencies/my/service-requests/${id}`, {
      method: 'DELETE',
    });
  }

  async leaveMyAgency(): Promise<ApiResponse<any>> {
    return this.request('/agencies/my/leave', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getMyAgencyStaff(params?: { limit?: number }): Promise<ApiResponse<any>> {
    const qs = new URLSearchParams();
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    const query = qs.toString();

    return this.request(`/agencies/my/staff${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async inviteAgencyMember(data: {
    user_id_display: string;
    role_in_agency?: 'host' | 'sub_agent' | 'agent';
  }): Promise<ApiResponse<any>> {
    return this.request('/agencies/my/invite-member', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinAgencyByUserDisplay(data: { user_id_display: string }): Promise<ApiResponse<any>> {
    return this.request('/agencies/join-by-user-display', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPendingMemberships(): Promise<ApiResponse<any>> {
    return this.request('/agencies/memberships/pending', {
      method: 'GET',
    });
  }

  async approveMembership(membershipId: string): Promise<ApiResponse<any>> {
    return this.request(`/agencies/memberships/${membershipId}/approve`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async rejectMembership(membershipId: string): Promise<ApiResponse<any>> {
    return this.request(`/agencies/memberships/${membershipId}/reject`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // =====================================================
  // 🛍️ AGENCY SERVICES (Articles & Tickets)
  // =====================================================

  async createArticle(data: {
    name: string;
    description?: string;
    price: number;
    in_stock: boolean;
    country: string;
    delivery_time: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/agency-services/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 🚀 NOUVELLE API ENHANCED - Payload universel
  async createArticleEnhanced(data: any): Promise<ApiResponse<any>> {
    return this.request('/agency-services-enhanced/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getArticles(): Promise<ApiResponse<any[]>> {
    return this.request('/agency-services/articles', {
      method: 'GET',
    });
  }

  async createTicket(data: {
    event_name: string;
    event_date?: string;
    venue?: string;
    ticket_type: string;
    price: number;
    quantity_total: number;
  }): Promise<ApiResponse<any>> {
    return this.request('/agency-services/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTickets(): Promise<ApiResponse<any[]>> {
    return this.request('/agency-services/tickets', {
      method: 'GET',
    });
  }

  // =====================================================
  // � AGENCY SALES (Dashboard)
  // =====================================================

  async getAgencySalesDashboard(params?: {
    service_id?: string;
    period?: 'today' | '7d' | 'month';
  }): Promise<ApiResponse<any>> {
    const qs = new URLSearchParams();
    if (params?.service_id) qs.set('service_id', params.service_id);
    if (params?.period) qs.set('period', params.period);
    const query = qs.toString();

    return this.request(`/agency-sales/dashboard${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async getAgencyRecentSales(params?: {
    service_id?: string;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const qs = new URLSearchParams();
    if (params?.service_id) qs.set('service_id', params.service_id);
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    const query = qs.toString();

    return this.request(`/agency-sales/recent${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async getAgencySales(params?: {
    service_id?: string;
    delivery_status?: 'pending' | 'delivered';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ items: any[] }>> {
    const qs = new URLSearchParams();
    if (params?.service_id) qs.set('service_id', params.service_id);
    if (params?.delivery_status) qs.set('delivery_status', params.delivery_status);
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    if (params?.offset !== undefined) qs.set('offset', String(params.offset));
    const query = qs.toString();

    return this.request(`/agency-sales${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async confirmAgencySale(id: string): Promise<ApiResponse<any>> {
    return this.request(`/agency-sales/${encodeURIComponent(id)}/confirm`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // =====================================================
  // 📍 LIVE LOCATIONS (Taxi / Coursier)
  // =====================================================

  async getLiveLocations(params: {
    service_id: 'taxi' | 'courier';
    city?: string;
    lat?: number;
    lng?: number;
    radius_m?: number;
    stale_s?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const qs = new URLSearchParams();
    qs.set('service_id', String(params.service_id));
    if (params.city) qs.set('city', String(params.city));
    if (params.lat !== undefined) qs.set('lat', String(params.lat));
    if (params.lng !== undefined) qs.set('lng', String(params.lng));
    if (params.radius_m !== undefined) qs.set('radius_m', String(params.radius_m));
    if (params.stale_s !== undefined) qs.set('stale_s', String(params.stale_s));
    if (params.limit !== undefined) qs.set('limit', String(params.limit));

    return this.request(`/live-locations?${qs.toString()}`, {
      method: 'GET',
    });
  }

  async createTaxiRide(data: {
    pickup_address?: string;
    dropoff_address?: string;
    pickup_lat?: number;
    pickup_lng?: number;
    dropoff_lat?: number;
    dropoff_lng?: number;
    is_shared?: boolean;
    options?: Record<string, any>;
  }): Promise<ApiResponse<any>> {
    return this.request('/taxi/rides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelTaxiRide(id: string): Promise<ApiResponse<any>> {
    return this.request(`/taxi/rides/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async acceptTaxiRide(id: string): Promise<ApiResponse<any>> {
    return this.request(`/taxi/rides/${encodeURIComponent(id)}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async declineTaxiRide(id: string): Promise<ApiResponse<any>> {
    return this.request(`/taxi/rides/${encodeURIComponent(id)}/decline`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getTaxiRoute(params: {
    from_lat: number;
    from_lng: number;
    to_lat: number;
    to_lng: number;
  }): Promise<ApiResponse<{ geometry: any; distance_m: number; duration_s: number }>> {
    const qs = new URLSearchParams();
    qs.set('from_lat', String(params.from_lat));
    qs.set('from_lng', String(params.from_lng));
    qs.set('to_lat', String(params.to_lat));
    qs.set('to_lng', String(params.to_lng));
    return this.request(`/taxi/route?${qs.toString()}`, {
      method: 'GET',
    });
  }

  async getStoreProducts(params?: {
    q?: string;
    agency_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.agency_id) qs.set('agency_id', params.agency_id);
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    if (params?.offset !== undefined) qs.set('offset', String(params.offset));
    const query = qs.toString();

    return this.request(`/store/products${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async storeCheckout(data: {
    items: Array<{ article_id: string; quantity: number }>;
    client_name?: string;
    client_phone?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/store/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // =====================================================
  // �🔧 MÉTHODES UTILITAIRES
  // =====================================================

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Erreur récupération token:', error);
      return null;
    }
  }

  private async refreshToken(): Promise<string | null> {
    // Si un refresh est déjà en cours, attendre le résultat
    if (this.refreshPromise) {
      console.log('🔄 Refresh token déjà en cours, attente...');
      return this.refreshPromise;
    }

    // Créer une nouvelle promesse de refresh
    this.refreshPromise = this.performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      // Nettoyer la promesse une fois terminée
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) return null;

      console.log('🔄 Exécution du refresh token...');
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.access_token) {
          await AsyncStorage.setItem('auth_token', data.data.access_token);
          console.log('✅ Token refresh réussi');
          return data.data.access_token;
        }
      }
      console.log('❌ Token refresh échoué');
      return null;
    } catch (error) {
      console.error('Erreur refresh token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      // Récupérer le token à chaque appel (pas de cache)
      const token = await this.getAuthToken();
      const fullUrl = `${this.baseURL}${endpoint}`;

      const method = (options.method || 'GET').toUpperCase();

      console.log(`🌐 API Request${isRetry ? ' (RETRY)' : ''}:`, {
        url: fullUrl,
        method,
        hasToken: !!token,
        hasBody: Boolean(options.body)
      });

      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      const response = await fetch(fullUrl, config);

      console.log('📡 API Response Status:', response.status);

      const rawText = await response.text();
      const data = rawText ? (() => {
        try {
          return JSON.parse(rawText);
        } catch {
          return rawText;
        }
      })() : null;

      if (!response.ok && response.status !== 401) {
        console.log('📥 API Error Data:', data);
        return {
          success: false,
          error: (data as any)?.error || (typeof data === 'string' ? data : 'Erreur réseau'),
          code: (data as any)?.code,
          data: (data as any)?.data,
          message: (data as any)?.message,
        } as ApiResponse<T>;
      }

      console.log('📥 API Response Data:', this.sanitizeForLog(data));

      if (!response.ok) {
        // Si erreur 401 et qu'on a un token ET que ce n'est pas déjà un retry
        if (response.status === 401 && token && !isRetry) {
          console.log('🔄 Token expiré, tentative de refresh...');

          const newToken = await this.refreshToken();
          if (newToken) {
            // Attendre plus longtemps pour la synchronisation backend
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Retry avec le flag isRetry = true pour éviter la boucle infinie
            return this.request<T>(endpoint, options, true);
          } else {
            console.log('❌ Impossible d\'obtenir un nouveau token');
          }
        }

        return {
          success: false,
          error: (data as any)?.error || 'Erreur réseau',
          code: (data as any)?.code,
          data: (data as any)?.data,
          message: (data as any)?.message,
        } as ApiResponse<T>;
      }

      if (this.shouldCache(method, endpoint)) {
        await this.saveGetCache(endpoint, data, token);
      }

      return data;
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);

      const method = (options.method || 'GET').toUpperCase();
      if (this.shouldCache(method, endpoint)) {
        const cached = await this.readGetCache(endpoint, await this.getAuthToken());
        if (cached) {
          console.log(`📦 Using cached GET response for ${endpoint}`);
          try {
            DeviceEventEmitter.emit('api_cache_hit', { endpoint, ts: Date.now() });
          } catch {
          }
          return cached as ApiResponse<T>;
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // =====================================================
  // 🔐 AUTHENTIFICATION
  // =====================================================

  async checkPhoneExists(phone: string): Promise<ApiResponse<{ exists: boolean; is_active?: boolean | null; is_verified?: boolean | null; message?: string }>> {
    console.log('🔍 API CheckPhone - Vérification du numéro:', phone);

    const result = await this.request(`/auth/check-phone?phone=${encodeURIComponent(phone)}`, {
      method: 'GET',
    });

    console.log('📥 API CheckPhone - Réponse reçue:', result);
    return result as ApiResponse<{ exists: boolean; is_active?: boolean | null; is_verified?: boolean | null; message?: string }>;
  }

  async register(data: {
    phone: string;
    full_name: string;
    email?: string;
    password: string;
    country_code?: string;
  }): Promise<ApiResponse<{ user: User; message: string }>> {
    console.log('🚀 API Register - Envoi des données:', data);
    console.log('🌐 URL:', `${this.baseURL}/auth/register`);

    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('📥 API Register - Réponse reçue:', result);
    return result as ApiResponse<{ user: User; message: string }>;
  }

  async verifyOTP(data: {
    phone: string;
    otp_code: string;
  }): Promise<ApiResponse<{ user: User; message: string }>> {
    console.log('🔐 API VerifyOTP - Envoi des données:', data);

    const result = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('📥 API VerifyOTP - Réponse reçue:', result);
    return result as ApiResponse<{ user: User; message: string }>;
  }


  async sendOTP(phone: string): Promise<ApiResponse<{ otp_code: string; message: string }>> {
    console.log('📱 API SendOTP - Envoi OTP pour:', phone);

    const result = await this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });

    console.log('📥 API SendOTP - Réponse reçue:', result);
    return result as ApiResponse<{ otp_code: string; message: string }>;
  }


  async login(data: {
    identifier: string; // email, phone ou user_id_display
    password: string;
  }): Promise<
    ApiResponse<{ user: User; access_token: string; refresh_token?: string }> & {
      requires_2fa?: boolean;
      challenge_id?: string;
      methods?: string[];
    }
  > {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Cas classique: login sans 2FA -> on reçoit les tokens dans data
    if (response.success && response.data) {
      const payload = response.data as any;
      if (payload.access_token) {
        await AsyncStorage.setItem('auth_token', payload.access_token);
        if (payload.refresh_token) {
          await AsyncStorage.setItem('refresh_token', payload.refresh_token);
        } else {
          await AsyncStorage.removeItem('refresh_token');
        }
        await AsyncStorage.setItem('user', JSON.stringify(payload.user));
      }
    }

    // En cas de 2FA, le backend renvoie requires_2fa au niveau racine, sans data
    return response as ApiResponse<{ user: User; access_token: string; refresh_token?: string }> & {
      requires_2fa?: boolean;
      challenge_id?: string;
      methods?: string[];
    };
  }

  async verifyTwoFactorLogin(data: {
    challenge_id: string;
    method: 'authenticator' | 'whatsapp';
    code: string;
  }): Promise<ApiResponse<{ user: User; access_token: string; refresh_token?: string }>> {
    const response = await this.request('/auth/login/2fa-verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      const payload = response.data as any;
      if (payload.access_token) {
        await AsyncStorage.setItem('auth_token', payload.access_token);
        if (payload.refresh_token) {
          await AsyncStorage.setItem('refresh_token', payload.refresh_token);
        } else {
          await AsyncStorage.removeItem('refresh_token');
        }
        await AsyncStorage.setItem('user', JSON.stringify(payload.user));
      }
    }

    return response as ApiResponse<{ user: User; access_token: string; refresh_token?: string }>;
  }

  async sendLoginTwoFactorCode(data: {
    challenge_id: string;
    method: 'whatsapp';
  }): Promise<ApiResponse<{ method: string; expires_in: number; simulation?: boolean }>> {
    const response = await this.request('/auth/login/2fa-send-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response as ApiResponse<{ method: string; expires_in: number; simulation?: boolean }>;
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user']);
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  }

  // =====================================================
  // 👤 PROFIL UTILISATEUR
  // =====================================================

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/users/profile');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    const result = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    console.log('📥 API UpdateProfile - Réponse reçue:', result);
    return result as ApiResponse<{ user: User }>;
  }

  async getUserStats(): Promise<ApiResponse<{
    current_level: any;
    next_level: any;
    progression: any;
    account_age_days: number;
  }>> {
    return this.request('/auth/stats');
  }

  async changePassword(data: {
    current_password: string;
    new_password: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // =====================================================
  // 🔐 RÉINITIALISATION MOT DE PASSE
  // =====================================================

  async forgotPassword(phone: string): Promise<ApiResponse<{ message: string }>> {
    console.log('🔐 API ForgotPassword - Demande reset pour:', phone);

    const result = await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });

    console.log('📥 API ForgotPassword - Réponse reçue:', result);
    return result as ApiResponse<{ message: string }>;
  }

  async verifyResetOtp(data: {
    phone: string;
    otp_code: string;
  }): Promise<ApiResponse<{ message: string; reset_token: string; expires_at?: string }>> {
    console.log('🔐 API VerifyResetOtp - Vérification code pour:', data.phone);

    const result = await this.request('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('📥 API VerifyResetOtp - Réponse reçue:', result);
    return result as ApiResponse<{ message: string; reset_token: string; expires_at?: string }>;
  }

  async resetPassword(data: {
    phone: string;
    new_password: string;
    reset_token?: string;
    otp_code?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    console.log('🔐 API ResetPassword - Réinitialisation pour:', data.phone);

    const result = await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('📥 API ResetPassword - Réponse reçue:', result);
    return result as ApiResponse<{ message: string }>;
  }

  // =====================================================
  // 🎒 SAC À DOS
  // =====================================================

  async getBackpack(): Promise<ApiResponse<{
    items: BackpackItem[];
    items_by_category: Record<string, BackpackItem[]>;
    total_items: number;
    categories: string[];
  }>> {
    return this.request('/profile/backpack');
  }

  async useBackpackItem(itemId: string): Promise<ApiResponse<{
    effect: any;
    item_consumed: boolean;
  }>> {
    return this.request(`/profile/backpack/use/${itemId}`, {
      method: 'POST',
    });
  }

  async deleteBackpackItem(itemId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/profile/backpack/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async getBackpackStats(): Promise<ApiResponse<{ stats: any }>> {
    return this.request('/profile/backpack/stats');
  }

  // =====================================================
  // 💰 PORTEFEUILLE ET TRANSACTIONS
  // =====================================================

  async getWallet(): Promise<ApiResponse<{
    wallet: {
      balance: number;
      currency: string;
      status: string;
    };
    points: number;
    statistics: any;
    recent_transactions: Transaction[];
  }>> {
    return this.request('/wallet');
  }

  async getTransactions(params?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    transactions: Transaction[];
    pagination: any;
    summary: any;
  }>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/wallet/transactions${queryParams ? `?${queryParams}` : ''}`);
  }

  async createTransaction(data: {
    type: string;
    amount: number;
    description?: string;
    payment_method?: string;
  }): Promise<ApiResponse<{ transaction: Transaction }>> {
    return this.request('/wallet/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // =====================================================
  // 🔔 NOTIFICATIONS
  // =====================================================

  async getNotifications(params?: {
    type?: string;
    is_read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    notifications: Notification[];
    pagination: any;
    stats: any;
  }>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/notifications${queryParams ? `?${queryParams}` : ''}`);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<{ message: string }>> {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // =====================================================
  // 🔒 SÉCURITÉ
  // =====================================================

  async getSecuritySettings(): Promise<ApiResponse<{
    security_settings: any;
    last_password_change: string;
    active_sessions: number;
  }>> {
    return this.request('/profile/security');
  }

  async updateSecuritySettings(settings: {
    authenticator_enabled?: boolean;
    two_factor_enabled?: boolean;
    login_alerts_enabled?: boolean;
  }): Promise<ApiResponse<{ security_settings: any }>> {
    return this.request('/auth/security-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getActiveSessions(): Promise<ApiResponse<{
    sessions: any[];
    total_sessions: number;
    active_sessions: number;
  }>> {
    return this.request('/profile/security/sessions');
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/profile/security/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // =====================================================
  // ⚙️ PARAMÈTRES
  // =====================================================

  async getNotificationSettings(): Promise<ApiResponse<{ notification_settings: any }>> {
    return this.request('/profile/settings/notifications');
  }

  async updateNotificationSettings(data: any): Promise<ApiResponse<{ notification_settings: any }>> {
    return this.request('/profile/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 📧 ENVOI DE NOTIFICATIONS
  // =====================================================

  async sendEmailNotification(data: {
    to: string;
    subject: string;
    body: string;
    template?: string;
    data?: Record<string, any>;
  }): Promise<ApiResponse<{ message_id: string; status: string }>> {
    console.log('📧 API SendEmail - Envoi email vers:', data.to);

    return this.request('/notifications/send/email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendSMSNotification(data: {
    to: string;
    message: string;
    type?: 'transactional' | 'marketing' | 'otp';
  }): Promise<ApiResponse<{ message_id: string; status: string }>> {
    console.log('📱 API SendSMS - Envoi SMS vers:', data.to);

    return this.request('/notifications/send/sms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendWhatsAppNotification(data: {
    to: string;
    message: string;
    template?: string;
    data?: Record<string, any>;
  }): Promise<ApiResponse<{ message_id: string; status: string }>> {
    console.log('💬 API SendWhatsApp - Envoi WhatsApp vers:', data.to);

    return this.request('/notifications/send/whatsapp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async testNotificationService(type: 'email' | 'sms' | 'whatsapp'): Promise<ApiResponse<{
    service_status: 'operational' | 'degraded' | 'down';
    response_time: number;
    last_test: string;
  }>> {
    console.log(`🧪 API TestNotification - Test service ${type}`);

    return this.request(`/notifications/test/${type}`, {
      method: 'POST',
    });
  }

  async getGeneralSettings(): Promise<ApiResponse<{
    general_settings: any;
    available_languages: any[];
    available_currencies: any[];
  }>> {
    return this.request('/profile/settings/general');
  }

  async updateGeneralSettings(data: any): Promise<ApiResponse<{ general_settings: any }>> {
    return this.request('/profile/settings/general', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // =====================================================
  // 🔒 CONFIDENTIALITÉ
  // =====================================================

  async getPrivacySettings(): Promise<ApiResponse<{
    privacy_settings: any;
    data_collected: any;
    account_created: string;
    data_retention_days: number;
  }>> {
    const result = await this.request('/profile/privacy/settings', {
      method: 'GET',
    });
    return result as ApiResponse<{
      privacy_settings: any;
      data_collected: any;
      account_created: string;
      data_retention_days: number;
    }>;
  }

  async updatePrivacySettings(settings: any): Promise<ApiResponse<{ message: string }>> {
    const result = await this.request('/profile/privacy/settings', {
      method: 'PUT',
      body: JSON.stringify({ privacy_settings: settings }),
    });
    return result as ApiResponse<{ message: string }>;
  }

  async deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
    const result = await this.request('/profile/privacy/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({
        password,
        confirmation: 'DELETE_MY_ACCOUNT' // Valeur exacte requise par l'API
      }),
    });
    return result as ApiResponse<{ message: string }>;
  }

  async exportUserData(): Promise<ApiResponse<{
    download_url: string;
    data: any;
  }>> {
    const result = await this.request('/profile/privacy/export-data', {
      method: 'POST',
    });
    return result as ApiResponse<{ download_url: string; data: any }>;
  }

  // =====================================================
  // 🔐 AUTHENTIFICATION À DEUX FACTEURS (2FA)
  // =====================================================

  async sendTwoFactorCode(data: {
    method: 'whatsapp';
    phone_number: string;
  }): Promise<ApiResponse<{
    method: string;
    expires_in: number;
  }>> {
    const result = await this.request('/profile/security/2fa/send-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result as ApiResponse<{ method: string; expires_in: number }>;
  }

  async generateAuthenticatorQR(): Promise<ApiResponse<{
    qr_code: string;
    manual_entry_key: string;
    temp_secret: string;
  }>> {
    const result = await this.request('/profile/security/2fa/generate-qr', {
      method: 'POST',
    });
    return result as ApiResponse<{
      qr_code: string;
      manual_entry_key: string;
      temp_secret: string
    }>;
  }

  async verifyTwoFactorCode(data: {
    code: string;
    method: 'authenticator' | 'whatsapp';
    temp_secret?: string; // Nécessaire pour Authenticator
  }): Promise<ApiResponse<{
    verified: boolean;
    method: string;
  }>> {
    const result = await this.request('/profile/security/2fa/verify-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result as ApiResponse<{ verified: boolean; method: string }>;
  }

  async setupTwoFactor(data: {
    phone_number?: string; // Optionnel pour Authenticator
    method: 'authenticator' | 'whatsapp';
    verification_code: string;
    temp_secret?: string; // Nécessaire pour Authenticator
  }): Promise<ApiResponse<{
    two_factor_enabled: boolean;
    method: string;
    backup_codes: string[];
  }>> {
    const result = await this.request('/profile/security/2fa/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result as ApiResponse<{
      two_factor_enabled: boolean;
      method: string;
      backup_codes: string[]
    }>;
  }

  async disableTwoFactor(data: {
    current_password: string;
    confirmation_code?: string;
  }): Promise<ApiResponse<{
    two_factor_enabled: boolean;
  }>> {
    const result = await this.request('/profile/security/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result as ApiResponse<{ two_factor_enabled: boolean }>;
  }

}

// Instance singleton
export const apiService = new ApiService();
export default apiService;
