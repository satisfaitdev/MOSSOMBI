import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '@/constants/colors';

export interface Step {
  id: number;
  title: string;
  icon?: string;
}

interface StepperProps {
  /** Liste des étapes */
  steps: Step[];
  /** Étape actuelle (0-indexed) */
  currentStep: number;
  /** Afficher les titres des étapes */
  showTitles?: boolean;
  /** Afficher la barre de progression */
  showProgressBar?: boolean;
}

/**
 * Composant Stepper horizontal
 * 
 * Fonctionnalités:
 * - Affichage des étapes avec numéros
 * - Indicateur visuel de progression
 * - Checkmarks pour les étapes complétées
 * - Barre de progression optionnelle
 * - Titres optionnels
 * 
 * @example
 * ```tsx
 * const steps = [
 *   { id: 0, title: 'Informations', icon: '📝' },
 *   { id: 1, title: 'Paiement', icon: '💳' },
 *   { id: 2, title: 'Confirmation', icon: '✓' },
 * ];
 * 
 * <Stepper
 *   steps={steps}
 *   currentStep={1}
 *   showTitles
 *   showProgressBar
 * />
 * ```
 */
export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  showTitles = false,
  showProgressBar = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.card, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {/* Stepper horizontal */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showProgressBar ? SPACING.sm : 0 }}>
        {steps.map((step, index) => (
          <View key={step.id} style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              {/* Cercle numéroté */}
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: currentStep >= index ? colors.primary : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: currentStep >= index ? colors.primary : colors.border
              }}>
                {currentStep > index ? (
                  <Check size={16} color="#FFFFFF" />
                ) : (
                  <Text style={{
                    color: currentStep === index ? '#FFFFFF' : colors.textTertiary,
                    fontSize: TYPOGRAPHY.sizes.xs,
                    fontWeight: TYPOGRAPHY.weights.bold
                  }}>
                    {index + 1}
                  </Text>
                )}
              </View>
              
              {/* Ligne de connexion */}
              {index < steps.length - 1 && (
                <View style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: currentStep > index ? colors.primary : colors.border,
                  marginHorizontal: 4
                }} />
              )}
            </View>
            
            {/* Titre optionnel */}
            {showTitles && (
              <Text style={{
                color: currentStep >= index ? colors.text : colors.textSecondary,
                fontSize: TYPOGRAPHY.sizes.xs,
                fontWeight: currentStep === index ? TYPOGRAPHY.weights.semibold : TYPOGRAPHY.weights.regular,
                marginTop: SPACING.xs,
                textAlign: 'center'
              }} numberOfLines={1}>
                {step.title}
              </Text>
            )}
          </View>
        ))}
      </View>
      
      {/* Barre de progression */}
      {showProgressBar && (
        <View style={{ height: 4, backgroundColor: colors.surface, borderRadius: 2, overflow: 'hidden' }}>
          <View style={{
            height: '100%',
            backgroundColor: colors.primary,
            width: `${((currentStep + 1) / steps.length) * 100}%`
          }} />
        </View>
      )}
    </View>
  );
};

export default Stepper;
