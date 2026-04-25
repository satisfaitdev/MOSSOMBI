import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Calendar, Phone } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { GRADIENTS } from '@/constants/gradients';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import { GlassContainer } from '@/components/ui/GlassContainer';

// ==========================================
// TYPES
// ==========================================

type InputVariant = 'default' | 'search' | 'date' | 'number' | 'phone' | 'textarea';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: InputVariant;
  required?: boolean;
  gradientBorder?: boolean;
}

// ==========================================
// INPUT COMPONENT
// ==========================================

/**
 * Input component amélioré avec variants
 * 
 * @example
 * <Input label="Nom" placeholder="Entrez votre nom" />
 * <Input variant="search" placeholder="Rechercher..." />
 * <Input variant="phone" label="Téléphone" />
 * <Input variant="textarea" label="Message" multiline rows={4} />
 */
export default function Input({
  label,
  error,
  helperText,
  icon,
  rightIcon,
  variant = 'default',
  required = false,
  gradientBorder = false,
  style,
  multiline,
  ...props
}: InputProps) {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Déterminer l'icône selon le variant
  const getVariantIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'search':
        return <Search size={20} color={colors.textSecondary} />;
      case 'date':
        return <Calendar size={20} color={colors.textSecondary} />;
      case 'phone':
        return <Phone size={20} color={colors.textSecondary} />;
      default:
        return null;
    }
  };

  // Props spécifiques selon le variant
  const getVariantProps = (): Partial<TextInputProps> => {
    switch (variant) {
      case 'search':
        return {
          autoCapitalize: 'none',
          autoCorrect: false,
          returnKeyType: 'search',
        };
      case 'number':
        return {
          keyboardType: 'numeric',
        };
      case 'phone':
        return {
          keyboardType: 'phone-pad',
          autoCapitalize: 'none',
        };
      case 'date':
        return {
          keyboardType: 'numeric',
          placeholder: props.placeholder || 'JJ/MM/AAAA',
        };
      case 'textarea':
        return {
          multiline: true,
          numberOfLines: 4,
          textAlignVertical: 'top',
        };
      default:
        return {};
    }
  };

  const variantIcon = getVariantIcon();
  const variantProps = getVariantProps();
  const isTextarea = variant === 'textarea' || multiline;

  return (
    <View style={styles.container}>
      {label && (
        <AdaptiveText
          variant="body"
          weight="medium"
          color={colors.text}
          style={[
            styles.label,
            {
              fontSize: TYPOGRAPHY.sizes.sm,
              marginBottom: SPACING.xs,
            },
          ]}
        >
          {label}
          {required && (
            <AdaptiveText variant="body" weight="medium" color={colors.error}>
              {' '}*
            </AdaptiveText>
          )}
        </AdaptiveText>
      )}
      
      {gradientBorder ? (
        <LinearGradient
          colors={GRADIENTS.primary.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientBorder,
            isTextarea && styles.textareaGradientBorder,
            {
              borderRadius: BORDER_RADIUS.lg,
            },
          ]}
        >
          <View
            style={[
              styles.inputContainer,
              styles.gradientInputContainer,
              isTextarea && styles.textareaContainer,
              {
                backgroundColor: colors.surface,
                borderRadius: BORDER_RADIUS.lg - 1,
                paddingHorizontal: SPACING.md,
              },
            ]}
          >
            {variantIcon && (
              <View style={[styles.iconContainer, isTextarea && styles.iconTop]}>
                {variantIcon}
              </View>
            )}
            
            <TextInput
              style={[
                styles.input,
                isTextarea && styles.textarea,
                {
                  color: colors.text,
                  fontSize: TYPOGRAPHY.sizes.sm,
                },
                style,
              ]}
              placeholderTextColor={colors.textTertiary}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              {...variantProps}
              {...props}
            />
            
            {rightIcon && (
              <View style={[styles.iconContainer, isTextarea && styles.iconTop]}>
                {rightIcon}
              </View>
            )}
          </View>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.inputContainer,
            isTextarea && styles.textareaContainer,
            {
              backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surface,
              borderColor: error
                ? colors.error
                : isFocused
                  ? `${colors.primary}66`
                  : colors.border,
              borderWidth: Platform.OS === 'ios' ? 1 : (isFocused ? 2 : 1),
              borderRadius: BORDER_RADIUS.lg,
              paddingHorizontal: 0,
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <GlassContainer
              blur={isDark ? 75 : 60}
              tint={isDark ? 'dark' : 'light'}
              opacity={isDark ? 0.04 : 0.08}
              borderRadius={BORDER_RADIUS.lg}
              style={{
                flex: 1,
                minHeight: 48,
                flexDirection: 'row',
                alignItems: isTextarea ? 'flex-start' : 'center',
                paddingHorizontal: SPACING.md,
                paddingVertical: isTextarea ? SPACING.sm : 0,
              }}
            >
              {variantIcon && (
                <View style={[styles.iconContainer, isTextarea && styles.iconTop]}>
                  {variantIcon}
                </View>
              )}

              <TextInput
                style={[
                  styles.input,
                  isTextarea && styles.textarea,
                  {
                    color: colors.text,
                    fontSize: TYPOGRAPHY.sizes.sm,
                  },
                  style,
                ]}
                placeholderTextColor={colors.textTertiary}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...variantProps}
                {...props}
              />

              {rightIcon && (
                <View style={[styles.iconContainer, isTextarea && styles.iconTop]}>
                  {rightIcon}
                </View>
              )}
            </GlassContainer>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: isTextarea ? 'flex-start' : 'center',
                flex: 1,
                paddingHorizontal: SPACING.md,
              }}
            >
              {variantIcon && (
                <View style={[styles.iconContainer, isTextarea && styles.iconTop]}>
                  {variantIcon}
                </View>
              )}

              <TextInput
                style={[
                  styles.input,
                  isTextarea && styles.textarea,
                  {
                    color: colors.text,
                    fontSize: TYPOGRAPHY.sizes.sm,
                  },
                  style,
                ]}
                placeholderTextColor={colors.textTertiary}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...variantProps}
                {...props}
              />

              {rightIcon && (
                <View style={[styles.iconContainer, isTextarea && styles.iconTop]}>
                  {rightIcon}
                </View>
              )}
            </View>
          )}
        </View>
      )}
      
      {(error || helperText) && (
        <AdaptiveText
          variant="caption"
          weight="regular"
          color={error ? colors.error : colors.textSecondary}
          style={[
            styles.helperText,
            {
              fontSize: TYPOGRAPHY.sizes.xs,
              marginTop: SPACING.xs,
            },
          ]}
        >
          {error || helperText}
        </AdaptiveText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  textareaContainer: {
    alignItems: 'flex-start',
    minHeight: 100,
    paddingVertical: SPACING.sm,
  },
  gradientBorder: {
    padding: 2, // Épaisseur de la bordure dégradée
    minHeight: 52, // 48 + 4 (2px de chaque côté)
  },
  textareaGradientBorder: {
    minHeight: 104, // 100 + 4 (2px de chaque côté)
  },
  gradientInputContainer: {
    minHeight: 48,
    margin: 0,
  },
  iconContainer: {
    marginHorizontal: SPACING.sm,
  },
  iconTop: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.xs,
  },
  textarea: {
    minHeight: 80,
    paddingTop: SPACING.sm,
  },
  helperText: {},
});
