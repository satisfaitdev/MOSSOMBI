import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { BottomModal } from './BottomModal';

interface MultiServiceSelectorProps {
  options: string[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiServiceSelector({ 
  options, 
  selectedValues, 
  onValuesChange, 
  placeholder = "Sélectionner...", 
  disabled = false 
}: MultiServiceSelectorProps) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter(v => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => !disabled && setModalVisible(true)}
        style={{
          borderRadius: 8,
          borderWidth: 1,
          borderColor: disabled ? colors.textTertiary : colors.border,
          backgroundColor: disabled ? 'rgba(0,0,0,0.05)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'),
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {selectedValues.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontStyle: 'italic' }}>
            {placeholder}
          </Text>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ gap: 4 }}
            style={{ flex: 1 }}
          >
            {selectedValues.map((value) => (
              <View key={value} style={{
                backgroundColor: colors.primary + '20',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4
              }}>
                <Text style={{ 
                  color: colors.primary, 
                  fontSize: 12, 
                  fontWeight: '600' 
                }}>
                  {value}
                </Text>
                <Pressable
                  onPress={() => toggleValue(value)}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    width: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10 }}>×</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
        <Plus size={16} color={colors.textSecondary} />
      </Pressable>

      <BottomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Sélectionner plusieurs options"
      >
        <View style={{ gap: SPACING.sm }}>
          {options.map((option) => {
            const isSelected = selectedValues.includes(option);
            return (
              <Pressable
                key={option}
                onPress={() => toggleValue(option)}
                style={{
                  paddingVertical: SPACING.md,
                  paddingHorizontal: SPACING.lg,
                  borderRadius: 8,
                  backgroundColor: isSelected ? (colors.primary + '20') : 'transparent',
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <Text style={{ 
                    color: isSelected ? colors.primary : colors.text,
                    fontSize: 16,
                    fontWeight: isSelected ? '600' : '400',
                    flex: 1
                  }}>
                    {option}
                  </Text>
                  {isSelected && (
                    <Text style={{ color: colors.primary, fontSize: 20 }}>✓</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </BottomModal>
    </>
  );
}
