# COMPOSANTS BOOKINGS RÉUTILISABLES

Cette documentation explique comment utiliser les nouveaux composants réutilisables créés pour les pages de réservation.

## 📦 Composants Disponibles

### 1. BookingModal
Modal générique pour les réservations avec formulaires dynamiques.

```tsx
import { BookingModal } from '@/components/organisms';

<BookingModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleConfirm}
  title="Confirmer la réservation"
  serviceName="Hôtel Memling"
  serviceDetails="Suite Deluxe • 2 nuits"
  totalPrice={360000}
  currency="CDF"
  fields={[
    { key: 'name', label: 'Nom complet', placeholder: 'Votre nom', required: true },
    { key: 'email', label: 'Email', placeholder: 'votre@email.com', required: true, keyboardType: 'email-address' },
    { key: 'phone', label: 'Téléphone', placeholder: '+243...', required: true, variant: 'phone' }
  ]}
/>
```

### 2. BookingResultCard
Carte générique pour afficher les résultats de recherche.

```tsx
import { BookingResultCard } from '@/components/organisms';

<BookingResultCard
  title="Hôtel Memling"
  subtitle="Gombe, Kinshasa"
  rating={4.8}
  reviewCount={124}
  price={180000}
  currency="CDF"
  compareAtPrice={220000}
  badges={['WiFi', 'Piscine', 'Spa']}
  features={[
    { icon: Users, label: '4 invités max' },
    { icon: MapPin, label: 'Centre-ville' }
  ]}
  availability={{ status: 'available', text: 'Disponible' }}
  onPress={() => handleSelect(item)}
  onBook={() => handleBook(item)}
/>
```

### 3. TripTypeFilters
Filtres pour sélectionner le type de voyage (aller simple/retour).

```tsx
import { TripTypeFilters } from '@/components/organisms';

<TripTypeFilters
  tripType={tripType}
  onTripTypeChange={setTripType}
  labels={{
    oneWay: 'Aller simple',
    roundTrip: 'Aller-retour'
  }}
/>
```

### 4. ClassFilters
Filtres pour sélectionner la classe de service.

```tsx
import { ClassFilters } from '@/components/organisms';

<ClassFilters
  selectedClass={flightClass}
  onClassChange={setFlightClass}
  classes={[
    { id: 'economy', label: 'Économique', description: 'Confort standard' },
    { id: 'business', label: 'Affaires', description: 'Confort supérieur' },
    { id: 'first', label: 'Première', description: 'Luxe maximum' }
  ]}
  title="Classe de service"
/>
```

### 5. LocationSuggestions
Modal de suggestions pour la sélection de destinations.

```tsx
import { LocationSuggestions, LocationItem } from '@/components/organisms';

<LocationSuggestions
  visible={showSuggestions}
  suggestions={filteredAirports}
  onSelect={(airport) => {
    setDestination(airport.code);
    setShowSuggestions(false);
  }}
  renderItem={(airport) => (
    <LocationItem
      title={airport.city}
      subtitle={`${airport.code} - ${airport.name}`}
      description={airport.country}
      icon={MapPin}
    />
  )}
  position={{ top: 247, left: SPACING.lg, right: SPACING.lg }}
  maxHeight={250}
/>
```

## 🎯 Pages Cibles

Ces composants sont conçus pour être utilisés dans :

- ✅ **hotel.tsx** - Réservation d'hôtels
- ✅ **flight.tsx** - Réservation de vols
- ✅ **car.tsx** - Location de voitures
- ✅ **bus.tsx** - Réservation de bus
- ✅ **train.tsx** - Réservation de trains
- ✅ **guide.tsx** - Guide touristique
- ✅ **visa.tsx** - Demande de visa

## 📊 Avantages

### Avant (Code Dupliqué)
- 7 modals de réservation identiques (~200 lignes chacune)
- 7 cartes de résultats similaires (~150 lignes chacune)
- 5 filtres de classe dupliqués (~100 lignes chacune)
- **Total: ~3,500 lignes dupliquées**

### Après (Composants Réutilisables)
- 1 BookingModal générique (200 lignes)
- 1 BookingResultCard générique (160 lignes)
- 1 TripTypeFilters réutilisable (80 lignes)
- 1 ClassFilters réutilisable (90 lignes)
- **Total: ~530 lignes réutilisables**
- **Économie: ~85% de code dupliqué**

## 🚀 Migration Recommandée

### Phase 1: Composants Critiques
1. Remplacer les modals de réservation par `BookingModal`
2. Remplacer les cartes de résultats par `BookingResultCard`
3. Ajouter `TripTypeFilters` aux pages transport

### Phase 2: Optimisations
1. Centraliser les données de localisation
2. Ajouter `ClassFilters` aux pages appropriées
3. Standardiser les SuccessModal

### Phase 3: Maintenance
1. Supprimer le code dupliqué
2. Mettre à jour les tests
3. Documenter les patterns

## 📝 Exemple Complet

Voir `components/organisms/BookingsExample.tsx` pour un exemple d'utilisation complète de tous les composants.

## 🔧 Personnalisation

Tous les composants acceptent des props pour s'adapter aux besoins spécifiques :

- **BookingModal**: `fields`, `submitLabel`, `size`
- **BookingResultCard**: `badges`, `features`, `availability`
- **TripTypeFilters**: `labels` personnalisables
- **ClassFilters**: `classes`, `title` configurables

## ✅ Tests et Validation

- Composants testés avec TypeScript strict
- Props validées avec des types précis
- Exemples d'utilisation documentés
- Compatible avec le système de thèmes existant
