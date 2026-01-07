import React from 'react';
import { View, Image, Text, ViewStyle, StyleSheet, ImageSourcePropType } from 'react-native';
import { User } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: ImageSourcePropType | string;
  initials?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

// ==========================================
// AVATAR COMPONENT
// ==========================================

/**
 * Avatar component pour afficher des images de profil ou initiales
 * 
 * @example
 * <Avatar source={{ uri: 'https://...' }} size="md" />
 * <Avatar initials="JS" size="lg" />
 * <Avatar size="sm" /> // Affiche icône par défaut
 */
export default function Avatar({
  source,
  initials,
  size = 'md',
  style,
}: AvatarProps) {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: {
      width: 32,
      height: 32,
      fontSize: TYPOGRAPHY.sizes.xs,
      iconSize: 16,
    },
    md: {
      width: 48,
      height: 48,
      fontSize: TYPOGRAPHY.sizes.sm,
      iconSize: 24,
    },
    lg: {
      width: 64,
      height: 64,
      fontSize: TYPOGRAPHY.sizes.md,
      iconSize: 32,
    },
    xl: {
      width: 96,
      height: 96,
      fontSize: TYPOGRAPHY.sizes.lg,
      iconSize: 48,
    },
  };

  const currentSize = sizeStyles[size];

  // Déterminer le contenu
  const renderContent = () => {
    // Si une image est fournie
    if (source) {
      const imageSource = typeof source === 'string' ? { uri: source } : source;
      return (
        <Image
          source={imageSource}
          style={[
            styles.image,
            {
              width: currentSize.width,
              height: currentSize.height,
              borderRadius: currentSize.width / 2,
            },
          ]}
          resizeMode="cover"
        />
      );
    }

    // Si des initiales sont fournies
    if (initials) {
      return (
        <Text
          style={[
            styles.initials,
            {
              fontSize: currentSize.fontSize,
              fontWeight: TYPOGRAPHY.weights.semibold,
              color: '#FFFFFF',
            },
          ]}
        >
          {initials.toUpperCase().slice(0, 2)}
        </Text>
      );
    }

    // Icône par défaut
    return (
      <User
        size={currentSize.iconSize}
        color="#FFFFFF"
        strokeWidth={2}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: currentSize.width,
          height: currentSize.height,
          borderRadius: currentSize.width / 2,
          backgroundColor: colors.primary,
        },
        style,
      ]}
    >
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    // Dimensions gérées dynamiquement
  },
  initials: {
    textAlign: 'center',
  },
});
