/**
 * Types unifiés pour les produits - Mossombi
 * Élimine la duplication des interfaces Product
 */

// Interface de base pour tous les produits
export interface BaseProduct {
  id: string;
  name: string;
  price: number;
}

// Interface complète pour les produits e-commerce
export interface Product extends BaseProduct {
  rating: number;
  inStock: boolean;
  category: string;
  availability?: 'in-stock' | 'france' | 'china' | 'dubai';
  compareAtPrice?: number;
  description?: string;
}

// Interface pour les produits dans le panier (avec icône)
export interface CartProduct extends BaseProduct {
  icon?: React.ReactNode;
}

// Interface pour les produits vêtements
export interface ClothingProduct extends Product {
  size: string;
  color: string;
}

// Interface pour les produits avec quantité (checkout)
export interface ProductWithQuantity extends Product {
  quantity: number;
}

// Type guard pour vérifier si un produit a une note de comparaison
export function hasComparePrice(product: Product): product is Product & { compareAtPrice: number } {
  return product.compareAtPrice !== undefined && product.compareAtPrice > 0;
}

// Helper pour calculer la réduction
export function getDiscount(product: Product): number {
  if (!hasComparePrice(product)) return 0;
  return Math.round((1 - product.price / product.compareAtPrice) * 100);
}

// Convertir un Product en CartProduct
export function toCartProduct(product: Product, icon?: React.ReactNode): CartProduct {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    icon,
  };
}
