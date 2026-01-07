import React from 'react';
import { ShoppingPageLayout } from '@/components/templates';
import { useShoppingCart, Product } from '@/hooks/useShoppingCart';
import { useProductFilters } from '@/hooks/useProductFilters';

const products: Product[] = [
  { id: '1', name: 'T-shirt Classique', price: 15000, compareAtPrice: 20000, rating: 4.5, inStock: true, category: 'Homme', availability: 'in-stock', deliveryDays: 1 },
  { id: '2', name: 'Jeans Slim', price: 45000, rating: 4.6, inStock: true, category: 'Homme', availability: 'in-stock', deliveryDays: 1 },
  { id: '3', name: 'Robe Élégante', price: 65000, compareAtPrice: 80000, rating: 4.8, inStock: false, category: 'Femme', availability: 'france', deliveryDays: 7 },
  { id: '4', name: 'Chemise Business', price: 35000, rating: 4.4, inStock: true, category: 'Homme', availability: 'in-stock', deliveryDays: 1 },
  { id: '5', name: 'Ensemble Enfant', price: 25000, rating: 4.7, inStock: false, category: 'Enfant', availability: 'china', deliveryDays: 15 },
  { id: '6', name: 'Pantalon Femme', price: 55000, compareAtPrice: 70000, rating: 4.6, inStock: true, category: 'Femme', availability: 'in-stock', deliveryDays: 1 },
  { id: '7', name: 'Veste Homme', price: 85000, rating: 4.7, inStock: false, category: 'Homme', availability: 'dubai', deliveryDays: 10 },
  { id: '8', name: 'Chaussures Enfant', price: 30000, compareAtPrice: 35000, rating: 4.5, inStock: true, category: 'Enfant', availability: 'in-stock', deliveryDays: 1 },
];

const categories = ['Tous', 'Homme', 'Femme', 'Enfant'];

const priceRanges = {
  low: 30000,
  mid: 50000,
  high: 50000,
};

export default function ClothingScreen() {
  const cart = useShoppingCart(products);
  const filters = useProductFilters(products, priceRanges);

  return (
    <ShoppingPageLayout
      title="Habillement"
      products={products}
      categories={categories}
      {...filters}
      {...cart}
    />
  );
}
