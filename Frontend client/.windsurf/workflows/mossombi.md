---
description: auto_execution_mode: 1
auto_execution_mode: 1
---

---
description: Workflows Mossombi – migrer, swap, déployer, rollback
auto_execution_mode: 1
---

# Workflow – Migration & Déploiement Mossombi

## 1) Inventorier les pages à migrer
1. Lister toutes les pages `.tsx` (hors `_layout`, `*-migrated.tsx`, et déjà `.old.tsx`).
2. Sélectionner les cibles utiles (non-layout, non déjà migrées).
3. Prioriser: forms simples → steppers → parents.

## 2) Créer les pages `*-migrated.tsx`
1. Copier le pattern DS:
   - Imports: `atoms`, `ui`, `Button`, `Input`, molécules nécessaires.
   - Structure: `HeaderWithBackButton` + `ScrollView` + `Stack/Section/Row`.
2. Pour steppers: utiliser `Stepper` + états par étape.
3. Pour cartes: utiliser `MapView` (recherche Nominatim).

## 3) Swap sécurisé (backup → replace)
1. Vérifier les fichiers `*-migrated.tsx` existent.
2. Exécuter le script de swap:
   - Commande:
     - `powershell -ExecutionPolicy Bypass -File .\scripts\swap-to-migrated.ps1`
3. Confirmer dans la sortie:
   - `[BACKUP] ... -> *.old.tsx`
   - `[REPLACED] ... with ...-migrated.tsx`

## 4) Déploiement
1. Lancer le script de déploiement (demande confirmation):
   - `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-migrated-pages.ps1`
2. Suivre les logs et valider les pages.

## 5) Rollback (si nécessaire)
1. Restaurer un fichier:
   - Renommer `*.old.tsx` → fichier original `.tsx`.
2. Ou réexécuter un script de swap inverse (si présent) ou manuellement.

## 6) Smoke tests
1. Ouvrir: [banking](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/app/banking:0:0-0:0), [bookings](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/app/bookings:0:0-0:0), [delivery](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/app/delivery:0:0-0:0), [public-services](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/app/public-services:0:0-0:0).
2. Tester enfants: `guide`, `savings`, `digital-services`, `package`, `taxi`, `gas`, `moving`.
3. Vérifier headers/navigations.

## 7) Reporting
1. Mettre à jour [BATCH_MIGRATION_COMPLETE.md](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/BATCH_MIGRATION_COMPLETE.md:0:0-0:0):
   - Liste des pages migrées.
   - Confirmation du swap.
   - Prochaines étapes.

## Notes
- Ne pas auto-exécuter les commandes de swap/déploiement sans validation.
- Garder la cohérence DS (pas de styles custom dispersés).
- Toujours importer via les paths absolus alias (`@/components/...`).