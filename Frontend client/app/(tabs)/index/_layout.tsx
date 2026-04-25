import React from 'react';
import { View, Pressable, Image, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Bell } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';
import { Heading, Caption } from '@/components/atoms';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGreetingKey } from '@/utils/greetings';

export default function HomeTabLayout() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();

  const firstName = user?.full_name?.split(' ')[0] || 'Utilisateur';
  const greetingKey = getGreetingKey();
  const greetingText = t(greetingKey as any);

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerBackVisible: false,
        headerTransparent: true,
        headerTitle: () => (
          <View style={styles.headerTitleContainer}>
            <View style={[styles.logoWrapper, { borderRadius: BORDER_RADIUS.md }]}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <View>
              <Heading level={3} style={{ marginBottom: 0, fontSize: TYPOGRAPHY.sizes.md }}>
                {greetingText}, {firstName}
              </Heading>
              <Caption style={{ color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.xs }}>{t('whatToDo')}</Caption>
            </View>
          </View>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/notifications')}
            style={[
              COMMON_STYLES.iconButton,
              { backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent' },
            ]}
          >
            <Bell size={20} color={colors.text} />
          </Pressable>
        ),
        headerBackground: () => (
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoWrapper: {
    width: 52,
    height: 52,
    marginRight: SPACING.xs,
    overflow: 'hidden',
    marginTop: 3,
  },
  logo: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.12 }],
  },
});
