/**
 * HOOK SAC À DOS - MOSSOMBI
 * Gestion du sac à dos avec les APIs backend
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService, BackpackItem } from '../services/api';

interface BackpackState {
  items: BackpackItem[];
  itemsByCategory: Record<string, BackpackItem[]>;
  totalItems: number;
  categories: string[];
  isLoading: boolean;
  error: string | null;
}

export const useBackpack = () => {
  const [backpackState, setBackpackState] = useState<BackpackState>({
    items: [],
    itemsByCategory: {},
    totalItems: 0,
    categories: [],
    isLoading: false,
    error: null,
  });

  // Charger le sac à dos
  const loadBackpack = useCallback(async () => {
    setBackpackState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getBackpack();
      
      if (response.success && response.data) {
        setBackpackState({
          items: response.data.items,
          itemsByCategory: response.data.items_by_category,
          totalItems: response.data.total_items,
          categories: response.data.categories,
          isLoading: false,
          error: null,
        });
      } else {
        setBackpackState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Erreur de chargement du sac à dos',
        }));
      }
    } catch (error) {
      setBackpackState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de chargement',
      }));
    }
  }, []);

  // Utiliser un item
  const useItem = useCallback(async (itemId: string) => {
    try {
      const response = await apiService.useBackpackItem(itemId);
      
      if (response.success) {
        // Recharger le sac à dos après utilisation
        await loadBackpack();
        return { 
          success: true, 
          effect: response.data?.effect,
          consumed: response.data?.item_consumed 
        };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur d\'utilisation' 
      };
    }
  }, [loadBackpack]);

  // Supprimer un item
  const deleteItem = useCallback(async (itemId: string) => {
    try {
      const response = await apiService.deleteBackpackItem(itemId);
      
      if (response.success) {
        // Recharger le sac à dos après suppression
        await loadBackpack();
        return { success: true, message: response.message };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de suppression' 
      };
    }
  }, [loadBackpack]);

  // Obtenir les statistiques du sac à dos
  const getStats = useCallback(async () => {
    try {
      const response = await apiService.getBackpackStats();
      return { success: response.success, stats: response.data?.stats, error: response.error };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de statistiques' 
      };
    }
  }, []);

  // Filtrer les items par catégorie
  const getItemsByCategory = useCallback((category: string) => {
    return backpackState.itemsByCategory[category] || [];
  }, [backpackState.itemsByCategory]);

  // Filtrer les items par rareté
  const getItemsByRarity = useCallback((rarity: string) => {
    return backpackState.items.filter(item => item.rarity === rarity);
  }, [backpackState.items]);

  // Obtenir les items utilisables
  const getUsableItems = useCallback(() => {
    return backpackState.items.filter(item => 
      item.metadata.usable && !item.is_used
    );
  }, [backpackState.items]);

  // Obtenir les items par type d'effet
  const getItemsByEffect = useCallback((effectType: string) => {
    return backpackState.items.filter(item => 
      item.metadata.usable && 
      !item.is_used && 
      (item.metadata.points_value || item.metadata.attack)
    );
  }, [backpackState.items]);

  // Charger automatiquement au démarrage
  useEffect(() => {
    loadBackpack();
  }, [loadBackpack]);

  return {
    // État
    items: backpackState.items,
    itemsByCategory: backpackState.itemsByCategory,
    totalItems: backpackState.totalItems,
    categories: backpackState.categories,
    isLoading: backpackState.isLoading,
    error: backpackState.error,
    
    // Actions
    loadBackpack,
    useItem,
    deleteItem,
    getStats,
    
    // Utilitaires de filtrage
    getItemsByCategory,
    getItemsByRarity,
    getUsableItems,
    getItemsByEffect,
    
    // Helpers
    clearError: () => setBackpackState(prev => ({ ...prev, error: null })),
    refresh: loadBackpack,
  };
};
