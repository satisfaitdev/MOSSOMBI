/**
 * SERVICE API - MOSSOMBI FRONTEND
 * Connexion aux APIs backend uniquement (pas de Supabase direct)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de base - Utilisation sécurisée des variables d'environnement
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.73:3000/api/v1';

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

// Classe principale du service API
class ApiService {
  private baseURL: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    console.log('🔧 API Service - Configuration:', {
      API_BASE_URL
    });
    
    this.baseURL = API_BASE_URL;
  }

  // =====================================================
  // 🔧 MÉTHODES UTILITAIRES
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
      
      console.log(`🌐 API Request${isRetry ? ' (RETRY)' : ''}:`, {
        url: fullUrl,
        method: options.method || 'GET',
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
        body: options.body
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
      
      if (!response.ok && response.status !== 401) {
        const errorData = await response.json();
        console.log('📥 API Error Data:', errorData);
        throw new Error(errorData.error || 'Erreur réseau');
      }
      
      const data = await response.json();
      
      console.log('📥 API Response Data:', data);

      if (!response.ok) {
        // Si erreur 401 et qu'on a un token ET que ce n'est pas déjà un retry
        if (response.status === 401 && token && !isRetry) {
          console.log('🔄 Token expiré, tentative de refresh...');
          
          const newToken = await this.refreshToken();
          if (newToken) {
            console.log('✅ Nouveau token obtenu:', newToken.substring(0, 50) + '...');
            
            // Vérifier que le token est bien sauvé
            const savedToken = await this.getAuthToken();
            console.log('🔍 Token sauvé:', savedToken?.substring(0, 50) + '...');
            console.log('🔍 Tokens identiques?', newToken === savedToken);
            
            // Attendre plus longtemps pour la synchronisation backend
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Retry avec le flag isRetry = true pour éviter la boucle infinie
            return this.request<T>(endpoint, options, true);
          } else {
            console.log('❌ Impossible d\'obtenir un nouveau token');
          }
        }
        throw new Error(data.error || 'Erreur réseau');
      }

      return data;
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // =====================================================
  // 🔐 AUTHENTIFICATION
  // =====================================================

  async checkPhoneExists(phone: string): Promise<ApiResponse<{ exists: boolean; message: string }>> {
    console.log('🔍 API CheckPhone - Vérification du numéro:', phone);
    
    const result = await this.request(`/auth/check-phone?phone=${encodeURIComponent(phone)}`, {
      method: 'GET',
    });
    
    console.log('📥 API CheckPhone - Réponse reçue:', result);
    return result as ApiResponse<{ exists: boolean; message: string }>;
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
    ApiResponse<{ user: User; access_token: string; refresh_token: string }> & {
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
        await AsyncStorage.setItem('refresh_token', payload.refresh_token);
        await AsyncStorage.setItem('user', JSON.stringify(payload.user));
      }
    }

    // En cas de 2FA, le backend renvoie requires_2fa au niveau racine, sans data
    return response as ApiResponse<{ user: User; access_token: string; refresh_token: string }> & {
      requires_2fa?: boolean;
      challenge_id?: string;
      methods?: string[];
    };
  }

  async verifyLogin2FA(data: {
    challenge_id: string;
    method: 'authenticator' | 'whatsapp';
    code: string;
  }): Promise<ApiResponse<{ user: User; access_token: string; refresh_token: string }>> {
    const response = await this.request('/auth/login/2fa-verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      const payload = response.data as any;
      if (payload.access_token) {
        await AsyncStorage.setItem('auth_token', payload.access_token);
        await AsyncStorage.setItem('refresh_token', payload.refresh_token);
        await AsyncStorage.setItem('user', JSON.stringify(payload.user));
      }
    }

    return response as ApiResponse<{ user: User; access_token: string; refresh_token: string }>;
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
    return this.request('/auth/me');
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

  async resetPassword(data: {
    phone: string;
    otp_code: string;
    new_password: string;
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
