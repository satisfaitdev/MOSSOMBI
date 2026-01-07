import { useState, useMemo } from 'react';

interface FilterableItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  isExclusive?: boolean;
}

/**
 * Hook personnalisé pour gérer la recherche et le filtrage de services
 * 
 * @example
 * const { 
 *   searchQuery, 
 *   setSearchQuery,
 *   selectedCategory,
 *   setSelectedCategory,
 *   filteredItems,
 *   exclusiveItems,
 *   categories 
 * } = useServiceFilters(services);
 */
export function useServiceFilters<T extends FilterableItem>(items: T[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    const cats = ['Tous', ...new Set(items.map((item) => item.category))];
    return cats;
  }, [items]);

  // Filtrer les items exclusifs
  const exclusiveItems = useMemo(() => {
    return items.filter((item) => item.isExclusive);
  }, [items]);

  // Filtrer les items selon la catégorie et la recherche
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filtre par catégorie
    if (selectedCategory !== 'Tous') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          item.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, selectedCategory, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredItems,
    exclusiveItems,
    categories,
  };
}
