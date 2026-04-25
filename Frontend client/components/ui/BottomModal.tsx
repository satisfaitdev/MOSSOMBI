import React from 'react';
import { Modal, Pressable, ScrollView, Text, View, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BottomModal({ visible, onClose, title, children }: BottomModalProps) {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Overlay de fond */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        {/* Conteneur de la modale */}
        <Pressable
          style={{
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: SCREEN_HEIGHT * 0.7,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header de la modale */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
            }}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              style={{
                padding: SPACING.sm,
                borderRadius: 20,
                backgroundColor: colors.background,
              }}
            >
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Contenu de la modale */}
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: SPACING.lg }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
