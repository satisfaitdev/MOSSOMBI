import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import { Body } from '@/components/atoms';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
}

// ==========================================
// COUNTER COMPONENT
// ==========================================

/**
 * Counter - Compteur universel pour quantités, passagers, etc.
 * 
 * @example
 * <Counter
 *   value={quantity}
 *   onChange={setQuantity}
 *   min={1}
 *   max={10}
 *   label="Quantité"
 * />
 */
export default function Counter({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  disabled = false,
}: CounterProps) {
  const { colors } = useTheme();

  const handleDecrement = () => {
    if (value > min && !disabled) {
      onChange(value - step);
    }
  };

  const handleIncrement = () => {
    if (value < max && !disabled) {
      onChange(value + step);
    }
  };

  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  return (
    <View style={styles.container}>
      {label && (
        <Body variant="secondary" style={{ marginBottom: SPACING.xs }}>
          {label}
        </Body>
      )}
      
      <View style={styles.counterContainer}>
        <Pressable
          onPress={handleDecrement}
          disabled={!canDecrement}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: canDecrement ? colors.primary : colors.border,
              opacity: pressed && canDecrement ? 0.8 : 1,
              borderRadius: BORDER_RADIUS.md,
            },
          ]}
        >
          <Minus size={20} color={canDecrement ? '#FFFFFF' : colors.textTertiary} />
        </Pressable>

        <Body
          style={[
            styles.value,
            {
              color: colors.text,
              fontWeight: TYPOGRAPHY.weights.semibold,
            },
          ]}
        >
          {value}
        </Body>

        <Pressable
          onPress={handleIncrement}
          disabled={!canIncrement}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: canIncrement ? colors.primary : colors.border,
              opacity: pressed && canIncrement ? 0.8 : 1,
              borderRadius: BORDER_RADIUS.md,
            },
          ]}
        >
          <Plus size={20} color={canIncrement ? '#FFFFFF' : colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sizes.lg,
  },
});
