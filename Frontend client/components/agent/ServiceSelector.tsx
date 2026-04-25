import React from 'react';
import { Pressable, View, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import { SPACING } from '@/constants/colors';
import { LayoutGrid, Check } from 'lucide-react-native';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';

interface Service {
    id: string;
    name: string;
    icon?: any;
}

interface ServiceSelectorProps {
    services: Service[];
    activeServiceId: string;
    onSelect: (id: string) => void;
    enabledServiceIds?: string[];
    visible: boolean;
    onClose: () => void;
}

export default function ServiceSelector({ services, activeServiceId, onSelect, enabledServiceIds, visible, onClose }: ServiceSelectorProps) {
    const { colors, isDark } = useTheme();

    if (!visible) return null;

    return (
        <View style={{
            position: 'absolute',
            top: 140,
            left: SPACING.lg,
            right: SPACING.lg,
            zIndex: 100,
        }}>
            <LiquidGlassCard intensity={60} style={{ padding: SPACING.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
                    <AdaptiveText variant="body" weight="bold">Changer de service</AdaptiveText>
                    <Pressable onPress={onClose}>
                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary }}>Fermer</AdaptiveText>
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                    <View style={{ gap: SPACING.sm }}>
                        {services.map((service) => {
                            const isActive = service.id === activeServiceId;
                            const isEnabled = !enabledServiceIds || enabledServiceIds.includes(service.id);
                            return (
                                <Pressable
                                    key={service.id}
                                    disabled={!isEnabled}
                                    onPress={() => {
                                        if (!isEnabled) return;
                                        onSelect(service.id);
                                        onClose();
                                    }}
                                    style={({ pressed }) => [
                                        {
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            padding: SPACING.md,
                                            borderRadius: 16,
                                            backgroundColor: isActive
                                                ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                                                : 'transparent',
                                            gap: SPACING.md,
                                            opacity: !isEnabled ? 0.35 : (pressed ? 0.7 : 1)
                                        }
                                    ]}
                                >
                                    <View style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 10,
                                        backgroundColor: isActive ? colors.primary + '20' : 'rgba(128,128,128,0.1)',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <LayoutGrid size={18} color={isActive ? colors.primary : colors.textSecondary} />
                                    </View>
                                    <AdaptiveText
                                        variant="body"
                                        weight={isActive ? "bold" : "medium"}
                                        style={{ flex: 1, color: isActive ? colors.text : colors.textSecondary }}
                                    >
                                        {service.name}
                                    </AdaptiveText>
                                    {isActive && <Check size={18} color={colors.primary} />}
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            </LiquidGlassCard>
        </View>
    );
}
