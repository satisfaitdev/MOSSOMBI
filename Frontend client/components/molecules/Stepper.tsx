import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

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
 * Composant Stepper horizontal - Style LuxiGlass
 */
export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  showTitles = false,
  showProgressBar = true,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, backgroundColor: 'transparent' }}>
      {/* Stepper horizontal */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showProgressBar ? SPACING.sm : 0 }}>
        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isActive = currentStep === index;
          const isPending = currentStep < index;

          return (
            <View key={step.id} style={{ alignItems: 'center', flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                {/* Cercle numéroté / Checkmark */}
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isActive || isCompleted ? 'transparent' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: isPending ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)') : 'transparent',
                  overflow: 'hidden'
                }}>
                  {isActive || isCompleted ? (
                    <LinearGradient
                      colors={[colors.gradient.start, colors.gradient.end]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: isActive ? 1 : 0.8
                      }}
                    />
                  ) : null}

                  {isCompleted ? (
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text style={{
                      color: isActive ? '#FFFFFF' : colors.textTertiary,
                      fontSize: TYPOGRAPHY.sizes.sm,
                      fontWeight: TYPOGRAPHY.weights.bold,
                      zIndex: 1
                    }}>
                      {index + 1}
                    </Text>
                  )}
                </View>

                {/* Ligne de connexion */}
                {index < steps.length - 1 && (
                  <View style={{
                    flex: 1,
                    height: 3,
                    marginHorizontal: 8,
                    borderRadius: 2,
                    backgroundColor: isCompleted ? 'transparent' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                    overflow: 'hidden'
                  }}>
                    {isCompleted && (
                      <LinearGradient
                        colors={[colors.gradient.start, colors.gradient.end]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1 }}
                      />
                    )}
                  </View>
                )}
              </View>

              {/* Titre optionnel */}
              {showTitles && (
                <Text style={{
                  color: isActive || isCompleted ? colors.text : colors.textTertiary,
                  fontSize: TYPOGRAPHY.sizes.xs,
                  fontWeight: isActive ? TYPOGRAPHY.weights.bold : TYPOGRAPHY.weights.medium,
                  marginTop: SPACING.sm,
                  textAlign: 'center',
                  opacity: isActive || isCompleted ? 1 : 0.6
                }} numberOfLines={1}>
                  {step.title}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Barre de progression (Optionnelle, mais redesignée si utilisée) */}
      {showProgressBar && (
        <View style={{ height: 4, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', borderRadius: 2, overflow: 'hidden', marginTop: SPACING.sm }}>
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: '100%',
              width: `${((currentStep) / (steps.length - 1)) * 100}%`
            }}
          />
        </View>
      )}
    </View>
  );
};

export default Stepper;
