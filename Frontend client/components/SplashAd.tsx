import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

const { width } = Dimensions.get('window');
const { height: screenHeight } = Dimensions.get('screen'); // Hauteur complète avec barres système

interface SplashAdProps {
  visible: boolean;
  title: string;
  description: string;
  duration?: number;
  onClose: () => void;
  onCta?: () => void;
}

export default function SplashAd({
  visible,
  title,
  description,
  duration = 5,
  onClose,
  onCta,
}: SplashAdProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [countdown, setCountdown] = useState(duration);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (visible) {
      setCountdown(duration);
      setCanClose(false);

      // Configurer le style des boutons de navigation sur Android
      if (Platform.OS === 'android') {
        NavigationBar.setButtonStyleAsync('light');
      }

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanClose(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        // Restaurer le style des boutons sur Android
        if (Platform.OS === 'android') {
          NavigationBar.setButtonStyleAsync('dark');
        }
      };
    }
  }, [visible, duration]);

  const handleClose = () => {
    if (canClose) {
      // Restaurer le style des boutons sur Android avant de fermer
      if (Platform.OS === 'android') {
        NavigationBar.setButtonStyleAsync('dark');
      }
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      presentationStyle="fullScreen"
      hardwareAccelerated={true}
    >
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {canClose && (
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.closeButton,
              { 
                opacity: pressed ? 0.7 : 1, 
                backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                borderRadius: BORDER_RADIUS.full,
                top: insets.top + SPACING.xl 
              },
            ]}
            hitSlop={8}
          >
            <X size={24} color="#FFFFFF" />
          </Pressable>
        )}

        {!canClose && (
          <View style={[
            styles.countdownBadge, 
            { 
              backgroundColor: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: BORDER_RADIUS.full,
              top: insets.top + SPACING.xl 
            }
          ]}>
            <Text style={[styles.countdownText, { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.bold }]}>
              {countdown}s
            </Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={[styles.title, { fontSize: TYPOGRAPHY.sizes.xxxl * 1.5, fontWeight: TYPOGRAPHY.weights.bold }]}>
            {title}
          </Text>
          <Text style={[styles.description, { fontSize: TYPOGRAPHY.sizes.lg, marginTop: SPACING.xl }]}>
            {description}
          </Text>

          {canClose && onCta && (
            <Pressable
              onPress={() => {
                // Restaurer le style des boutons sur Android avant de fermer
                if (Platform.OS === 'android') {
                  NavigationBar.setButtonStyleAsync('dark');
                }
                onCta();
                onClose();
              }}
              style={({ pressed }) => [
                styles.ctaButton,
                { backgroundColor: '#FFFFFF', opacity: pressed ? 0.9 : 1, borderRadius: BORDER_RADIUS.xl, marginTop: SPACING.xl * 2 },
              ]}
            >
              <Text style={[styles.ctaText, { color: colors.primary, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold }]}>
                Découvrir maintenant
              </Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: screenHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.xl,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  countdownBadge: {
    position: 'absolute',
    right: SPACING.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  countdownText: {
    color: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  description: {
    color: '#FFFFFF',
    opacity: 0.95,
    textAlign: 'center',
  },
  ctaButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl * 2,
  },
  ctaText: {},
});
