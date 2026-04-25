import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { BottomModal } from './BottomModal';

interface ServiceOption {
  value: string;
  label: string;
}

interface ServiceSelectorProps {
  options: ServiceOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ServiceSelector({ 
  options, 
  selectedValue, 
  onValueChange, 
  placeholder = "Sélectionner...", 
  disabled = false 
}: ServiceSelectorProps) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(opt => opt.value === selectedValue);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
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
        <Text style={{ 
          color: disabled ? colors.textTertiary : (selectedOption ? colors.text : colors.textSecondary), 
          fontSize: 14,
          flex: 1
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown 
          size={16} 
          color={disabled ? colors.textTertiary : colors.textSecondary} 
          style={{ transform: [{ rotate: '0deg' }] }}
        />
      </Pressable>

      <BottomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Sélectionner un service"
      >
        <View style={{ gap: SPACING.sm }}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              style={{
                paddingVertical: SPACING.md,
                paddingHorizontal: SPACING.lg,
                borderRadius: 8,
                backgroundColor: selectedValue === option.value ? (colors.primary + '20') : 'transparent',
                borderWidth: 1,
                borderColor: selectedValue === option.value ? colors.primary : colors.border,
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <Text style={{ 
                  color: selectedValue === option.value ? colors.primary : colors.text,
                  fontSize: 16,
                  fontWeight: selectedValue === option.value ? '600' : '400',
                  flex: 1
                }}>
                  {option.label}
                </Text>
                {selectedValue === option.value && (
                  <Text style={{ color: colors.primary, fontSize: 20 }}>✓</Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </BottomModal>
    </>
  );
}
