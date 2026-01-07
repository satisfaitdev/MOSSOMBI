# Composants Molecules

## FilterChips

Composant de filtres horizontaux réutilisable avec scroll et sélection unique.

### Props
- `options: FilterOption[] | string[]` - Liste des options (strings ou objets {id, label})
- `selected: string` - ID de l'option sélectionnée
- `onSelect: (value: string) => void` - Callback de sélection
- `style?: any` - Style personnalisé (optionnel)

### Exemples
```tsx
// Avec tableau de strings
<FilterChips
  options={['Tous', 'Poppo', 'TikTok', 'Gaming']}
  selected={selectedCategory}
  onSelect={setSelectedCategory}
/>

// Avec tableau d'objets
<FilterChips
  options={[
    { id: 'all', label: 'Tous' },
    { id: 'income', label: 'Revenus' },
    { id: 'expense', label: 'Dépenses' }
  ]}
  selected={filter}
  onSelect={setFilter}
/>
```

### Design
- **Taille** : Compact (padding: 16px horizontal, 4px vertical)
- **Police** : 12px (xs), medium weight
- **Couleurs** : Primary (sélectionné), Card (non sélectionné)
- **Forme** : Rounded full avec shadow
- **Scroll** : Horizontal sans indicateur

---

## ExclusiveServiceCard

Carte de service exclusif avec gradient et animations pour le carrousel.

### Props
- `coins: number` - Nombre de coins
- `price: number` - Prix en USD
- `compareAtPrice?: number` - Prix de comparaison (optionnel)
- `currency: string` - Devise
- `onPress: () => void` - Callback au clic
- `width: number` - Largeur de la carte

### Exemple
```tsx
<ExclusiveServiceCard
  coins={1500000}
  price={149}
  compareAtPrice={200}
  currency="USD"
  onPress={() => handlePurchase(service)}
  width={cardWidth}
/>
```

## CoinServiceCard

Carte de service coin standard pour la grille.

### Props
- `coins: number` - Nombre de coins
- `price: number` - Prix en USD
- `compareAtPrice?: number` - Prix de comparaison (optionnel)
- `onPress: () => void` - Callback au clic

### Exemple
```tsx
<CoinServiceCard
  coins={500000}
  price={50}
  onPress={() => handlePurchase(service)}
/>
```
