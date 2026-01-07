/**
 * Types partagés pour les opérations de wallet (recharge/retrait)
 */

import React from 'react';
import { View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

export type PaymentMethodId = 'mobile-money' | 'card' | 'crypto' | 'paypal';
export type OperatorId = 'mtn' | 'airtel' | 'orange' | 'vodacom' | 'usdt' | 'btc' | 'eth';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  icon: LucideIcon;
  color: string;
}

export interface Operator {
  id: OperatorId;
  name: string;
  color: string;
}

export interface WalletFormState {
  amount: string;
  selectedMethod: PaymentMethodId | '';
  selectedOperator: OperatorId | '';
  phoneNumber: string;
}

// Composant par défaut pour éviter l'erreur Expo Router
export default function WalletTypes() {
  return React.createElement(View);
}
