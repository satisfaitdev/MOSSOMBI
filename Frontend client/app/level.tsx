import React from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Gift, TrendingUp, Award, Crown, Zap, Target } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import GradientBackground from '@/components/atoms/GradientBackground';

export default function LevelScreen() {
  const { colors } = useTheme();

  const currentLevel = {
    level: 5,
    name: 'Gold',
    points: 3450,
    nextLevelPoints: 5000,
    color: '#FFD700',
  };

  const levels = [
    { level: 1, name: 'Bronze', points: 0, color: '#CD7F32', icon: <Award size={24} color="#CD7F32" />, benefits: ['Accès basique', 'Support standard'] },
    { level: 2, name: 'Silver', points: 500, color: '#C0C0C0', icon: <Star size={24} color="#C0C0C0" />, benefits: ['Réductions 5%', 'Support prioritaire'] },
    { level: 3, name: 'Gold', points: 1500, color: '#FFD700', icon: <Trophy size={24} color="#FFD700" />, benefits: ['Réductions 10%', 'Livraison gratuite'] },
    { level: 4, name: 'Platinum', points: 5000, color: '#E5E4E2', icon: <Crown size={24} color="#E5E4E2" />, benefits: ['Réductions 15%', 'Accès VIP'] },
    { level: 5, name: 'Diamond', points: 10000, color: '#B9F2FF', icon: <Zap size={24} color="#B9F2FF" />, benefits: ['Réductions 20%', 'Service premium'] },
  ];

  const stats = [
    { label: 'Points totaux', value: '3,450', icon: <Star size={24} color={colors.warning} />, color: colors.warning },
    { label: 'Niveau actuel', value: 'Gold', icon: <Trophy size={24} color={currentLevel.color} />, color: currentLevel.color },
    { label: 'Prochain niveau', value: '1,550 pts', icon: <Target size={24} color={colors.primary} />, color: colors.primary },
  ];

  const recentActivities = [
    { id: '1', action: 'Achat Coins', points: 150, date: '2025-01-05 14:30', type: 'earn' },
    { id: '2', action: 'Réservation Hôtel', points: 200, date: '2025-01-04 10:15', type: 'earn' },
    { id: '3', action: 'Bonus mensuel', points: 500, date: '2025-01-01 00:00', type: 'bonus' },
    { id: '4', action: 'Parrainage', points: 100, date: '2024-12-28 16:30', type: 'earn' },
  ];

  const rewards = [
    { id: '1', title: 'Bon de réduction 10%', points: 500, available: true },
    { id: '2', title: 'Livraison gratuite', points: 300, available: true },
    { id: '3', title: 'Recharge +5%', points: 400, available: true },
    { id: '4', title: 'Accès VIP 1 mois', points: 2000, available: false },
  ];

  const progress = (currentLevel.points / currentLevel.nextLevelPoints) * 100;

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton title="Niveau" />
      <PageContainer style={{ backgroundColor: 'transparent' }}>
        <Stack spacing="lg">
        {/* Niveau actuel avec gradient */}
        <LinearGradient
          colors={[currentLevel.color + 'CC', currentLevel.color + '88', currentLevel.color + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, ...SHADOWS.lg }}
        >
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: BORDER_RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md }}>
              <Trophy size={48} color="#FFFFFF" />
            </View>
            <Heading level={1} style={{ color: '#FFFFFF', marginBottom: SPACING.xs }}>
              Niveau {currentLevel.level}
            </Heading>
            <Badge size="lg" style={{ backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: SPACING.md }}>
              <Body style={{ color: '#FFFFFF', fontWeight: TYPOGRAPHY.weights.bold }}>
                {currentLevel.name}
              </Body>
            </Badge>
            <Body style={{ color: 'rgba(255,255,255,0.9)', marginBottom: SPACING.sm }}>
              {currentLevel.points.toLocaleString()} / {currentLevel.nextLevelPoints.toLocaleString()} points
            </Body>
            <View style={{ width: '100%', height: 12, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: BORDER_RADIUS.full, overflow: 'hidden' }}>
              <View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#FFFFFF' }} />
            </View>
            <Caption style={{ color: 'rgba(255,255,255,0.9)', marginTop: SPACING.sm }}>
              Plus que {(currentLevel.nextLevelPoints - currentLevel.points).toLocaleString()} points pour le niveau suivant
            </Caption>
          </View>
        </LinearGradient>

            {/* Statistiques */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
              {stats.map((stat, index) => (
                <View
                  key={index}
                  style={{
                    width: index === 2 ? '100%' : '48%',
                    backgroundColor: colors.card,
                    borderRadius: BORDER_RADIUS.lg,
                    padding: SPACING.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    ...SHADOWS.sm,
                  }}
                >
                  <Row spacing="md" align="center">
                    <View style={{ width: 40, height: 40, backgroundColor: stat.color + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
                      {stat.icon}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.bold, color: stat.color }}>
                        {stat.value}
                      </Body>
                      <Caption>{stat.label}</Caption>
                    </View>
                  </Row>
                </View>
              ))}
            </View>

            {/* Tous les niveaux */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Progression des niveaux</Heading>
              <Stack spacing="sm">
                {levels.map((level) => {
                  const isUnlocked = currentLevel.level >= level.level;
                  const isCurrent = currentLevel.level === level.level;
                  
                  return (
                    <View
                      key={level.level}
                      style={{
                        backgroundColor: isCurrent ? level.color + '20' : colors.card,
                        borderRadius: BORDER_RADIUS.lg,
                        padding: SPACING.md,
                        borderWidth: isCurrent ? 2 : 1,
                        borderColor: isCurrent ? level.color : colors.border,
                        opacity: isUnlocked ? 1 : 0.5,
                        ...SHADOWS.sm,
                      }}
                    >
                      <Row spacing="md" align="center">
                        <View style={{ width: 50, height: 50, backgroundColor: level.color + '30', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
                          {level.icon}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Row spacing="xs" align="center" style={{ marginBottom: SPACING.xs / 2 }}>
                            <Body style={{ fontWeight: TYPOGRAPHY.weights.bold }}>Niveau {level.level}</Body>
                            <Body style={{ color: level.color, fontWeight: TYPOGRAPHY.weights.bold }}>• {level.name}</Body>
                            {isCurrent && <Badge variant="success" size="sm">Actuel</Badge>}
                          </Row>
                          <Caption style={{ marginBottom: SPACING.xs }}>{level.points.toLocaleString()} points requis</Caption>
                          <Row spacing="xs">
                            {level.benefits.map((benefit, idx) => (
                              <Badge key={idx} size="sm" style={{ backgroundColor: level.color + '20' }}>
                                <Caption style={{ color: level.color }}>{benefit}</Caption>
                              </Badge>
                            ))}
                          </Row>
                        </View>
                      </Row>
                    </View>
                  );
                })}
              </Stack>
            </View>

            {/* Activités récentes */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Activités récentes</Heading>
              <Stack spacing="sm">
                {recentActivities.map((activity) => (
                  <View
                    key={activity.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: BORDER_RADIUS.lg,
                      padding: SPACING.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      ...SHADOWS.sm,
                    }}
                  >
                    <Row justify="space-between" align="center">
                      <View style={{ flex: 1 }}>
                        <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, marginBottom: SPACING.xs / 2 }}>
                          {activity.action}
                        </Body>
                        <Caption>{activity.date}</Caption>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Body style={{ fontWeight: TYPOGRAPHY.weights.bold, color: activity.type === 'bonus' ? colors.warning : colors.success }}>
                          +{activity.points} pts
                        </Body>
                        {activity.type === 'bonus' && (
                          <Badge variant="warning" size="sm">Bonus</Badge>
                        )}
                      </View>
                    </Row>
                  </View>
                ))}
              </Stack>
            </View>

            {/* Récompenses disponibles */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Échanger vos points</Heading>
              <Stack spacing="sm">
                {rewards.map((reward) => (
                  <Pressable
                    key={reward.id}
                    onPress={() => {
                      if (reward.available) {
                        // Échanger les points contre la récompense (à implémenter)
                      }
                    }}
                    disabled={!reward.available}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : reward.available ? 1 : 0.5,
                    })}
                  >
                    <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, ...SHADOWS.sm }}>
                      <Row justify="space-between" align="center">
                        <Row spacing="md" align="center" style={{ flex: 1 }}>
                          <View style={{ width: 40, height: 40, backgroundColor: colors.accent + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
                            <Gift size={20} color={colors.accent} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>{reward.title}</Body>
                            <Caption>{reward.points} points</Caption>
                          </View>
                        </Row>
                        {reward.available ? (
                          <Badge variant="success" size="sm">Disponible</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Verrouillé</Badge>
                        )}
                      </Row>
                    </View>
                  </Pressable>
                ))}
              </Stack>
            </View>

            {/* Informations */}
            <View style={{ backgroundColor: colors.primary + '10', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.primary + '30' }}>
              <Row spacing="sm" align="flex-start">
                <TrendingUp size={20} color={colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: colors.primary, marginBottom: SPACING.xs }}>
                    Comment gagner des points ?
                  </Body>
                  <Caption>
                    Effectuez des transactions, parrainez des amis, complétez des défis et recevez des bonus mensuels pour accumuler des points !
                  </Caption>
                </View>
              </Row>
            </View>
        </Stack>
      </PageContainer>
    </GradientBackground>
  );
}
