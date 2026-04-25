import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

interface CategoryPillProps {
    id: string;
    label: string;
    active: boolean;
    onPress: (id: string) => void;
}

export default function CategoryPill({ id, label, active, onPress }: CategoryPillProps) {
    const { colors, isDark } = useTheme();

    return (
        <Pressable
            onPress={() => onPress(id)}
            style={({ pressed }) => [
                {
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 18,
                    borderWidth: 1.5,
                    borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                    backgroundColor: active ? `${colors.primary}1A` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'),
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    marginRight: SPACING.md,
                }
            ]}
        >
            <AdaptiveText
                variant="caption"
                weight={active ? 'bold' : 'medium'}
                color={active ? colors.primary : colors.textSecondary}
            >
                {label}
            </AdaptiveText>
        </Pressable>
    );
}
