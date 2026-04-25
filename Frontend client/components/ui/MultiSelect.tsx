import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

interface MultiSelectProps {
  options: string[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelect({ 
  options, 
  selectedValues, 
  onValuesChange, 
  placeholder = "Sélectionner...", 
  disabled = false 
}: MultiSelectProps) {
  const { colors, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter(v => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  return (
    <View style={{ position: 'relative', zIndex: 99998 }}>
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
            {selectedValues.map((value, index) => (
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

      {/* Dropdown des options */}
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
              zIndex: 9997,
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
            zIndex: 9997,
          }}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 200 }}>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => toggleValue(option)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: isSelected ? (colors.primary + '20') : 'transparent',
                    }}
                  >
                    <View style={{ 
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flex: 1
                    }}>
                      <Text style={{ 
                        color: isSelected ? colors.primary : colors.text,
                        fontSize: 14,
                        fontWeight: isSelected ? '600' : '400',
                        flex: 1
                      }}>
                        {option}
                      </Text>
                      {isSelected && (
                        <Text style={{ color: colors.primary, fontSize: 16 }}>✓</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}
