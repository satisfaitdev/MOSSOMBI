# 🎬 SYSTÈME D'ANIMATIONS CENTRALISÉ MOSSOMBI

## 📋 Vue d'ensemble

Le système d'animations centralisé garantit la cohérence visuelle et facilite la maintenance de toutes les animations dans l'application Mossombi.

## 🎯 Avantages

- ✅ **Cohérence** : Même timing et couleurs partout
- ✅ **Maintenance** : 1 fichier pour toutes les modifications
- ✅ **Performance** : `useNativeDriver` activé par défaut
- ✅ **TypeScript** : Sécurité des types complète
- ✅ **Documentation** : Exemples et guide d'utilisation

## 🎨 Couleurs Système

```typescript
// Dans constants/animations.ts
export const ANIMATION_COLORS = {
  PRIMARY_BLUE: 'rgba(0, 85, 164, 0.6)',        // Bordures
  PRIMARY_BLUE_RIPPLE: 'rgba(0, 85, 164, 0.4)', // Bulles d'eau
  PRIMARY_BLUE_WEAK: 'rgba(0, 85, 164, 0.3)',   // Bottom bar
  SUCCESS: 'rgba(34, 197, 94, 0.6)',
  WARNING: 'rgba(251, 191, 36, 0.6)',
  ERROR: 'rgba(239, 68, 68, 0.6)',
}
```

## ⏱️ Durées Standard

```typescript
export const ANIMATION_DURATIONS = {
  FAST: 100,    // Animations rapides
  QUICK: 150,   // Transitions courtes
  NORMAL: 300,  // Durée standard
  SLOW: 400,    // Animations lentes
  BOUNCE: 200,  // Effets bounce
  RIPPLE: 300,  // Bulles d'eau
  MOUNT: 400,   // Ouverture de page
}
```

## 📊 Valeurs d'Animation

```typescript
export const ANIMATION_VALUES = {
  SCALE_BOUNCE: 1.15,  // Agrandissement bounce
  SCALE_STRONG: 1.1,   // Effet fort
  SCALE_GENTLE: 1.05,  // Effet doux
  RIPPLE_SCALE_START: 0.6,
  RIPPLE_SCALE_END: 1.4,
  MOUNT_SCALE_START: 0,
  MOUNT_SCALE_END: 1,
}
```

## 🛠️ Fonctions Utilitaires

### Scale Bounce
```typescript
import { createScaleBounceAnimation } from '@/constants/animations';

createScaleBounceAnimation(
  animatedValue,
  ANIMATION_VALUES.SCALE_BOUNCE, // toValue
  ANIMATION_DURATIONS.BOUNCE      // duration
).start(() => {
  // Action après animation
});
```

### Ripple (Bulle d'Eau)
```typescript
import { createRippleAnimation } from '@/constants/animations';

createRippleAnimation(
  scaleAnim,
  opacityAnim,
  ANIMATION_COLORS.PRIMARY_BLUE_RIPPLE,
  ANIMATION_DURATIONS.RIPPLE
).start();
```

### Animation d'Ouverture
```typescript
import { createMountAnimation } from '@/constants/animations';

createMountAnimation(
  scaleAnim,
  opacityAnim,
  ANIMATION_DURATIONS.MOUNT
).start();
```

## 📱 Composants Utilisant le Système

### StyledCloseButton
```tsx
import { StyledCloseButton } from '@/components/atoms';

<StyledCloseButton
  onPress={() => navigation.goBack()}
  animateOnMount={true}
  size={50}
/>
```

### AnimatedButton
```tsx
import { AnimatedButton } from '@/components/atoms';

<AnimatedButton
  title="Confirmer"
  onPress={handleConfirm}
  variant="success"
/>
```

### ModalHeader
```tsx
import { ModalHeader } from '@/components/organisms';

<ModalHeader
  title="Mon Panier"
  onClose={() => setModalVisible(false)}
  animateOnMount={true}
  titleSize="lg"
  paddingBottom="sm"
/>
```

## 🎮 Utilisation Personnalisée

```typescript
import {
  ANIMATION_COLORS,
  ANIMATION_DURATIONS,
  ANIMATION_VALUES,
  createScaleBounceAnimation
} from '@/constants/animations';

const CustomButton = () => {
  const scaleAnim = useRef(new Animated.Value(1));

  const handlePress = () => {
    // Animation personnalisée
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: ANIMATION_VALUES.SCALE_BOUNCE,
        duration: ANIMATION_DURATIONS.QUICK,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: ANIMATION_DURATIONS.QUICK,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Action après animation
      onConfirm();
    });
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={handlePress}>
        <Text>Mon Bouton</Text>
      </Pressable>
    </Animated.View>
  );
};
```

## 🚀 Refactorisation du Bottom Bar

