/**
 * CONTEXTE D'AUTHENTIFICATION - MOSSOMBI
 * Gestion globale de l'état d'authentification
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, User } from '../services/api';
import { notificationService } from '../services/notificationService';
import { feedbackService } from '../services/feedbackService';
import { biometricService } from '../services/biometricService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean; // Nouveau: pour les actions de connexion/inscription
  error: string | null;
  login: (
    identifier: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
    requires2FA?: boolean;
    challengeId?: string;
    methods?: string[];
  }>;
  verifyLogin2FA: (params: {
    challengeId: string;
    method: 'authenticator' | 'whatsapp';
    code: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  checkPhoneExists: (phone: string) => Promise<{ success: boolean; exists?: boolean; error?: string; data?: any }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const segments = useSegments();

  // Vérification rapide de l'authentification au démarrage
  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      
      // Initialiser les services de feedback en arrière-plan
      setTimeout(async () => {
        try {
          await feedbackService.initialize();
          await biometricService.initialize();
          console.log('✅ Services de feedback initialisés');
        } catch (error) {
          console.warn('⚠️ Erreur initialisation services feedback:', error);
        }
      }, 500);
      
      const [token, userString] = await AsyncStorage.multiGet(['auth_token', 'user']);
      
      if (token[1] && userString[1]) {
        // Token et utilisateur trouvés - connexion immédiate
        const storedUser = JSON.parse(userString[1]);
        setUser(storedUser);
        setIsAuthenticated(true);
        setIsLoading(false); // Arrêter le loading immédiatement
        
        // Vérification en arrière-plan (non bloquante)
        setTimeout(async () => {
          try {
            const response = await apiService.getProfile();
            
            if (response.success && response.data) {
              // Token valide, mettre à jour si nécessaire
              const nextUser = (response.data as any)?.user;
              if (nextUser && JSON.stringify(storedUser) !== JSON.stringify(nextUser)) {
                setUser(nextUser);
                await AsyncStorage.setItem('user', JSON.stringify(nextUser));
              } else if (!nextUser) {
                await AsyncStorage.removeItem('user');
              }
            } else {
              // Token invalide - déconnecter
              await clearAuthData();
            }
          } catch (error) {
            // Erreur réseau - garder connecté
            console.warn('Vérification token en arrière-plan échouée:', error);
          }
        }, 100);
      } else {
        // Pas de données stockées
        await clearAuthData();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      await clearAuthData();
      setIsLoading(false);
    }
  };

  // Nettoyer les données d'authentification
  const clearAuthData = async () => {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user']);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erreur nettoyage auth:', error);
    }
  };

  // Redirection automatique basée sur l'état d'authentification
  useEffect(() => {
    if (isLoading) return; // Attendre la vérification

    const inAuthGroup = segments[0] === 'auth';

    // Redirection immédiate pour éviter le flash de contenu
    if (!isAuthenticated && !inAuthGroup) {
      // Utilisateur non connecté et pas sur les pages d'auth -> rediriger vers login
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Utilisateur connecté mais sur les pages d'auth -> rediriger vers l'accueil
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, isLoading, segments, router]);

  // Connexion
  const login = async (identifier: string, password: string) => {
    try {
      setIsAuthenticating(true);
      setError(null);
      
      const response = await apiService.login({ identifier, password });

      const requires2FA = (response as any).requires_2fa;
      const challengeId = (response as any).challenge_id as string | undefined;
      const methods = (response as any).methods as string[] | undefined;

      // Cas 2FA: on ne connecte pas tout de suite l'utilisateur
      if (response.success && requires2FA) {
        return {
          success: true,
          requires2FA: true,
          challengeId,
          methods: methods || [],
        };
      }
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        // 🔔 Envoyer notification de bienvenue
        try {
          const userName = response.data.user.full_name?.split(' ')[0] || 'Utilisateur';
          await notificationService.scheduleNotification(
            {
              title: `👋 Bienvenue ${userName} !`,
              body: 'Heureux de vous revoir sur Mossombi ! Découvrez les nouvelles fonctionnalités.',
              data: { type: 'welcome', userId: response.data.user.id },
            },
            { type: 'timeInterval', seconds: 2, repeats: false } as any // Trigger séparé - notification dans 2 secondes
          );
          console.log('🔔 Notification de bienvenue programmée');
        } catch (error) {
          console.log('⚠️ Impossible d\'envoyer la notification de bienvenue:', error);
        }
        
        return { success: true };
      } else {
        setError(response.error || 'Erreur de connexion');
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Vérification 2FA pour le login
  const verifyLogin2FA = async ({
    challengeId,
    method,
    code,
  }: {
    challengeId: string;
    method: 'authenticator' | 'whatsapp';
    code: string;
  }) => {
    try {
      setIsAuthenticating(true);
      setError(null);

      const response = await apiService.verifyTwoFactorLogin({
        challenge_id: challengeId,
        method,
        code,
      });

      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);

        // 🔔 Envoyer notification de bienvenue (connexion finalisée)
        try {
          const userName = response.data.user.full_name?.split(' ')[0] || 'Utilisateur';
          await notificationService.scheduleNotification(
            {
              title: `👋 Bienvenue ${userName} !`,
              body: 'Heureux de vous revoir sur Mossombi ! Découvrez les nouvelles fonctionnalités.',
              data: { type: 'welcome', userId: response.data.user.id },
            },
            { type: 'timeInterval', seconds: 2, repeats: false } as any
          );
          console.log('🔔 Notification de bienvenue programmée (2FA)');
        } catch (error) {
          console.log('⚠️ Impossible d\'envoyer la notification de bienvenue (2FA):', error);
        }

        return { success: true };
      } else {
        setError(response.error || 'Code de vérification invalide');
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de vérification';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Inscription
  const register = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.register(data);
      
      if (response.success) {
        // Inscription réussie, mais pas encore vérifié
        return { success: true };
      } else {
        setError(response.error || 'Erreur d\'inscription');
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'inscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Vérification OTP
  const verifyOTP = async (phone: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.verifyOTP({ phone, otp_code: code });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        setError(response.error || 'Code OTP invalide');
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de vérification';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // 🔔 Envoyer notification de déconnexion avant de nettoyer les données
      try {
        const userName = user?.full_name?.split(' ')[0] || 'Utilisateur';
        await notificationService.scheduleNotification(
          {
            title: `👋 À bientôt ${userName} !`,
            body: 'Vous êtes maintenant déconnecté de Mossombi. Merci de votre visite !',
            data: { type: 'logout', userId: user?.id },
          },
          { type: 'timeInterval', seconds: 1, repeats: false } as any // Notification dans 1 seconde
        );
        console.log('🔔 Notification de déconnexion programmée');
      } catch (error) {
        console.log('⚠️ Impossible d\'envoyer la notification de déconnexion:', error);
      }
      
      await apiService.logout();
      await clearAuthData();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      // Forcer la déconnexion même en cas d'erreur
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  // Mise à jour du profil
  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(data);
      
      if (response.success && response.data) {
        const nextUser = (response.data as any)?.user;
        setUser(nextUser || null);
        if (nextUser) {
          await AsyncStorage.setItem('user', JSON.stringify(nextUser));
        } else {
          await AsyncStorage.removeItem('user');
        }
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erreur' };
    }
  };

  // Vérifier si un numéro de téléphone existe déjà
  const checkPhoneExists = async (phone: string) => {
    try {
      const response = await apiService.checkPhoneExists(phone);
      
      if (response.success) {
        return { 
          success: true, 
          exists: response.data?.exists || false,
          data: response.data // Passer les données complètes
        };
      } else {
        return { 
          success: false, 
          error: response.error,
          exists: false 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de vérification',
        exists: false 
      };
    }
  };

  // Nettoyer l'erreur
  const clearError = () => setError(null);

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    checkAuthState();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isAuthenticating,
    error,
    login,
    verifyLogin2FA,
    logout,
    register,
    verifyOTP,
    updateProfile,
    checkPhoneExists,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
