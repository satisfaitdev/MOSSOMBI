import React from 'react';
import { View, Pressable, Dimensions, Text, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Moon, Sun, User, Bell, Lock, HelpCircle, LogOut, ChevronRight, Backpack, TrendingUp, History, Wallet, Settings, Shield, Award, Edit3, Briefcase, Users, BarChart3, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import AdBanner from '@/components/AdBanner';
import { useAuth } from '@/contexts/AuthContext';
import { getCountryFlag } from '@/utils/localization';
import GradientBackground from '@/components/atoms/GradientBackground';

const { width } = Dimensions.get('window');
const numColumns = 4;
const gap = SPACING.sm;
const paddingHorizontal = SPACING.lg;
const itemWidth = (width - paddingHorizontal * 2 - gap * (numColumns - 1)) / numColumns;

const profileImages = {
  headerBackground: require('@/assets/images/wallet/Walletback.webp'),
};

export default function ProfileScreen() {
  const { colors, toggleTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  
  // Hooks pour les données réelles
  const { user, logout } = useAuth();

  // Fonction pour calculer l'âge à partir de la date de naissance
  const calculateAge = (dateOfBirth: string | undefined): number => {
    if (!dateOfBirth) return 0;
    
    try {
      // Gérer les formats DD/MM/YYYY et YYYY-MM-DD
      let birthDate: Date;
      
      if (dateOfBirth.includes('/')) {
        // Format DD/MM/YYYY
        const [day, month, year] = dateOfBirth.split('/');
        birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (dateOfBirth.includes('-')) {
        // Format YYYY-MM-DD (ISO)
        birthDate = new Date(dateOfBirth);
      } else {
        return 0;
      }
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age > 0 ? age : 0;
    } catch (error) {
      console.warn('Erreur calcul âge:', error);
      return 0;
    }
  };

  // Données utilisateur (réelles ou par défaut)
  const userId = user?.user_id_display || 'MSB-123456';
  const userCountry = user?.country_code || 'CD';
  const userAge = calculateAge(user?.date_of_birth);
  const userLevel = user?.user_level || 'Bronze';
  const userPoints = user?.points || 0;
  const nextLevelPoints = 2000; // À calculer selon le niveau
  const progress = (userPoints / nextLevelPoints) * 100;


  const quickActions = [
    { id: 'backpack', title: 'Sac à dos', icon: <Backpack size={20} color={colors.primary} />, onPress: () => router.push('/backpack' as any) },
    { id: 'level', title: 'Niveau', icon: <TrendingUp size={20} color={colors.secondary} />, onPress: () => router.push('/level' as any) },
    { id: 'history', title: 'Historique', icon: <History size={20} color={colors.accent} />, onPress: () => router.push('/wallet/transactions' as any) },
    { id: 'wallet', title: 'Portefeuille', icon: <Wallet size={20} color={colors.primary} />, onPress: () => router.push('/wallet' as any) },
  ];

  const proActions = [
    { id: 'agent', title: 'Agent', icon: <Briefcase size={20} color={colors.primary} />, onPress: () => router.push('/agency' as any) },
    { id: 'team', title: 'Équipe', icon: <Users size={20} color={colors.secondary} />, onPress: () => router.push('/agent/management' as any) },
    { id: 'stats', title: 'Stats', icon: <BarChart3 size={20} color={colors.accent} />, onPress: () => router.push('/stats' as any) },
    { id: 'reports', title: 'Rapports', icon: <FileText size={20} color={colors.primary} />, onPress: () => router.push('/reports' as any) },
  ];

  const menuItems = [
    { id: 'notifications', title: 'Notifications', icon: <Bell size={20} color={colors.primary} />, onPress: () => router.push('/notifications' as any) },
    { id: 'security', title: 'Sécurité', icon: <Lock size={20} color={colors.primary} />, onPress: () => router.push('/security' as any) },
    { id: 'settings', title: 'Paramètres', icon: <Settings size={20} color={colors.primary} />, onPress: () => router.push('/settings' as any) },
    { id: 'help', title: 'Aide & Support', icon: <HelpCircle size={20} color={colors.primary} />, onPress: () => router.push('/help' as any) },
  ];

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <View style={{ height: insets.top }} />
      <PageContainer
        scrollable
        horizontalPadding={SPACING.lg}
        verticalPadding={SPACING.lg}
        style={{ backgroundColor: 'transparent' }}
      >
        <Stack spacing="lg" style={{ paddingBottom: 100 }}>
          <ImageBackground
            source={profileImages.headerBackground}
            resizeMode="stretch"
            imageStyle={{ borderRadius: BORDER_RADIUS.xl }}
            style={{ borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, alignItems: 'center', ...SHADOWS.lg, position: 'relative', overflow: 'hidden' }}
          >
            {/* Bouton d'édition en haut à droite */}
            <Pressable
              onPress={() => router.push('/profile/edit' as any)}
              style={({ pressed }) => ({
                position: 'absolute',
                top: SPACING.md,
                right: SPACING.md,
                width: 40,
                height: 40,
                borderRadius: BORDER_RADIUS.full,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Edit3 size={20} color="#FFFFFF" />
            </Pressable>

            <View style={{ width: 80, height: 80, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md }}>
              <User size={40} color="#FFFFFF" />
            </View>
            <View style={{ alignItems: 'center', marginTop: SPACING.sm }}>
              <Text style={{ color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.bold }}>
                {user?.full_name || t('Utilisateur Mossombi' as any)}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: SPACING.xs, gap: SPACING.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs / 2, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: 2 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.xs }}>
                    {t('ID' as any)}: {userId}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs / 2, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: 2 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.xs }}>
                    {getCountryFlag(userCountry)} {userAge} {t('ans' as any)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs / 2, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: 2 }}>
                  <Shield size={12} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.xs }}>
                    {t('Vérifié' as any)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginTop: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full }}>
              <Award size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.semibold }}>
                {t('Niveau' as any)} {userLevel}
              </Text>
            </View>

            <View style={{ marginTop: SPACING.md, width: '100%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: TYPOGRAPHY.sizes.xs }}>
                  {userPoints} / {nextLevelPoints} {t('points' as any)}
                </Text>
                <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: TYPOGRAPHY.sizes.xs }}>
                  {Math.round(progress)}%
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: BORDER_RADIUS.sm, marginTop: SPACING.xs, overflow: 'hidden' }}>
                <View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.sm }} />
              </View>
            </View>
          </ImageBackground>

          <View><Heading level={3}>{t('Accès rapide' as any)}</Heading></View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
            {quickActions.map((action) => (
              <Pressable key={action.id} onPress={action.onPress} style={{ width: itemWidth, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.sm, alignItems: 'center', gap: SPACING.xs, borderWidth: 1, borderColor: colors.border }}>
                {action.icon}
                <Caption style={{ textAlign: 'center', fontSize: 10 }}>{t(action.title as any)}</Caption>
              </Pressable>
            ))}
          </View>

          <View><Heading level={3}>{t('Accès Pro' as any)}</Heading></View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
            {proActions.map((action) => (
              <Pressable key={action.id} onPress={action.onPress} style={{ width: itemWidth, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.sm, alignItems: 'center', gap: SPACING.xs, borderWidth: 1, borderColor: colors.border }}>
                {action.icon}
                <Caption style={{ textAlign: 'center', fontSize: 10 }}>{t(action.title as any)}</Caption>
              </Pressable>
            ))}
          </View>

          <View><Heading level={3}>{t('Paramètres' as any)}</Heading></View>
          <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, ...SHADOWS.sm }}>
            <Stack spacing="sm">
              {menuItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <Pressable onPress={item.onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                    <Row justify="space-between" align="center" style={{ paddingVertical: SPACING.sm }}>
                      <Row spacing="md" align="center">
                        {item.icon}
                        <Body>{t(item.title as any)}</Body>
                      </Row>
                      <ChevronRight size={20} color={colors.textTertiary} />
                    </Row>
                  </Pressable>
                  {index < menuItems.length - 1 && <View style={{ height: 1, backgroundColor: colors.border }} />}
                </React.Fragment>
              ))}
            </Stack>
          </View>

          <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, ...SHADOWS.sm }}>
            <Pressable onPress={toggleTheme} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Row justify="space-between" align="center" style={{ paddingVertical: SPACING.sm }}>
                <Row spacing="md" align="center">
                  {isDark ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
                  <Body>
                    {t('Thème' as any)} {t((isDark ? 'sombre' : 'clair') as any)}
                  </Body>
                </Row>
                <ChevronRight size={20} color={colors.textTertiary} />
              </Row>
            </Pressable>
          </View>

          <AdBanner />

          <Pressable 
            onPress={async () => {
              try {
                await logout();
                router.replace('/auth/login' as any);
              } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
              }
            }} 
            style={{ backgroundColor: colors.error + '20', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: colors.error + '40' }}
          >
            <Row spacing="sm" align="center">
              <LogOut size={20} color={colors.error} />
              <Body style={{ color: colors.error, fontWeight: TYPOGRAPHY.weights.bold }}>{t('Déconnexion' as any)}</Body>
            </Row>
          </Pressable>
        </Stack>
      </PageContainer>
    </GradientBackground>
  );
}
