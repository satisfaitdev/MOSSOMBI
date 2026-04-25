import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '@/constants/colors';

interface HeaderWithBackButtonProps {
  title: string;
  onBack?: () => void;
  rightButton?: React.ReactNode;
}

/**
 * Composant réutilisable pour afficher un header avec bouton retour standard
 * 
 * Usage:
 * ```tsx
 * import HeaderWithBackButton from '@/components/HeaderWithBackButton';
 * 
 * export default function MyScreen() {
 *   return (
 *     <>
 *       <HeaderWithBackButton title="Mon Titre" />
 *       <View>...</View>
 *     </>
 *   );
 * }
 * ```
 */
export default function HeaderWithBackButton({ title, onBack, rightButton, children }: HeaderWithBackButtonProps & { children?: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ height: insets.top }} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.sm,
          gap: SPACING.md,
          zIndex: 100,
        }}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            {
              width: 36,
              height: 36,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.9 : 1 }],
            },
          ]}
          hitSlop={10}
        >
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: TYPOGRAPHY.sizes.lg,
              fontWeight: TYPOGRAPHY.weights.bold,
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {rightButton ? (
          rightButton
        ) : (
          <View style={{ width: 36, height: 36 }} />
        )}
      </View>

      {children}
    </>
  );
}
