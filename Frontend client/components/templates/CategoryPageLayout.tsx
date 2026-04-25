import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

const { height } = Dimensions.get('window');

interface CategoryPageLayoutProps {
  title: string;
  backgroundIcons?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Template de page catégorie avec modal bottom sheet
 * Utilisé pour: public-services, supermarket, bookings, delivery
 */
export default function CategoryPageLayout({
  title,
  backgroundIcons,
  children,
}: CategoryPageLayoutProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [slideAnim] = useState(new Animated.Value(height * 0.3));

  // Animation d'entrée
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />

      {/* Background Gradient avec icônes décoratives */}
      <LinearGradient
        colors={[colors.primary, colors.secondary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pageBackground}
      >
        {backgroundIcons}
      </LinearGradient>

      {/* Overlay et Modal */}
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View
            style={[
              styles.contentContainer,
              { backgroundColor: colors.background },
            ]}
          >
            {/* Handle de fermeture */}
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: colors.border },
                ]}
              />
            </View>

            {/* Header avec titre et bouton fermer */}
            <View style={[styles.header, { paddingTop: SPACING.md }]}>
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.text,
                    fontSize: TYPOGRAPHY.sizes.xxl,
                    fontWeight: TYPOGRAPHY.weights.bold,
                  },
                ]}
              >
                {title}
              </Text>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor: colors.card,
                    borderRadius: BORDER_RADIUS.full,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: SPACING.lg,
                  paddingBottom: SPACING.xxl + insets.bottom + 50,
                }}
              >
                <View style={styles.grid}>{children}</View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    maxHeight: height * 0.85,
  },
  contentContainer: {
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    minHeight: height * 0.7,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  title: {},
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
});
