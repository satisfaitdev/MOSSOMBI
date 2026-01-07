/**
 * Constantes partagées pour les opérations de wallet
 */

import React from 'react';
import { View } from 'react-native';
import { CreditCard, Smartphone, Bitcoin, DollarSign } from 'lucide-react-native';
import { PaymentMethod, Operator, PaymentMethodId } from './types';

export const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000] as const;

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'mobile-money', name: 'Mobile Money', icon: Smartphone, color: '#10B981' },
  { id: 'card', name: 'Carte bancaire', icon: CreditCard, color: '#3B82F6' },
  { id: 'crypto', name: 'Crypto', icon: Bitcoin, color: '#F59E0B' },
  { id: 'paypal', name: 'PayPal', icon: DollarSign, color: '#0070BA' },
];

export const OPERATORS: Record<PaymentMethodId, Operator[]> = {
  'mobile-money': [
    { id: 'mtn', name: 'MTN', color: '#FFCC00' },
    { id: 'airtel', name: 'Airtel', color: '#ED1C24' },
    { id: 'orange', name: 'Orange', color: '#FF7900' },
    { id: 'vodacom', name: 'Vodacom', color: '#E60000' },
  ],
  'crypto': [
    { id: 'usdt', name: 'USDT', color: '#26A17B' },
    { id: 'btc', name: 'Bitcoin', color: '#F7931A' },
    { id: 'eth', name: 'Ethereum', color: '#627EEA' },
  ],
  'card': [],
  'paypal': [],
};

// Composant par défaut pour éviter l'erreur Expo Router
export default function WalletConstants() {
  return React.createElement(View);
}
