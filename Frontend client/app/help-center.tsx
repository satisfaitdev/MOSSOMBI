import React, { useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { Search, Book, Video, FileText, HelpCircle, ChevronRight } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer, ContentCard } from '@/components/layouts';
import GradientBackground from '@/components/atoms/GradientBackground';

export default function HelpCenterScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: '1', title: 'Démarrage', icon: <Book size={24} color={colors.primary} />, articles: 12, color: colors.primary },
    { id: '2', title: 'Tutoriels vidéo', icon: <Video size={24} color={colors.secondary} />, articles: 8, color: colors.secondary },
    { id: '3', title: 'Guides pratiques', icon: <FileText size={24} color={colors.accent} />, articles: 15, color: colors.accent },
    { id: '4', title: 'FAQ', icon: <HelpCircle size={24} color={colors.warning} />, articles: 24, color: colors.warning },
  ];

  const popularArticles = [
    { id: '1', title: 'Comment créer un compte ?', category: 'Démarrage', views: 1245 },
    { id: '2', title: 'Recharger mon portefeuille', category: 'Paiements', views: 987 },
    { id: '3', title: 'Acheter des coins', category: 'Coins', views: 856 },
    { id: '4', title: 'Réserver un hôtel', category: 'Bookings', views: 743 },
    { id: '5', title: 'Sécuriser mon compte', category: 'Sécurité', views: 692 },
  ];

  const recentArticles = [
    { id: '1', title: 'Nouvelle fonctionnalité : Épargne', date: '2025-01-05', isNew: true },
    { id: '2', title: 'Guide : Services publics', date: '2025-01-03', isNew: true },
    { id: '3', title: 'Mise à jour : Carte virtuelle', date: '2025-01-01', isNew: false },
  ];

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton title="Centre d'aide" />
      <PageContainer style={{ backgroundColor: 'transparent' }}>
          <Stack spacing="lg">
            {/* Barre de recherche */}
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: BORDER_RADIUS.lg,
                  paddingHorizontal: SPACING.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: SPACING.sm,
                    paddingHorizontal: SPACING.sm,
                    color: colors.text,
                    fontSize: TYPOGRAPHY.sizes.sm,
                  }}
                  placeholder="Rechercher dans l'aide..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Catégories */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Catégories</Heading>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={({ pressed }) => ({
                      width: '48%',
                      backgroundColor: colors.card,
                      borderRadius: BORDER_RADIUS.lg,
                      padding: SPACING.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                      ...SHADOWS.sm,
                    })}
                  >
                    <View style={{ width: 48, height: 48, backgroundColor: category.color + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm }}>
                      {category.icon}
                    </View>
                    <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, marginBottom: SPACING.xs / 2 }}>
                      {category.title}
                    </Body>
                    <Caption>{category.articles} articles</Caption>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Articles populaires */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Articles populaires</Heading>
              <Stack spacing="sm">
                {popularArticles.map((article) => (
                  <Pressable
                    key={article.id}
                    style={({ pressed }) => ({
                      backgroundColor: colors.card,
                      borderRadius: BORDER_RADIUS.lg,
                      padding: SPACING.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                      ...SHADOWS.sm,
                    })}
                  >
                    <Row justify="space-between" align="center">
                      <View style={{ flex: 1 }}>
                        <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, marginBottom: SPACING.xs / 2 }}>
                          {article.title}
                        </Body>
                        <Row spacing="xs">
                          <Badge size="sm" style={{ backgroundColor: colors.primary + '20' }}>
                            <Caption style={{ color: colors.primary }}>{article.category}</Caption>
                          </Badge>
                          <Caption style={{ color: colors.textTertiary }}>
                            {article.views} vues
                          </Caption>
                        </Row>
                      </View>
                      <ChevronRight size={20} color={colors.textTertiary} />
                    </Row>
                  </Pressable>
                ))}
              </Stack>
            </View>

            {/* Nouveaux articles */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Nouveaux articles</Heading>
              <Stack spacing="sm">
                {recentArticles.map((article) => (
                  <Pressable
                    key={article.id}
                    style={({ pressed }) => ({
                      backgroundColor: colors.card,
                      borderRadius: BORDER_RADIUS.lg,
                      padding: SPACING.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                      ...SHADOWS.sm,
                    })}
                  >
                    <Row justify="space-between" align="center">
                      <View style={{ flex: 1 }}>
                        <Row spacing="xs" align="center" style={{ marginBottom: SPACING.xs / 2 }}>
                          <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>
                            {article.title}
                          </Body>
                          {article.isNew && (
                            <Badge variant="success" size="sm">Nouveau</Badge>
                          )}
                        </Row>
                        <Caption style={{ color: colors.textTertiary }}>
                          {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Caption>
                      </View>
                      <ChevronRight size={20} color={colors.textTertiary} />
                    </Row>
                  </Pressable>
                ))}
              </Stack>
            </View>

            {/* Besoin d'aide supplémentaire */}
            <View style={{ backgroundColor: colors.primary + '10', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.primary + '30' }}>
              <Heading level={4} style={{ color: colors.primary, marginBottom: SPACING.xs }}>
                Vous ne trouvez pas ce que vous cherchez ?
              </Heading>
              <Caption style={{ marginBottom: SPACING.md }}>
                Notre équipe de support est disponible 24/7 pour vous aider.
              </Caption>
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  borderRadius: BORDER_RADIUS.md,
                  paddingVertical: SPACING.sm,
                  paddingHorizontal: SPACING.md,
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Body style={{ color: '#FFFFFF', fontWeight: TYPOGRAPHY.weights.semibold }}>
                  Contacter le support
                </Body>
              </Pressable>
            </View>
        </Stack>
      </PageContainer>
    </GradientBackground>
  );
}
