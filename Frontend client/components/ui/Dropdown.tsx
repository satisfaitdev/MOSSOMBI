import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Dropdown({ 
  options, 
  selectedValue, 
  onValueChange, 
  placeholder = "Sélectionner...", 
  disabled = false 
}: DropdownProps) {
  const { colors, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <View style={{ position: 'relative', zIndex: 99999 }}>
      <Pressable
        onPress={() => !disabled && setIsOpen(!isOpen)}
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
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {isOpen && (
        <>
          {/* Overlay pour fermer le dropdown quand on clique ailleurs */}
          <Pressable
            onPress={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'transparent',
              zIndex: 9998,
            }}
          />
          
          {/* Conteneur du dropdown avec z-index élevé */}
          <View style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: isDark ? 'rgba(30,30,30,0.98)' : 'rgba(255,255,255,0.98)',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: 4,
            maxHeight: 200,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            zIndex: 9999,
          }}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 200 }}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onValueChange(option.value);
                    setIsOpen(false);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: selectedValue === option.value ? (colors.primary + '20') : 'transparent',
                  }}
                >
                  <View style={{ 
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flex: 1
                  }}>
                    <Text style={{ 
                      color: selectedValue === option.value ? colors.primary : colors.text,
                      fontSize: 14,
                      fontWeight: selectedValue === option.value ? '600' : '400'
                    }}>
                      {option.label}
                    </Text>
                    {selectedValue === option.value && (
                      <Text style={{ color: colors.primary, fontSize: 16 }}>✓</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}
