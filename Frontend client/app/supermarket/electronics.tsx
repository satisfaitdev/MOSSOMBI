import React from 'react';
import { ShoppingPageLayout } from '@/components/templates';
import { useShoppingCart, Product } from '@/hooks/useShoppingCart';
import { useProductFilters } from '@/hooks/useProductFilters';

const products: Product[] = [
  { id: '1', name: 'Réfrigérateur Samsung 500L', price: 800000, compareAtPrice: 950000, rating: 4.8, inStock: true, category: 'Gros électroménager', availability: 'in-stock', deliveryDays: 1 },
  { id: '2', name: 'Machine à Laver LG 10kg', price: 600000, compareAtPrice: 750000, rating: 4.7, inStock: false, category: 'Gros électroménager', availability: 'france', deliveryDays: 7 },
  { id: '3', name: 'Climatiseur Split 12000 BTU', price: 450000, rating: 4.6, inStock: true, category: 'Climatisation', availability: 'in-stock', deliveryDays: 1 },
  { id: '4', name: 'Four Micro-ondes 30L', price: 180000, compareAtPrice: 220000, rating: 4.5, inStock: false, category: 'Petit électroménager', availability: 'china', deliveryDays: 15 },
  { id: '5', name: 'Cuisinière à Gaz 4 Feux', price: 250000, rating: 4.6, inStock: true, category: 'Gros électroménager', availability: 'in-stock', deliveryDays: 1 },
  { id: '6', name: 'Ventilateur sur Pied', price: 80000, compareAtPrice: 100000, rating: 4.4, inStock: false, category: 'Climatisation', availability: 'dubai', deliveryDays: 10 },
  { id: '7', name: 'Mixeur Blender 1000W', price: 45000, compareAtPrice: 55000, rating: 4.3, inStock: true, category: 'Petit électroménager', availability: 'in-stock', deliveryDays: 1 },
  { id: '8', name: 'Fer à Repasser Vapeur', price: 35000, rating: 4.2, inStock: false, category: 'Petit électroménager', availability: 'france', deliveryDays: 7 },
];

const categories = ['Tous', 'Gros électroménager', 'Petit électroménager', 'Climatisation'];

const priceRanges = {
  low: 200000,
  mid: 500000,
  high: 500000,
};

export default function ElectronicsScreen() {
  const cart = useShoppingCart(products);
  const filters = useProductFilters(products, priceRanges);

  return (
    <ShoppingPageLayout
      title="Électroménager"
      products={products}
      categories={categories}
      {...filters}
      {...cart}
    />
  );
}
