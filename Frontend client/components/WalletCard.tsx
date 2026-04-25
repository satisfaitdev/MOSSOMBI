import { Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import LottieView from 'lottie-react-native';
import { Pressable, StyleSheet, Text, View, ActivityIndicator, Image, ImageBackground, Animated } from 'react-native';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { formatCurrencyWithConversion } from '@/utils/localization';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdaptiveCard } from '@/components/ui';

const walletImages = {
  background: require('@/assets/images/wallet/Walletback.webp'),
  recharge: require('@/assets/images/wallet/Walletint.webp'),
  withdraw: require('@/assets/images/wallet/Walletout.webp'),
};

interface WalletCardProps {
  balance?: number;
  points?: number;
  isLoading?: boolean;
  onRecharge?: () => void;
  onWithdraw?: () => void;
  rechargeSuccessKey?: string;
  onRechargeSuccessAnimationFinish?: () => void;
}

export default function WalletCard({
  balance = 0,
  points = 0,
  isLoading = false,
  onRecharge = () => {},
  onWithdraw = () => {},
  rechargeSuccessKey,
  onRechargeSuccessAnimationFinish,
}: WalletCardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [cardWidth, setCardWidth] = useState(0);
  const [showRechargeSuccessAnimation, setShowRechargeSuccessAnimation] = useState(false);
  const { getDisplayCurrency } = useUserPreferences();
  const { t } = useLanguage();

  const rechargeSuccessLottieRef = useRef<LottieView>(null);

  const shimmerTranslate = useRef(new Animated.Value(0)).current;

  const shimmerInputRange = useMemo(() => [-1, 1], []);
  const shimmerOutputRange = useMemo(() => {
    const w = cardWidth || 1;
    return [-w, w];
  }, [cardWidth]);

  useEffect(() => {
    if (cardWidth <= 0) return;

    shimmerTranslate.setValue(-1);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2500),
        Animated.timing(shimmerTranslate, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(shimmerTranslate, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [cardWidth, shimmerTranslate]);

  useEffect(() => {
    if (!rechargeSuccessKey) return;
    setShowRechargeSuccessAnimation(true);

    // Lancer l'animation une fois après le montage de l'overlay
    const t = setTimeout(() => {
      rechargeSuccessLottieRef.current?.play();
    }, 450);

    return () => clearTimeout(t);
  }, [rechargeSuccessKey]);

  return (
    <AdaptiveCard borderRadius={BORDER_RADIUS.xl} padding={0} margin={0}>
      <ImageBackground
        source={walletImages.background}
        style={styles.card}
        imageStyle={styles.cardImage}
        resizeMode="stretch"
        onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
      >
        {showRechargeSuccessAnimation && (
          <View pointerEvents="none" style={styles.rechargeSuccessOverlay}>
            <LottieView
              ref={rechargeSuccessLottieRef}
              source={require('@/assets/images/lotifile/wallet recharge.json')}
              loop={false}
              autoPlay={false}
              onAnimationFinish={() => {
                setShowRechargeSuccessAnimation(false);
                onRechargeSuccessAnimationFinish?.();
              }}
              style={styles.rechargeSuccessLottie}
            />
          </View>
        )}

        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmer,
            {
              transform: [
                {
                  translateX: shimmerTranslate.interpolate({
                    inputRange: shimmerInputRange,
                    outputRange: shimmerOutputRange,
                  }),
                },
                { rotate: '18deg' },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>

        <View style={styles.header}>
          <Text style={[styles.label, styles.textShadow, { fontSize: TYPOGRAPHY.sizes.sm }]}>
            {t('balance')}
          </Text>
          <Pressable
            onPress={() => setShowBalance(!showBalance)}
            style={({ pressed }) => [styles.toggleButton, pressed && styles.toggleButtonPressed]}
            testID="toggle-balance"
          >
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
                <Text
                  style={[
                    styles.balance,
                    styles.textShadowStrong,
                    { fontSize: TYPOGRAPHY.sizes.xxl, fontWeight: TYPOGRAPHY.weights.bold },
                  ]}
                >
                  {showBalance ? formatCurrencyWithConversion(balance ?? 0, getDisplayCurrency(), false) : '••••••'}
                </Text>
                <Text style={[styles.points, styles.textShadow, { fontSize: TYPOGRAPHY.sizes.sm, marginTop: SPACING.xs }]}>
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
                { opacity: pressed ? 0.7 : 1 },
              ]}
              testID="recharge-button"
            >
              <Image source={walletImages.recharge} style={styles.actionIcon} />
            </Pressable>

            <Pressable
              onPress={onWithdraw}
              style={({ pressed }) => [
                styles.iconButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              testID="withdraw-button"
            >
              <Image source={walletImages.withdraw} style={styles.actionIcon} />
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </AdaptiveCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.sm,
    overflow: 'hidden',
  },
  cardImage: {
    borderRadius: BORDER_RADIUS.xl,
  },
  rechargeSuccessOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rechargeSuccessLottie: {
    width: 150,
    height: 150,
  },
  shimmer: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    left: -120,
    width: 110,
    opacity: 0.85,
  },
  shimmerGradient: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
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
  textShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  textShadowStrong: {
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonPressed: {
    transform: [{ translateY: 1 }],
    shadowOpacity: 0.15,
    elevation: 2,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
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
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
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
