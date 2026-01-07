import { useState, useMemo } from 'react';
import { Product } from './useShoppingCart';

export interface PriceRanges {
  low: number;
  mid: number;
  high: number;
}

/**
 * Hook partagé pour la gestion des filtres de produits
 * Utilisé dans toutes les pages supermarket
 */
export function useProductFilters(products: Product[], priceRanges: PriceRanges) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in-stock' | 'france' | 'china' | 'dubai'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Recherche
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Catégorie
    if (selectedCategory !== 'Tous') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Prix
    if (priceRange === 'low') {
      filtered = filtered.filter(p => p.price < priceRanges.low);
    } else if (priceRange === 'mid') {
      filtered = filtered.filter(p => p.price >= priceRanges.low && p.price < priceRanges.mid);
    } else if (priceRange === 'high') {
      filtered = filtered.filter(p => p.price >= priceRanges.mid);
    }

    // Disponibilité
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(p => p.availability === availabilityFilter);
    }

    // Tri
    if (sortBy === 'price-asc') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [searchQuery, selectedCategory, sortBy, priceRange, availabilityFilter, products, priceRanges]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    showFilters,
    setShowFilters,
    priceRange,
    setPriceRange,
    availabilityFilter,
    setAvailabilityFilter,
    viewMode,
    setViewMode,
    filteredProducts,
  };
}
