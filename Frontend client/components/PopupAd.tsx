import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/colors';

const { width } = Dimensions.get('window');

interface PopupAdProps {
  visible: boolean;
  title: string;
  description: string;
  ctaText?: string;
  onClose: () => void;
  onCta?: () => void;
}

export default function PopupAd({
  visible,
  title,
  description,
  ctaText = 'Découvrir',
  onClose,
  onCta,
}: PopupAdProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { width: width - SPACING.xl * 2 }]}>
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.content, SHADOWS.xl, { borderRadius: BORDER_RADIUS.xl }]}
          >
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.7 : 1, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: BORDER_RADIUS.full },
              ]}
              hitSlop={8}
            >
              <X size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.body}>
              <Text style={[styles.title, { fontSize: TYPOGRAPHY.sizes.xxl, fontWeight: TYPOGRAPHY.weights.bold }]}>
                {title}
              </Text>
              <Text style={[styles.description, { fontSize: TYPOGRAPHY.sizes.md, marginTop: SPACING.md }]}>
                {description}
              </Text>

              <View style={[styles.actions, { marginTop: SPACING.xl, gap: SPACING.md }]}>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.button,
                    styles.secondaryButton,
                    { backgroundColor: 'rgba(255, 255, 255, 0.2)', opacity: pressed ? 0.8 : 1, borderRadius: BORDER_RADIUS.lg },
                  ]}
                >
                  <Text style={[styles.buttonText, { fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold }]}>
                    Plus tard
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    onCta?.();
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    styles.primaryButton,
                    { backgroundColor: '#FFFFFF', opacity: pressed ? 0.8 : 1, borderRadius: BORDER_RADIUS.lg },
                  ]}
                >
                  <Text style={[styles.buttonText, styles.primaryButtonText, { color: colors.primary, fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.bold }]}>
                    {ctaText}
                  </Text>
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    maxWidth: 400,
  },
  content: {
    padding: SPACING.xl,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  body: {
    paddingTop: SPACING.md,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  description: {
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {},
  primaryButton: {},
  buttonText: {
    color: '#FFFFFF',
  },
  primaryButtonText: {},
});
