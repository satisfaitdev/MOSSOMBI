import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DSFR_COLORS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';

interface DSFRPageLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

/**
 * Layout épuré inspiré du site Service-Public pour une lecture claire
 */
export default function DSFRPageLayout({
    title,
    subtitle,
    children,
}: DSFRPageLayoutProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* Header Institutionnel */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={DSFR_COLORS.text} />
                    <Text style={styles.backText}>Retour</Text>
                </Pressable>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {children}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: DSFR_COLORS.border,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    backText: {
        marginLeft: SPACING.xs,
        fontSize: TYPOGRAPHY.sizes.sm,
        color: DSFR_COLORS.text,
    },
    titleContainer: {
        marginTop: SPACING.xs,
    },
    title: {
        fontSize: TYPOGRAPHY.sizes.xxl,
        fontWeight: TYPOGRAPHY.weights.bold,
        color: DSFR_COLORS.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.sizes.md,
        color: DSFR_COLORS.text,
        marginTop: SPACING.xs,
        opacity: 0.8,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
});
