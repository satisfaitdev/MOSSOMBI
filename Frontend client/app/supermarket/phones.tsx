import React from 'react';
import { ShoppingPageLayout } from '@/components/templates';
import { useShoppingCart, Product } from '@/hooks/useShoppingCart';
import { useProductFilters } from '@/hooks/useProductFilters';

const products: Product[] = [
  { id: '1', name: 'iPhone 15 Pro Max', price: 2500000, compareAtPrice: 2800000, rating: 4.9, inStock: true, category: 'Smartphones', availability: 'in-stock', deliveryDays: 1 },
  { id: '2', name: 'Samsung Galaxy S24', price: 1800000, compareAtPrice: 2100000, rating: 4.8, inStock: true, category: 'Smartphones', availability: 'in-stock', deliveryDays: 1 },
  { id: '3', name: 'Xiaomi 14 Pro', price: 1200000, compareAtPrice: 1500000, rating: 4.7, inStock: false, category: 'Smartphones', availability: 'china', deliveryDays: 15 },
  { id: '4', name: 'Google Pixel 8', price: 1600000, rating: 4.6, inStock: false, category: 'Smartphones', availability: 'france', deliveryDays: 7 },
  { id: '5', name: 'OnePlus 12', price: 1400000, compareAtPrice: 1600000, rating: 4.7, inStock: true, category: 'Smartphones', availability: 'in-stock', deliveryDays: 1 },
  { id: '6', name: 'Huawei P60 Pro', price: 1300000, rating: 4.5, inStock: false, category: 'Smartphones', availability: 'dubai', deliveryDays: 10 },
  { id: '7', name: 'AirPods Pro 2', price: 400000, compareAtPrice: 450000, rating: 4.8, inStock: true, category: 'Accessoires', availability: 'in-stock', deliveryDays: 1 },
  { id: '8', name: 'Samsung Buds Pro', price: 250000, rating: 4.6, inStock: false, category: 'Accessoires', availability: 'france', deliveryDays: 7 },
  { id: '9', name: 'Coque iPhone Premium', price: 25000, compareAtPrice: 35000, rating: 4.5, inStock: true, category: 'Accessoires', availability: 'in-stock', deliveryDays: 1 },
  { id: '10', name: 'Chargeur Rapide 65W', price: 45000, rating: 4.7, inStock: false, category: 'Accessoires', availability: 'china', deliveryDays: 15 },
];

const categories = ['Tous', 'Smartphones', 'Accessoires'];

const priceRanges = {
  low: 500000,
  mid: 1500000,
  high: 1500000,
};

export default function PhonesScreen() {
  const cart = useShoppingCart(products);
  const filters = useProductFilters(products, priceRanges);

  return (
    <ShoppingPageLayout
      title="Téléphones & Accessoires"
      products={products}
      categories={categories}
      {...filters}
      {...cart}
    />
  );
}
