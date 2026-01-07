import React from 'react';
import { ShoppingPageLayout } from '@/components/templates';
import { useShoppingCart, Product } from '@/hooks/useShoppingCart';
import { useProductFilters } from '@/hooks/useProductFilters';

const products: Product[] = [
  { id: '1', name: 'Riz 25kg', price: 35000, compareAtPrice: 40000, rating: 4.6, inStock: true, category: 'Sec', availability: 'in-stock', deliveryDays: 1 },
  { id: '2', name: 'Huile de palme 5L', price: 15000, rating: 4.5, inStock: true, category: 'Sec', availability: 'in-stock', deliveryDays: 1 },
  { id: '3', name: 'Viande de Boeuf', price: 8000, rating: 4.7, inStock: true, category: 'Frais', availability: 'in-stock', deliveryDays: 1 },
  { id: '4', name: 'Poisson Frais', price: 6000, compareAtPrice: 7000, rating: 4.8, inStock: false, category: 'Frais', availability: 'france', deliveryDays: 7 },
  { id: '5', name: 'Coca-Cola 1.5L', price: 2000, rating: 4.4, inStock: true, category: 'Boissons', availability: 'in-stock', deliveryDays: 1 },
  { id: '6', name: 'Farine 50kg', price: 45000, compareAtPrice: 50000, rating: 4.6, inStock: false, category: 'Sec', availability: 'china', deliveryDays: 15 },
  { id: '7', name: 'Poulet Frais', price: 12000, rating: 4.7, inStock: true, category: 'Frais', availability: 'in-stock', deliveryDays: 1 },
  { id: '8', name: 'Jus d\'Orange 2L', price: 3500, rating: 4.5, inStock: false, category: 'Boissons', availability: 'dubai', deliveryDays: 10 },
];

const categories = ['Tous', 'Frais', 'Sec', 'Boissons'];

const priceRanges = {
  low: 5000,
  mid: 15000,
  high: 15000,
};

export default function FoodScreen() {
  const cart = useShoppingCart(products);
  const filters = useProductFilters(products, priceRanges);

  return (
    <ShoppingPageLayout
      title="Alimentation"
      products={products}
      categories={categories}
      {...filters}
      {...cart}
    />
  );
}
