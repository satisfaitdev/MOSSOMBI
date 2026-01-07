import React, { useState, useMemo } from 'react';
import { View, TextInput, Pressable, FlatList, StyleSheet, Animated } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Body } from '@/components/atoms';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
  showSuggestions?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  loading?: boolean;
  autoFocus?: boolean;
  containerStyle?: any;
}

// ==========================================
// SEARCH BAR COMPONENT
// ==========================================

/**
 * SearchBar - Barre de recherche universelle avec suggestions
 * 
 * Remplace 30+ search bars custom dans l'app
 * 
 * @example Recherche simple
 * <SearchBar
 *   value={query}
 *   onChange={setQuery}
 *   placeholder="Rechercher..."
 * />
 * 
 * @example Avec suggestions autocomplete
 * <SearchBar
 *   value={query}
 *   onChange={setQuery}
 *   suggestions={filteredSuggestions}
 *   onSelectSuggestion={(suggestion) => {
 *     setQuery(suggestion);
 *     handleSearch(suggestion);
 *   }}
 *   showSuggestions={query.length >= 3}
 * />
 * 
 * @example Avec loading state
 * <SearchBar
 *   value={query}
 *   onChange={setQuery}
 *   loading={isSearching}
 * />
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Rechercher...',
  suggestions = [],
  onSelectSuggestion,
  showSuggestions = false,
  onFocus,
  onBlur,
  loading = false,
  autoFocus = false,
  containerStyle,
}: SearchBarProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Filtrer les suggestions selon la valeur
  const filteredSuggestions = useMemo(() => {
    if (!value || !showSuggestions) return [];
    
    return suggestions
      .filter(s => s.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 10); // Max 10 suggestions
  }, [value, suggestions, showSuggestions]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    // Délai pour permettre le clic sur suggestion
    setTimeout(() => {
      setIsFocused(false);
      onBlur?.();
    }, 200);
  };

  const handleClear = () => {
    onChange('');
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    onSelectSuggestion?.(suggestion);
    setIsFocused(false);
  };

  const showSuggestionsDropdown = isFocused && filteredSuggestions.length > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Search Input */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: isFocused ? colors.primary : colors.border,
            borderWidth: isFocused ? 2 : 1,
            borderRadius: BORDER_RADIUS.lg,
          },
          isFocused && SHADOWS.md,
        ]}
      >
        <Search size={20} color={colors.textSecondary} />
        
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: TYPOGRAPHY.sizes.md,
            },
          ]}
        />

        {(value.length > 0 || loading) && (
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [
              styles.clearButton,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <X size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            SHADOWS.lg,
          ]}
        >
          <FlatList
            data={filteredSuggestions}
            keyExtractor={(item, index) => `${item}-${index}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => handleSelectSuggestion(item)}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  {
                    backgroundColor: pressed ? colors.surface : 'transparent',
                    borderBottomWidth: index < filteredSuggestions.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Search size={16} color={colors.textTertiary} />
                <Body numberOfLines={1} style={{ flex: 1, marginLeft: SPACING.sm }}>
                  {item}
                </Body>
              </Pressable>
            )}
            style={styles.suggestionsList}
          />
        </View>
      )}
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    minHeight: 48,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    maxHeight: 300,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
});