### Avant (Code Inline)
```tsx
// ❌ 60+ lignes de code dupliqué dans ShoppingPageLayout
const rippleAnim = useRef(new Animated.Value(0));
const rippleOpacity = useRef(new Animated.Value(0));
const scaleAnim = useRef(new Animated.Value(1));

const handleCartPress = () => {
  // Animation logic...
};

// 50+ lignes de JSX avec BlurView, MaskedView, etc.
<Animated.View style={styles.floatingCartContainer}>
  <BlurView style={styles.floatingCartBlur}>
    // Complex JSX with animations...
  </BlurView>
</Animated.View>
```

### Après (Composant Réutilisable)
```tsx
// ✅ 3 lignes dans ShoppingPageLayout
<FloatingCartButton
  itemCount={cartCount}
  onPress={() => setCartModalVisible(true)}
  title="Voir le panier"
/>

// ✅ Composant autonome avec animations centralisées
export default function FloatingCartButton({ itemCount, onPress, title }) {
  // Animations gérées par le système centralisé
}
```

## 🚀 Refactorisation des En-têtes de Modals

### Avant (Code Dupliqué)
```tsx
// ❌ Code dupliqué dans CartModal & CheckoutModal
const insets = useSafeAreaInsets();

<View style={[styles.modalHeader, { backgroundColor: colors.card, paddingTop: insets.top + SPACING.sm }]}>
  <View style={styles.modalHeaderContent}>
    <Text style={[styles.modalTitle, { color: colors.text, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold }]}>
      Mon Panier
    </Text>
    <StyledCloseButton key={`close-${visible}`} onPress={onClose} animateOnMount={true} />
  </View>
</View>

// + 50+ lignes de styles dupliqués (modalHeader, modalHeaderContent, modalTitle)
```

### Après (Composant Réutilisable)
```tsx
// ✅ 6 lignes dans CartModal
<ModalHeader
  title="Mon Panier"
  onClose={onClose}
  animateOnMount={true}
  closeButtonKey={`close-${visible}`}
  titleSize="lg"
  paddingBottom="sm"
/>

// ✅ 6 lignes dans CheckoutModal
<ModalHeader
  title="Confirmation de commande"
  onClose={onClose}
  animateOnMount={true}
  titleSize="lg"
  paddingBottom="xs"
/>
```

### 📈 Gains de la Refactorisation

- **-120 lignes** de code dupliqué (2 modals × 60 lignes)
- **+1 composant** réutilisable (ModalHeader)
- **Cohérence** : Même design et animations partout
- **Maintenance** : Modifications centralisées
- **Safe Area** : Gestion automatique des insets

### 🎛️ Options de Personnalisation

```tsx
// Titre de différentes tailles
<ModalHeader title="Options" titleSize="sm" />
<ModalHeader title="Mon Panier" titleSize="lg" />
<ModalHeader title="Détails" titleSize="xl" />

// Padding ajustable
<ModalHeader title="Modal" paddingBottom="xs" />
<ModalHeader title="Modal" paddingBottom="md" />

// Animation optionnelle
<ModalHeader title="Modal" animateOnMount={true} />
```

## 📈 Performance

- ✅ **useNativeDriver** activé par défaut
- ✅ **Animations optimisées** pour 60fps
- ✅ **Callback après completion** pour actions
- ✅ **Memory efficient** avec useRef

## 🎨 Cohérence Visuelle

Tous les composants utilisent maintenant :
- ✅ **Même couleur bleue** : `rgba(0, 85, 164, ...)`
- ✅ **Même timing** : 300ms pour les bulles, 200ms pour les bounces
- ✅ **Même easing** : spring pour les ouvertures
- ✅ **Mêmes valeurs** : scale 1.15 pour les bounces

## 🔧 Maintenance

Pour modifier une animation dans toute l'application :
1. **Modifier** la constante dans `constants/animations.ts`
2. **Rebuild** l'application
3. **Tous les composants** sont automatiquement mis à jour !

Exemple : Changer la durée des bounces de 200ms à 150ms :
```typescript
// Dans constants/animations.ts
BOUNCE: 150, // Au lieu de 200
```

## 📚 Ressources

- 📄 **StyledCloseButton.tsx** - Exemple complet
- 🎯 **AnimationSystemExamples.tsx** - Guide détaillé
- 🎨 **animations.ts** - Toutes les constantes

---

**💡 Résultat : Animations cohérentes, maintenance simplifiée, performance optimisée !**

## * COMPOSANTS UTILISANT CE SYSTÈME :
 * ✅ StyledCloseButton (bulle d'eau + scale)
 * ✅ AnimatedButton (scale bounce)
 * ✅ AnimatedQuantityButton (scale bounce + bulle optionnelle)
 * ✅ Button Component (scale bounce + bulle avec withAnimation)
 * ✅ FloatingCartButton (scale bounce + bulle d'eau)
 * ✅ ModalHeader (titre + bouton animé)
 * ✅ ShoppingPageLayout (bottom bar animations)
 * ✅ CartModal (footer animations)
 * ✅ CheckoutModal (footer animations)
