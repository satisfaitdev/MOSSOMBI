import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { DSFR_COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

interface DSFRCardProps {
    name: string;
    description: string;
    icon: React.ReactNode;
    onPress: () => void;
}

/**
 * Carte inspirée du Système de Design de l'État (DSFR)
 * Utilisée pour les services institutionnels, livraison et courses
 */
export default function DSFRCard({
    name,
    description,
    icon,
    onPress,
}: DSFRCardProps) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                {
                    opacity: pressed ? 0.8 : 1,
                },
            ]}
        >
            <View style={styles.iconContainer}>
                {icon}
            </View>

            <View style={styles.content}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.description} numberOfLines={2}>
                    {description}
                </Text>
            </View>

            <View style={styles.arrow}>
                <ChevronRight size={16} color={DSFR_COLORS.blue} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: DSFR_COLORS.background,
        padding: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        borderRadius: BORDER_RADIUS.sm, // DSFR uses sharp or slightly rounded corners
        borderWidth: 1,
        borderColor: DSFR_COLORS.border,
    },
    iconContainer: {
        marginRight: SPACING.md,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    name: {
        color: DSFR_COLORS.blue,
        fontSize: TYPOGRAPHY.sizes.md,
        fontWeight: TYPOGRAPHY.weights.bold,
        marginBottom: 4,
    },
    description: {
        color: DSFR_COLORS.text,
        fontSize: TYPOGRAPHY.sizes.sm,
        lineHeight: 20,
    },
    arrow: {
        marginLeft: SPACING.sm,
    },
});
