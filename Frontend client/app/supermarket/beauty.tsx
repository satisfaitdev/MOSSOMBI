import React from 'react';
import { ShoppingPageLayout } from '@/components/templates';
import { useShoppingCart, Product } from '@/hooks/useShoppingCart';
import { useProductFilters } from '@/hooks/useProductFilters';

const products: Product[] = [
  { id: '1', name: 'Crème Hydratante L\'Oréal', price: 25000, compareAtPrice: 30000, rating: 4.7, inStock: true, category: 'Visage', availability: 'in-stock', deliveryDays: 1 },
  { id: '2', name: 'Lait Corps Nivea', price: 18000, rating: 4.6, inStock: true, category: 'Corps', availability: 'in-stock', deliveryDays: 1 },
  { id: '3', name: 'Parfum Homme Dior', price: 85000, compareAtPrice: 100000, rating: 4.9, inStock: false, category: 'Parfums', availability: 'france', deliveryDays: 7 },
  { id: '4', name: 'Rouge à Lèvres MAC', price: 35000, rating: 4.8, inStock: true, category: 'Visage', availability: 'in-stock', deliveryDays: 1 },
  { id: '5', name: 'Shampoing Garnier', price: 12000, rating: 4.5, inStock: false, category: 'Corps', availability: 'china', deliveryDays: 15 },
  { id: '6', name: 'Sérum Anti-Âge', price: 45000, compareAtPrice: 55000, rating: 4.8, inStock: true, category: 'Visage', availability: 'in-stock', deliveryDays: 1 },
  { id: '7', name: 'Parfum Femme Chanel', price: 95000, rating: 4.9, inStock: false, category: 'Parfums', availability: 'dubai', deliveryDays: 10 },
  { id: '8', name: 'Gel Douche', price: 8000, compareAtPrice: 10000, rating: 4.4, inStock: true, category: 'Corps', availability: 'in-stock', deliveryDays: 1 },
];

const categories = ['Tous', 'Visage', 'Corps', 'Parfums'];

const priceRanges = {
  low: 20000,
  mid: 40000,
  high: 40000,
};

export default function BeautyScreen() {
  const cart = useShoppingCart(products);
  const filters = useProductFilters(products, priceRanges);

  return (
    <ShoppingPageLayout
      title="Beauté & Santé"
      products={products}
      categories={categories}
      {...filters}
      {...cart}
    />
  );
}