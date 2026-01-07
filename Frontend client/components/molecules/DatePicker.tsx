import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Modal } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { Heading, Body, Caption } from '@/components/atoms';
import { Row, Stack } from '@/components/ui';
import Button from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  label?: string;
  placeholder?: string;
  mode?: 'single' | 'range';
  startDate?: Date;
  endDate?: Date;
  onRangeChange?: (start: Date, end: Date) => void;
}

// ==========================================
// DATE PICKER COMPONENT
// ==========================================

/**
 * DatePicker - Calendrier complet réutilisable
 * 
 * Remplace 1000+ lignes de date picker dupliqué dans l'app
 * 
 * @example Date simple
 * <DatePicker
 *   value={date}
 *   onChange={setDate}
 *   label="Date de départ"
 *   minDate={new Date()}
 * />
 * 
 * @example Range de dates
 * <DatePicker
 *   mode="range"
 *   startDate={checkIn}
 *   endDate={checkOut}
 *   onRangeChange={(start, end) => {
 *     setCheckIn(start);
 *     setCheckOut(end);
 *   }}
 *   label="Dates de séjour"
 * />
 */
export default function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  placeholder = 'Sélectionner une date',
  mode = 'single',
  startDate,
  endDate,
  onRangeChange,
}: DatePickerProps) {
  const { colors } = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);

  // Format date pour affichage
  const formatDate = (date?: Date) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Affichage du champ
  const displayValue = mode === 'range'
    ? startDate && endDate
      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
      : placeholder
    : formatDate(value);

  // Générer les jours du mois
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Jours vides au début
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Navigation mois
  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Sélection de date
  const handleDateSelect = (date: Date) => {
    if (mode === 'single') {
      onChange?.(date);
      setShowCalendar(false);
    } else {
      // Mode range
      if (!tempStartDate || (tempStartDate && endDate)) {
        // Début d'une nouvelle sélection
        setTempStartDate(date);
        onRangeChange?.(date, date);
      } else {
        // Fin de la sélection
        if (date < tempStartDate) {
          onRangeChange?.(date, tempStartDate);
        } else {
          onRangeChange?.(tempStartDate, date);
        }
        setTempStartDate(undefined);
        setShowCalendar(false);
      }
    }
  };

  // Vérifier si une date est sélectionnée
  const isDateSelected = (date: Date) => {
    if (mode === 'single') {
      return value && date.toDateString() === value.toDateString();
    } else {
      if (!startDate || !endDate) return false;
      return date >= startDate && date <= endDate;
    }
  };

  // Vérifier si une date est aujourd'hui
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Vérifier si une date est disabled
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <View style={styles.container}>
      {label && (
        <Caption style={{ marginBottom: SPACING.xs }}>
          {label}
        </Caption>
      )}

      {/* Champ de sélection */}
      <Pressable
        onPress={() => setShowCalendar(true)}
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: BORDER_RADIUS.lg,
          },
        ]}
      >
        <Calendar size={20} color={colors.textSecondary} />
        <Body style={{ flex: 1, color: value || (startDate && endDate) ? colors.text : colors.textTertiary }}>
          {displayValue}
        </Body>
      </Pressable>

      {/* Modal Calendrier */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCalendar(false)}
        >
          <Pressable
            style={[
              styles.calendarContainer,
              {
                backgroundColor: colors.card,
                borderRadius: BORDER_RADIUS.xl,
              },
              SHADOWS.xl,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: colors.border,
                  paddingBottom: SPACING.md,
                  marginBottom: SPACING.md,
                },
              ]}
            >
              <Heading level={3}>
                {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </Heading>
              
              <Pressable
                onPress={() => setShowCalendar(false)}
                style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
              >
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Navigation mois */}
            <Row spacing="md" justify="space-between" style={{ marginBottom: SPACING.md }}>
              <Pressable
                onPress={handlePreviousMonth}
                style={({ pressed }) => [
                  styles.navButton,
                  { backgroundColor: pressed ? colors.surface : 'transparent' },
                ]}
              >
                <ChevronLeft size={24} color={colors.text} />
              </Pressable>

              <Pressable
                onPress={handleNextMonth}
                style={({ pressed }) => [
                  styles.navButton,
                  { backgroundColor: pressed ? colors.surface : 'transparent' },
                ]}
              >
                <ChevronRight size={24} color={colors.text} />
              </Pressable>
            </Row>

            {/* Jours de la semaine */}
            <View style={styles.weekDaysContainer}>
              {weekDays.map(day => (
                <View key={day} style={styles.weekDay}>
                  <Caption style={{ textAlign: 'center', color: colors.textSecondary }}>
                    {day}
                  </Caption>
                </View>
              ))}
            </View>

            {/* Jours du mois */}
            <View style={styles.daysContainer}>
              {days.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const selected = isDateSelected(day);
                const today = isToday(day);
                const disabled = isDateDisabled(day);

                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => !disabled && handleDateSelect(day)}
                    disabled={disabled}
                    style={({ pressed }) => [
                      styles.dayCell,
                      selected && {
                        backgroundColor: colors.primary,
                      },
                      today && !selected && {
                        borderWidth: 2,
                        borderColor: colors.primary,
                      },
                      pressed && !disabled && {
                        backgroundColor: colors.surface,
                      },
                      disabled && {
                        opacity: 0.3,
                      },
                    ]}
                  >
                    <Body
                      style={{
                        color: selected ? '#FFFFFF' : colors.text,
                        fontWeight: today ? TYPOGRAPHY.weights.bold : TYPOGRAPHY.weights.regular,
                      }}
                    >
                      {day.getDate()}
                    </Body>
                  </Pressable>
                );
              })}
            </View>

            {/* Footer */}
            <View style={{ marginTop: SPACING.lg }}>
              <Button
                title="Aujourd'hui"
                onPress={() => handleDateSelect(new Date())}
                variant="outline"
                size="md"
                fullWidth
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1,
    minHeight: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 400,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  navButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100 / 7 jours
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
});
