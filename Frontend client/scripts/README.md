# 🤖 Script de Migration Automatique LAYOUT

## 🎯 Description

Ce script migre automatiquement **toutes les pages TSX** de votre application vers le nouveau système `LAYOUT` centralisé.

## ✨ Ce que fait le script

### ✅ Modifications Automatiques

1. **Ajoute l'import LAYOUT** si manquant
   ```typescript
   // AVANT
   import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
   
   // APRÈS
   import { BORDER_RADIUS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/colors';
   ```

2. **Migre les ScrollView**
   ```typescript
   // AVANT
   <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xl }}>
   
   // APRÈS
   <ScrollView contentContainerStyle={LAYOUT.scrollViewContent}>
   ```

3. **Détecte les sections** à vérifier manuellement
   ```typescript
   // Signale les cas comme:
   <View style={{ paddingHorizontal: SPACING.lg }}>
   ```

### 🛡️ Sécurité

- ✅ **Mode DRY-RUN** : Teste sans modifier les fichiers
- ✅ **Rapport détaillé** : Liste tous les changements
- ✅ **Détection intelligente** : Ne touche que ce qui est nécessaire
- ✅ **Sauvegarde Git** : Tous les changements sont versionnés

## 🚀 Utilisation

### Option 1 : Test (Recommandé) 🔍

```bash
# Voir ce qui serait modifié SANS toucher aux fichiers
node scripts/migrate-layout.js --dry-run
```

**Résultat attendu:**
```
🚀 Début de la migration automatique du système LAYOUT

🔍 MODE DRY-RUN activé (aucune modification ne sera faite)

🔍 [DRY-RUN] Serait migré: app/bookings/guide.tsx
  ✅ Import LAYOUT ajouté
  ✅ 1 ScrollView(s) migré(s)

🔍 [DRY-RUN] Serait migré: app/delivery/taxi.tsx
  ✅ Import LAYOUT ajouté
  ✅ 1 ScrollView(s) migré(s)

...

📊 RAPPORT DE MIGRATION
============================================================
📁 Fichiers analysés: 69
✅ Fichiers migrés: 67
📦 Imports LAYOUT ajoutés: 67
🔄 ScrollViews migrés: 67
📐 Sections détectées: 23
📈 Taux de migration: 97.1%
```

### Option 2 : Migration Réelle ⚡

```bash
# Appliquer les modifications
node scripts/migrate-layout.js
```

### Option 3 : Mode Verbeux 📝

```bash
# Afficher tous les détails
node scripts/migrate-layout.js --verbose
```

### Option 4 : Windows (PowerShell) 🪟

```powershell
# Dry-run
.\scripts\migrate-layout.ps1 -DryRun

# Migration réelle
.\scripts\migrate-layout.ps1
```

## 📋 Workflow Recommandé

### 1️⃣ Sauvegarde Git
```bash
git add .
git commit -m "Sauvegarde avant migration LAYOUT"
```

### 2️⃣ Test à vide
```bash
node scripts/migrate-layout.js --dry-run
```
Vérifiez que le rapport vous semble correct.

### 3️⃣ Migration
```bash
node scripts/migrate-layout.js
```

### 4️⃣ Vérification
```bash
# Voir les changements
git diff

# Vérifier que tout compile
npm run build
# ou
npx tsc --noEmit
```

### 5️⃣ Test visuel
```bash
npm start
# Tester quelques pages clés (Hébergement, Vol, etc.)
```

### 6️⃣ Corrections manuelles (si besoin)
Le script signale les sections à vérifier:
```
ℹ️  3 section(s) potentielle(s) détectée(s) - vérification manuelle recommandée
```
Vérifier ces pages et ajuster si nécessaire.

### 7️⃣ Commit
```bash
git add .
git commit -m "feat: Migration vers système LAYOUT centralisé

- Ajout import LAYOUT sur 67 pages
- Migration de 67 ScrollViews vers LAYOUT.scrollViewContent
- Uniformisation des marges à 24px (LAYOUT.screenPadding)
"
```

## 📊 Résultats Attendus

| Métrique | Valeur Attendue |
|----------|-----------------|
| Fichiers analysés | ~69 |
| Fichiers migrés | ~67 (97%) |
| Imports ajoutés | ~67 |
| ScrollViews migrés | ~67 |
| Temps d'exécution | <5 secondes |

## ⚠️ Cas Particuliers

### Pages déjà migrées
Le script détecte et ignore:
- ✅ `app/bookings/hotel.tsx`
- ✅ `app/bookings/flight.tsx`

### Pages avec logique complexe
Le script les migre mais signale pour vérification:
- ⚠️ Pages avec plusieurs ScrollView imbriqués
- ⚠️ Pages avec styles conditionnels complexes
- ⚠️ Pages avec animations sur le padding

## 🐛 En cas de problème

### Erreur : "Cannot find module"
```bash
# Vérifier que vous êtes dans le bon dossier
cd C:\Users\satis\Desktop\Workspace\Mossombi

# Réessayer
node scripts/migrate-layout.js
```

### Erreur : "Permission denied"
```bash
# Sur Windows (PowerShell en admin)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Réessayer
node scripts/migrate-layout.js
```

### Résultat inattendu
```bash
# Annuler tous les changements
git restore .

# Réessayer en dry-run
node scripts/migrate-layout.js --dry-run --verbose
```

## 🎓 Après la migration

1. **Modifier globalement** les marges:
   ```typescript
   // constants/colors.ts
   export const LAYOUT = {
     screenPadding: SPACING.xl,  // 32px au lieu de 24px
     // ...
   }
   ```
   **Toutes les 69 pages s'adaptent automatiquement ! 🎉**

2. **Ajouter de nouvelles pages**:
   ```typescript
   <ScrollView contentContainerStyle={LAYOUT.scrollViewContent}>
     <View style={LAYOUT.section}>
       {/* Votre contenu */}
     </View>
   </ScrollView>
   ```

3. **Responsive** (futur):
   ```typescript
   export const LAYOUT = {
     screenPadding: Platform.select({
       ios: SPACING.lg,
       android: SPACING.lg,
       web: SPACING.xl,  // Plus d'espace sur web
     }),
   }
   ```

## 📞 Support

Si vous rencontrez un problème:
1. Vérifier les logs du script
2. Consulter `LAYOUT_MIGRATION_GUIDE.md`
3. Vérifier que Git est clean avant de relancer

---

**Version:** 1.0.0  
**Auteur:** Cascade AI  
**Date:** 21 octobre 2025
