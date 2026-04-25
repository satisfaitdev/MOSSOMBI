import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Bell, Gift, AlertCircle, CheckCircle, Info, Trash2 } from 'lucide-react-native';
import GradientIcon from '@/components/atoms/GradientIcon';
import GradientDot from '@/components/atoms/GradientDot';
import GradientBackground from '@/components/atoms/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

// Types
type NotificationType = 'info' | 'success' | 'warning' | 'promo';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

interface NotificationIconConfig {
  icon: React.ReactNode;
  color: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'promo', title: 'Offre spéciale', message: 'Profitez de 20% de réduction sur tous les services de voyage ce week-end!', date: '2025-01-05T10:30:00', read: false },
  { id: '2', type: 'success', title: 'Transaction réussie', message: 'Votre recharge de 50,000 CDF a été effectuée avec succès.', date: '2025-01-05T09:15:00', read: false },
  { id: '3', type: 'info', title: 'Nouveau service disponible', message: 'Découvrez notre nouveau service de livraison de gaz à domicile.', date: '2025-01-04T14:20:00', read: true },
  { id: '4', type: 'warning', title: 'Sécurité', message: 'Ne partagez jamais votre code PIN avec qui que ce soit.', date: '2025-01-03T08:00:00', read: true },
];

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Configuration des icônes et couleurs par type
  const notificationConfig = useMemo((): Record<NotificationType, NotificationIconConfig> => ({
    promo: { icon: <Gift size={24} color={colors.accent} />, color: colors.accent },
    success: { icon: <CheckCircle size={24} color={colors.success} />, color: colors.success },
    warning: { icon: <AlertCircle size={24} color={colors.warning} />, color: colors.warning },
    info: { icon: <Info size={24} color={colors.info} />, color: colors.info },
  }), [colors]);

  const getNotificationConfig = (type: NotificationType): NotificationIconConfig => {
    return notificationConfig[type] || notificationConfig.info;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <View style={{ height: insets.top }} />

      {/* Header (same style as supermarket) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.sm,
          gap: SPACING.md,
          zIndex: 10,
        }}
      >
        <Pressable
          onPress={() => router.back()}
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
        >
          <ChevronLeft color={colors.text} size={22} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Heading level={3} style={{ textAlign: 'center' }}>Notifications</Heading>
        </View>

        <View style={{ width: 36, height: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: insets.bottom + SPACING.xl }}
      >
        <Stack spacing="lg">
          {/* Badge de notifications non lues */}
          {unreadCount > 0 && <UnreadBadge count={unreadCount} colors={colors} />}

          {/* Liste des notifications */}
          {notifications.length === 0 ? (
            <EmptyState colors={colors} />
          ) : (
            <Stack spacing="md">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  config={getNotificationConfig(notification.type)}
                  colors={colors}
                  onPress={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </ScrollView>
    </GradientBackground>
  );
}

// ==================== COMPOSANTS EXTRAITS ====================

/** Badge affichant le nombre de notifications non lues */
function UnreadBadge({ count, colors }: { count: number; colors: any }) {
  return (
    <GradientBackground
      opacity="20"
      style={{
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
      }}
    >
      <GradientIcon size={20}>
        <Bell size={20} color="#FFFFFF" />
      </GradientIcon>
      <Body style={{ color: colors.gradient.middle, fontWeight: TYPOGRAPHY.weights.medium }}>
        Vous avez {count} notification{count > 1 ? 's' : ''} non lue{count > 1 ? 's' : ''}
      </Body>
    </GradientBackground>
  );
}

/** État vide quand il n'y a pas de notifications */
function EmptyState({ colors }: { colors: any }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: SPACING.xxl * 2 }}>
      <Bell size={64} color={colors.textTertiary} />
      <Heading level={3} style={{ marginTop: SPACING.lg }}>Aucune notification</Heading>
      <Caption>Vous n&apos;avez pas encore de notifications</Caption>
    </View>
  );
}

/** Carte de notification individuelle */
interface NotificationCardProps {
  notification: Notification;
  config: NotificationIconConfig;
  colors: any;
  onPress: () => void;
  onDelete: () => void;
}

function NotificationCard({ notification, config, colors, onPress, onDelete }: NotificationCardProps) {
  const formattedDate = useMemo(
    () => new Date(notification.date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    [notification.date]
  );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.md,
          borderWidth: 1,
          borderColor: colors.border,
          borderLeftWidth: notification.read ? 1 : 3,
          borderLeftColor: notification.read ? colors.border : config.color,
          ...SHADOWS.sm,
        }}
      >
        <Row spacing="md" align="flex-start">
          {/* Icône */}
          <View
            style={{
              width: 48,
              height: 48,
              backgroundColor: config.color + '20',
              borderRadius: BORDER_RADIUS.md,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {config.icon}
          </View>

          {/* Contenu */}
          <View style={{ flex: 1 }}>
            <Row justify="space-between" align="center">
              <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, flex: 1 }}>
                {notification.title}
              </Body>
              {!notification.read && (
                <GradientDot size={8} />
              )}
            </Row>
            <Caption style={{ marginTop: SPACING.xs }}>{notification.message}</Caption>
            <Caption style={{ marginTop: SPACING.xs, color: colors.textTertiary }}>
              {formattedDate}
            </Caption>
          </View>

          {/* Bouton supprimer */}
          <Pressable onPress={onDelete} hitSlop={8}>
            <Trash2 size={20} color={colors.textTertiary} />
          </Pressable>
        </Row>
      </View>
    </Pressable>
  );
}
