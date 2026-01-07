import React from 'react';
import { View, Text } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { Stack } from '@/components/ui';

interface PasswordCriteria {
  id: string;
  label: string;
  isValid: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  userInfo?: {
    full_name?: string;
    email?: string;
  };
  showCriteria?: boolean;
}

export default function PasswordStrengthIndicator({ 
  password, 
  userInfo = {}, 
  showCriteria = true 
}: PasswordStrengthIndicatorProps) {
  const { colors } = useTheme();

  // Validation des critères
  const validatePassword = (pwd: string): PasswordCriteria[] => {
    const criteria: PasswordCriteria[] = [
      {
        id: 'length',
        label: 'Au moins 8 caractères',
        isValid: pwd.length >= 8
      },
      {
        id: 'lowercase',
        label: 'Une lettre minuscule (a-z)',
        isValid: /[a-z]/.test(pwd)
      },
      {
        id: 'uppercase',
        label: 'Une lettre majuscule (A-Z)',
        isValid: /[A-Z]/.test(pwd)
      },
      {
        id: 'number',
        label: 'Un chiffre (0-9)',
        isValid: /[0-9]/.test(pwd)
      },
      {
        id: 'symbol',
        label: 'Un caractère spécial (!@#$%...)',
        isValid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
      }
    ];

    // Vérifications supplémentaires si on a les infos utilisateur
    if (userInfo.full_name) {
      const nameParts = userInfo.full_name.toLowerCase().split(/\s+/);
      const containsName = nameParts.some(part => 
        part.length > 2 && pwd.toLowerCase().includes(part)
      );
      
      criteria.push({
        id: 'no-name',
        label: 'Ne contient pas votre nom',
        isValid: !containsName
      });
    }

    if (userInfo.email) {
      const emailPart = userInfo.email.split('@')[0].toLowerCase();
      const containsEmail = emailPart.length > 2 && pwd.toLowerCase().includes(emailPart);
      
      criteria.push({
        id: 'no-email',
        label: 'Ne contient pas votre email',
        isValid: !containsEmail
      });
    }

    return criteria;
  };

  const criteria = validatePassword(password);
  const validCount = criteria.filter(c => c.isValid).length;
  const totalCount = criteria.length;
  const strengthPercentage = (validCount / totalCount) * 100;

  // Déterminer la couleur et le niveau de force
  const getStrengthInfo = () => {
    if (strengthPercentage < 40) {
      return { 
        color: colors.error, 
        label: 'Faible', 
        bgColor: colors.error + '20' 
      };
    } else if (strengthPercentage < 70) {
      return { 
        color: '#FF8C00', 
        label: 'Moyen', 
        bgColor: '#FF8C0020' 
      };
    } else if (strengthPercentage < 100) {
      return { 
        color: '#FFA500', 
        label: 'Bon', 
        bgColor: '#FFA50020' 
      };
    } else {
      return { 
        color: colors.success, 
        label: 'Excellent', 
        bgColor: colors.success + '20' 
      };
    }
  };

  const strengthInfo = getStrengthInfo();

  // Ne pas afficher si pas de mot de passe
  if (password.length === 0) {
    return null;
  }

  // Masquer complètement si tous les critères sont respectés (100%)
  if (strengthPercentage === 100) {
    return null;
  }

  // Affichage compact si le mot de passe est bon (>= 70%)
  const isCompactMode = strengthPercentage >= 70;

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      padding: isCompactMode ? SPACING.sm : SPACING.md,
      borderWidth: 1,
      borderColor: colors.border
    }}>
      <Stack spacing={isCompactMode ? "xs" : "sm"}>
        {/* Barre de progression - toujours visible */}
        <View>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.xs / 2
          }}>
            <Text style={{
              fontSize: isCompactMode ? TYPOGRAPHY.sizes.xs : TYPOGRAPHY.sizes.sm,
              fontWeight: TYPOGRAPHY.weights.semibold,
              color: colors.text
            }}>
              Force du mot de passe
            </Text>
            <View style={{
              backgroundColor: strengthInfo.bgColor,
              paddingHorizontal: SPACING.xs,
              paddingVertical: 1,
              borderRadius: BORDER_RADIUS.sm
            }}>
              <Text style={{
                fontSize: TYPOGRAPHY.sizes.xs,
                fontWeight: TYPOGRAPHY.weights.semibold,
                color: strengthInfo.color
              }}>
                {strengthInfo.label}
              </Text>
            </View>
          </View>
          
          <View style={{
            height: isCompactMode ? 3 : 4,
            backgroundColor: colors.border,
            borderRadius: BORDER_RADIUS.sm,
            overflow: 'hidden'
          }}>
            <View style={{
              width: `${strengthPercentage}%`,
              height: '100%',
              backgroundColor: strengthInfo.color,
              borderRadius: BORDER_RADIUS.sm
            }} />
          </View>
          
          {!isCompactMode && (
            <Text style={{
              fontSize: TYPOGRAPHY.sizes.xs,
              color: colors.textSecondary,
              marginTop: SPACING.xs / 2
            }}>
              {validCount} sur {totalCount} critères respectés
            </Text>
          )}
        </View>

        {/* Liste des critères - seulement ceux non respectés */}
        {showCriteria && !isCompactMode && (
          <View>
            {/* Afficher seulement les critères non respectés */}
            {criteria.filter(c => !c.isValid).length > 0 && (
              <>
                <Text style={{
                  fontSize: TYPOGRAPHY.sizes.sm,
                  fontWeight: TYPOGRAPHY.weights.semibold,
                  color: colors.text,
                  marginBottom: SPACING.xs
                }}>
                  Il manque encore :
                </Text>
                
                <Stack spacing="xs">
                  {criteria.filter(c => !c.isValid).map((criterion) => (
                    <View key={criterion.id} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: SPACING.sm
                    }}>
                      <View style={{
                        width: 16,
                        height: 16,
                        borderRadius: BORDER_RADIUS.full,
                        backgroundColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <X size={10} color={colors.textTertiary} />
                      </View>
                      
                      <Text style={{
                        fontSize: TYPOGRAPHY.sizes.sm,
                        color: colors.textSecondary,
                        flex: 1
                      }}>
                        {criterion.label}
                      </Text>
                    </View>
                  ))}
                </Stack>
              </>
            )}

            {/* Afficher les critères respectés de manière compacte */}
            {criteria.filter(c => c.isValid).length > 0 && (
              <View style={{
                marginTop: criteria.filter(c => !c.isValid).length > 0 ? SPACING.sm : 0
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.xs,
                  flexWrap: 'wrap'
                }}>
                  <Text style={{
                    fontSize: TYPOGRAPHY.sizes.xs,
                    color: colors.success,
                    fontWeight: TYPOGRAPHY.weights.medium
                  }}>
                    ✓ Validé :
                  </Text>
                  {criteria.filter(c => c.isValid).map((criterion, index) => (
                    <Text key={criterion.id} style={{
                      fontSize: TYPOGRAPHY.sizes.xs,
                      color: colors.success,
                    }}>
                      {criterion.label.toLowerCase()}{index < criteria.filter(c => c.isValid).length - 1 ? ', ' : ''}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </Stack>
    </View>
  );
}
