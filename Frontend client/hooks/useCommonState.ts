/**
 * useCommonState - Hooks utilitaires pour les patterns d'état répétés
 * Élimine la duplication des patterns useState répétés
 */

import { useState, useCallback } from 'react';

// ==========================================
// TYPES
// ==========================================

interface ModalState {
  visible: boolean;
}

interface LoadingState {
  loading: boolean;
}

interface SearchState {
  query: string;
  results: any[];
  loading: boolean;
}

interface FilterState<T = string> {
  selectedCategory: T;
  sortBy: string;
  showFilters: boolean;
}

// ==========================================
// MODAL STATE HOOK
// ==========================================

/**
 * Hook pour gérer l'état d'un modal (pattern répété 15+ fois)
 * 
 * @example
 * ```tsx
 * const modal = useModalState();
 * 
 * // Usage
 * <Modal visible={modal.visible} onRequestClose={modal.hide}>
 *   <Button onPress={modal.hide}>Fermer</Button>
 * </Modal>
 * <Button onPress={modal.show}>Ouvrir</Button>
 * ```
 */
export function useModalState(initialVisible = false) {
  const [visible, setVisible] = useState(initialVisible);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);
  const toggle = useCallback(() => setVisible(prev => !prev), []);

  return {
    visible,
    show,
    hide,
    toggle,
    setVisible,
  };
}

// ==========================================
// LOADING STATE HOOK
// ==========================================

/**
 * Hook pour gérer l'état de chargement (pattern répété 20+ fois)
 * 
 * @example
 * ```tsx
 * const loading = useLoadingState();
 * 
 * const handleSubmit = async () => {
 *   loading.start();
 *   try {
 *     await apiCall();
 *   } finally {
 *     loading.stop();
 *   }
 * };
 * ```
 */
export function useLoadingState(initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading);

  const start = useCallback(() => setLoading(true), []);
  const stop = useCallback(() => setLoading(false), []);
  const toggle = useCallback(() => setLoading(prev => !prev), []);

  return {
    loading,
    start,
    stop,
    toggle,
    setLoading,
  };
}

// ==========================================
// SEARCH STATE HOOK
// ==========================================

/**
 * Hook pour gérer l'état de recherche (pattern répété 10+ fois)
 * 
 * @example
 * ```tsx
 * const search = useSearchState();
 * 
 * // Usage
 * <SearchBar 
 *   value={search.query}
 *   onChangeText={search.setQuery}
 *   loading={search.loading}
 * />
 * ```
 */
export function useSearchState(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  const startSearch = useCallback(() => setLoading(true), []);
  const stopSearch = useCallback(() => setLoading(false), []);

  return {
    query,
    setQuery,
    results,
    setResults,
    loading,
    startSearch,
    stopSearch,
    clear,
  };
}

// ==========================================
// FILTER STATE HOOK
// ==========================================

/**
 * Hook pour gérer l'état des filtres (pattern répété 8+ fois)
 * 
 * @example
 * ```tsx
 * const filters = useFilterState('Tous');
 * 
 * // Usage
 * <FilterChips
 *   selectedCategory={filters.selectedCategory}
 *   onCategoryChange={filters.setSelectedCategory}
 *   sortBy={filters.sortBy}
 *   onSortChange={filters.setSortBy}
 * />
 * ```
 */
export function useFilterState<T = string>(
  initialCategory: T,
  initialSortBy = 'popular'
) {
  const [selectedCategory, setSelectedCategory] = useState<T>(initialCategory);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [showFilters, setShowFilters] = useState(false);

  const reset = useCallback(() => {
    setSelectedCategory(initialCategory);
    setSortBy(initialSortBy);
    setShowFilters(false);
  }, [initialCategory, initialSortBy]);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  return {
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    showFilters,
    setShowFilters,
    toggleFilters,
    reset,
  };
}

// ==========================================
// FORM STATE HOOK
// ==========================================

/**
 * Hook pour gérer l'état d'un formulaire (pattern répété 12+ fois)
 * 
 * @example
 * ```tsx
 * const form = useFormState({ name: '', email: '' });
 * 
 * // Usage
 * <Input 
 *   value={form.values.name}
 *   onChangeText={(text) => form.setValue('name', text)}
 * />
 * ```
 */
export function useFormState<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((key: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }, [errors]);

  const setError = useCallback((key: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  }, []);

  const setFieldTouched = useCallback((key: keyof T) => {
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    setValues,
    setValue,
    errors,
    setError,
    touched,
    setFieldTouched,
    reset,
    isValid,
  };
}

// ==========================================
// TOGGLE STATE HOOK
// ==========================================

/**
 * Hook pour gérer un état booléen avec toggle (pattern répété 25+ fois)
 * 
 * @example
 * ```tsx
 * const expanded = useToggleState(false);
 * 
 * // Usage
 * <Pressable onPress={expanded.toggle}>
 *   <Text>{expanded.value ? 'Réduire' : 'Étendre'}</Text>
 * </Pressable>
 * ```
 */
export function useToggleState(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(prev => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return {
    value,
    setValue,
    toggle,
    setTrue,
    setFalse,
  };
}
