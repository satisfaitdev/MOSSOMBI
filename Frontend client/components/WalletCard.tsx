import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Plus, ArrowDownToLine } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { GRADIENTS } from '@/constants/gradients';
import { formatCurrencyWithConversion } from '@/utils/localization';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface WalletCardProps {
  balance?: number;
  points?: number;
  isLoading?: boolean;
  onRecharge?: () => void;
  onWithdraw?: () => void;
}

export default function WalletCard({
  balance = 0,
  points = 0,
  isLoading = false,
  onRecharge = () => {},
  onWithdraw = () => {},
}: WalletCardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const { getDisplayCurrency } = useUserPreferences();
  const { t } = useLanguage();

  return (
    <LinearGradient
      colors={GRADIENTS.primary.colors}
      start={GRADIENTS.primary.start}
      end={GRADIENTS.primary.end}
      style={[styles.card, SHADOWS.wallet3D]}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { fontSize: TYPOGRAPHY.sizes.sm }]}>
          {t('balance')}
        </Text>
        <Pressable onPress={() => setShowBalance(!showBalance)} testID="toggle-balance">
          {showBalance ? (
            <Eye size={20} color="#FFFFFF" />
          ) : (
            <EyeOff size={20} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.leftContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.loadingText, { fontSize: TYPOGRAPHY.sizes.lg }]}>
                Chargement...
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.balance, { fontSize: TYPOGRAPHY.sizes.xxl, fontWeight: TYPOGRAPHY.weights.bold }]}>
                {showBalance ? formatCurrencyWithConversion(balance ?? 0, getDisplayCurrency(), false) : '••••••'}
              </Text>
              <Text style={[styles.points, { fontSize: TYPOGRAPHY.sizes.sm, marginTop: SPACING.xs }]}>
                ⭐ {(points ?? 0).toLocaleString('fr-FR')} {t('points')}
              </Text>
            </>
          )}
        </View>

        <View style={styles.rightActions}>
          <Pressable
            onPress={onRecharge}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: 'rgba(255, 255, 255, 0.2)', opacity: pressed ? 0.7 : 1 },
            ]}
            testID="recharge-button"
          >
            <Plus size={22} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={onWithdraw}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: 'rgba(255, 255, 255, 0.2)', opacity: pressed ? 0.7 : 1 },
            ]}
            testID="withdraw-button"
          >
            <ArrowDownToLine size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  leftContent: {
    flex: 1,
  },
  balance: {
    color: '#FFFFFF',
  },
  points: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  rightActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
