import React from 'react';
import { ShoppingPageLayout } from '@/components/templates';
import { useShoppingCart, Product } from '@/hooks/useShoppingCart';
import { useProductFilters } from '@/hooks/useProductFilters';

const products: Product[] = [
  { id: '1', name: 'Couches Pampers', price: 25000, compareAtPrice: 30000, rating: 4.8, inStock: true, category: '0-2 ans', availability: 'in-stock', deliveryDays: 1, image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400' },
  { id: '2', name: 'Lait en Poudre', price: 35000, rating: 4.7, inStock: true, category: '0-2 ans', availability: 'in-stock', deliveryDays: 1, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400' },
  { id: '3', name: 'Poussette', price: 150000, compareAtPrice: 180000, rating: 4.6, inStock: false, category: '0-2 ans', availability: 'france', deliveryDays: 7, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400' },
  { id: '4', name: 'Jouet Éducatif', price: 15000, rating: 4.5, inStock: true, category: '3-6 ans', availability: 'in-stock', deliveryDays: 1, image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400' },
  { id: '5', name: 'Sac à Dos Enfant', price: 20000, rating: 4.4, inStock: false, category: '7+ ans', availability: 'china', deliveryDays: 15, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
  { id: '6', name: 'Biberon Anti-Colique', price: 12000, compareAtPrice: 15000, rating: 4.7, inStock: true, category: '0-2 ans', availability: 'in-stock', deliveryDays: 1, image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400' },
  { id: '7', name: 'Vêtements Bébé', price: 30000, rating: 4.6, inStock: false, category: '0-2 ans', availability: 'dubai', deliveryDays: 10, image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400' },
  { id: '8', name: 'Livre Éducatif', price: 8000, compareAtPrice: 10000, rating: 4.5, inStock: true, category: '3-6 ans', availability: 'in-stock', deliveryDays: 1, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400' },
];

const categories = ['Tous', '0-2 ans', '3-6 ans', '7+ ans'];

const priceRanges = {
  low: 20000,
  mid: 50000,
  high: 50000,
};

export default function BabyScreen() {
  const cart = useShoppingCart(products);
  const filters = useProductFilters(products, priceRanges);

  return (
    <ShoppingPageLayout
      title="Bébé & Enfants"
      products={products}
      categories={categories}
      {...filters}
      {...cart}
    />
  );
}