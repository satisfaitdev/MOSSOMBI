/**
 * HOOK PORTEFEUILLE - MOSSOMBI
 * Gestion du portefeuille et des transactions avec les APIs backend
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService, Transaction } from '../services/api';

interface WalletState {
  balance: number;
  currency: string;
  status: string;
  points: number;
  statistics: any;
  recentTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

interface TransactionsState {
  transactions: Transaction[];
  pagination: any;
  summary: any;
  isLoading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    balance: 0,
    currency: 'CDF',
    status: 'active',
    points: 0,
    statistics: {},
    recentTransactions: [],
    isLoading: false,
    error: null,
  });

  const [transactionsState, setTransactionsState] = useState<TransactionsState>({
    transactions: [],
    pagination: {},
    summary: {},
    isLoading: false,
    error: null,
  });

  // Charger les informations du portefeuille
  const loadWallet = useCallback(async () => {
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getWallet();
      
      if (response.success && response.data) {
        setWalletState({
          balance: response.data.wallet?.balance || 0,
          currency: response.data.wallet?.currency || 'CDF',
          status: response.data.wallet?.status || 'active',
          points: response.data.points || 0,
          statistics: response.data.statistics || {},
          recentTransactions: response.data.recent_transactions || [],
          isLoading: false,
          error: null,
        });
      } else {
        setWalletState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Erreur de chargement du portefeuille',
        }));
      }
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de chargement',
      }));
    }
  }, []);

  // Charger les transactions
  const loadTransactions = useCallback(async (params?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    setTransactionsState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getTransactions(params);
      
      if (response.success && response.data) {
        setTransactionsState({
          transactions: response.data.transactions,
          pagination: response.data.pagination,
          summary: response.data.summary,
          isLoading: false,
          error: null,
        });
      } else {
        setTransactionsState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Erreur de chargement des transactions',
        }));
      }
    } catch (error) {
      setTransactionsState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de chargement',
      }));
    }
  }, []);

  // Créer une nouvelle transaction
  const createTransaction = useCallback(async (data: {
    type: string;
    amount: number;
    description?: string;
    payment_method?: string;
  }) => {
    try {
      const response = await apiService.createTransaction(data);
      
      if (response.success) {
        // Recharger le portefeuille et les transactions
        await Promise.all([loadWallet(), loadTransactions()]);
        
        return { 
          success: true, 
          transaction: response.data?.transaction,
          message: response.message 
        };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de transaction' 
      };
    }
  }, [loadWallet, loadTransactions]);

  // Filtrer les transactions par type
  const getTransactionsByType = useCallback((type: string) => {
    return transactionsState.transactions.filter(transaction => transaction.type === type);
  }, [transactionsState.transactions]);

  // Filtrer les transactions par statut
  const getTransactionsByStatus = useCallback((status: string) => {
    return transactionsState.transactions.filter(transaction => transaction.status === status);
  }, [transactionsState.transactions]);

  // Obtenir les transactions récentes (dernières 24h)
  const getRecentTransactions = useCallback((hours: number = 24) => {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return transactionsState.transactions.filter(transaction => 
      new Date(transaction.created_at) > cutoffDate
    );
  }, [transactionsState.transactions]);

  // Calculer le total des revenus
  const getTotalIncome = useCallback(() => {
    return transactionsState.transactions
      .filter(t => ['recharge', 'refund', 'bonus'].includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactionsState.transactions]);

  // Calculer le total des dépenses
  const getTotalExpenses = useCallback(() => {
    return transactionsState.transactions
      .filter(t => ['payment', 'transfer', 'withdrawal'].includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactionsState.transactions]);

  // Obtenir les statistiques personnalisées
  const getCustomStats = useCallback(() => {
    const income = getTotalIncome();
    const expenses = getTotalExpenses();
    const pending = transactionsState.transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netAmount: income - expenses,
      pendingAmount: pending,
      transactionCount: transactionsState.transactions.length,
      averageTransaction: transactionsState.transactions.length > 0 
        ? (income + expenses) / transactionsState.transactions.length 
        : 0,
    };
  }, [getTotalIncome, getTotalExpenses, transactionsState.transactions]);

  // Charger automatiquement au démarrage
  useEffect(() => {
    loadWallet();
    loadTransactions();
  }, [loadWallet, loadTransactions]);

  return {
    // État du portefeuille
    wallet: {
      balance: walletState.balance,
      currency: walletState.currency,
      status: walletState.status,
      points: walletState.points,
      statistics: walletState.statistics,
      recentTransactions: walletState.recentTransactions,
      isLoading: walletState.isLoading,
      error: walletState.error,
    },
    
    // État des transactions
    transactions: {
      list: transactionsState.transactions,
      pagination: transactionsState.pagination,
      summary: transactionsState.summary,
      isLoading: transactionsState.isLoading,
      error: transactionsState.error,
    },
    
    // Actions
    loadWallet,
    loadTransactions,
    createTransaction,
    
    // Utilitaires de filtrage
    getTransactionsByType,
    getTransactionsByStatus,
    getRecentTransactions,
    getTotalIncome,
    getTotalExpenses,
    getCustomStats,
    
    // Helpers
    clearWalletError: () => setWalletState(prev => ({ ...prev, error: null })),
    clearTransactionsError: () => setTransactionsState(prev => ({ ...prev, error: null })),
    refresh: () => Promise.all([loadWallet(), loadTransactions()]),
  };
};
