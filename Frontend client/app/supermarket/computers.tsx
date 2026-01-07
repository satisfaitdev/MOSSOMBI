import React from 'react';
import { ShoppingPageLayout } from '@/components/templates';
import { useShoppingCart, Product } from '@/hooks/useShoppingCart';
import { useProductFilters } from '@/hooks/useProductFilters';

const products: Product[] = [
  { id: '1', name: 'MacBook Pro M3 16"', price: 4500000, compareAtPrice: 5000000, rating: 4.9, inStock: true, category: 'Portable', availability: 'in-stock', deliveryDays: 1 },
  { id: '2', name: 'Dell XPS 15', price: 3200000, rating: 4.7, inStock: false, category: 'Portable', availability: 'france', deliveryDays: 7 },
  { id: '3', name: 'HP Pavilion Gaming', price: 2000000, compareAtPrice: 2400000, rating: 4.6, inStock: true, category: 'Gaming', availability: 'in-stock', deliveryDays: 1 },
  { id: '4', name: 'Lenovo ThinkPad X1', price: 2800000, rating: 4.8, inStock: false, category: 'Bureau', availability: 'china', deliveryDays: 15 },
  { id: '5', name: 'ASUS ROG Strix', price: 3500000, compareAtPrice: 3900000, rating: 4.7, inStock: true, category: 'Gaming', availability: 'in-stock', deliveryDays: 1 },
  { id: '6', name: 'Surface Pro 9', price: 2500000, rating: 4.6, inStock: false, category: 'Portable', availability: 'dubai', deliveryDays: 10 },
  { id: '7', name: 'iMac 24" M3', price: 3800000, rating: 4.8, inStock: true, category: 'Bureau', availability: 'in-stock', deliveryDays: 1 },
  { id: '8', name: 'Alienware Aurora', price: 5200000, compareAtPrice: 5800000, rating: 4.9, inStock: false, category: 'Gaming', availability: 'france', deliveryDays: 7 },
];

const categories = ['Tous', 'Portable', 'Gaming', 'Bureau'];

const priceRanges = {
  low: 2500000,
  mid: 4000000,
  high: 4000000,
};

export default function ComputersScreen() {
  const cart = useShoppingCart(products);
  const filters = useProductFilters(products, priceRanges);

  return (
    <ShoppingPageLayout
      title="Ordinateurs"
      products={products}
      categories={categories}
      {...filters}
      {...cart}
    />
  );
}
