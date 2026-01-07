import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, Platform, StatusBar, View, Text } from 'react-native';
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
export default function HeaderWithBackButton({ title, onBack, rightButton }: HeaderWithBackButtonProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Sur Android, on utilise un header personnalisé pour mieux contrôler l'espacement
  if (Platform.OS === 'android') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ 
          backgroundColor: colors.card,
          paddingTop: insets.top + SPACING.xs, // StatusBar + petit espace
          paddingBottom: SPACING.sm,
          paddingHorizontal: SPACING.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [{ 
              opacity: pressed ? 0.5 : 1,
              position: 'absolute',
              left: SPACING.md,
              top: insets.top + SPACING.xs,
            }]}
          >
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={{
            color: colors.text,
            fontSize: TYPOGRAPHY.sizes.md,
            fontWeight: TYPOGRAPHY.weights.bold,
          }}>
            {title}
          </Text>
          {rightButton && (
            <View style={{ position: 'absolute', right: SPACING.md, top: insets.top + SPACING.xs }}>
              {rightButton}
            </View>
          )}
        </View>
      </>
    );
  }

  // iOS et Web utilisent le header natif
  return (
    <Stack.Screen
      options={{
        title,
        headerShown: true,
        headerLeft: () => (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [{ 
              opacity: pressed ? 0.5 : 1, 
              marginLeft: SPACING.sm,
            }]}
          >
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
        ),
        headerRight: rightButton ? () => rightButton : undefined,
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          color: colors.text,
          fontSize: TYPOGRAPHY.sizes.lg,
          fontWeight: TYPOGRAPHY.weights.bold,
        },
        headerTitleAlign: 'center',
      }}
    />
  );
}
