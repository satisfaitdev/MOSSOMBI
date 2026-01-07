import { LinearGradient } from 'expo-linear-gradient';
import { X, ExternalLink } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Linking, ImageBackground, ImageSourcePropType } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/colors';

interface AdBannerProps {
  title?: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
  onClose?: () => void;
  closeable?: boolean;
  imageUrl?: ImageSourcePropType;
}

export default function AdBanner({
  title = 'Info',
  description = '',
  ctaText = 'En savoir plus',
  ctaUrl,
  onClose,
  closeable = true,
  imageUrl,
}: AdBannerProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  const handlePress = () => {
    if (ctaUrl) {
      Linking.openURL(ctaUrl);
    }
  };

  if (!visible) return null;

  const content = (
    <>
      {closeable && (
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [
            styles.closeButton,
            { opacity: pressed ? 0.7 : 1, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: BORDER_RADIUS.full },
          ]}
          hitSlop={8}
        >
          <X size={16} color="#FFFFFF" />
        </Pressable>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.bold }]}>
          {title}
        </Text>
        <Text style={[styles.description, { fontSize: TYPOGRAPHY.sizes.xs, marginTop: SPACING.xs / 2 }]}>
          {description}
        </Text>

        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.ctaButton,
            { backgroundColor: 'rgba(255, 255, 255, 0.9)', opacity: pressed ? 0.8 : 1, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.sm },
          ]}
        >
          <Text style={[styles.ctaText, { fontSize: TYPOGRAPHY.sizes.xs, fontWeight: TYPOGRAPHY.weights.semibold, color: colors.primary }]}>
            {ctaText}
          </Text>
          <ExternalLink size={14} color={colors.primary} />
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={[styles.container, SHADOWS.md]}>
      {imageUrl ? (
        <ImageBackground
          source={imageUrl}
          style={[styles.banner, { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' }]}
          imageStyle={{ borderRadius: BORDER_RADIUS.lg }}
        >
          <View style={styles.overlay} />
          {content}
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.banner, { borderRadius: BORDER_RADIUS.lg }]}
        >
          {content}
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    padding: SPACING.md,
    position: 'relative',
    minHeight: 140,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: BORDER_RADIUS.lg,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  content: {
    paddingRight: SPACING.xl,
    zIndex: 1,
  },
  title: {
    color: '#FFFFFF',
  },
  description: {
    color: '#FFFFFF',
    opacity: 0.95,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: '#FFFFFF',
  },
});
