---
trigger: manual
---

---
trigger: manual
glob:
  - "app/**/*.tsx"
  - "components/**/*.tsx"
  - "scripts/**/*.ps1"
description: Règles d’assistance IA pour Mossombi (React Native + Expo Router + Design System)
---

# Règles IA – Projet Mossombi

- **[structure]** Projet React Native + Expo Router. Pages sous [app/](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/app:0:0-0:0). Composants DS sous `components/`.
- **[style]** Ne pas ajouter/supprimer de commentaires/docstrings sauf demande explicite.
- **[Design System]** Toujours préférer `Heading`, `Body`, `Caption`, `Badge`, `Section`, `Stack`, `Row`, `Button`, `Input`, et molécules (`Counter`, `RatingDisplay`, `PriceDisplay`, `Stepper`, `MapView`) au lieu de `Text`/`View` custom.
- **[navigation]** Utiliser `useRouter().push()` et respecter l’arborescence Expo Router.
- **[migrations]**
  - Créer des pages `*-migrated.tsx` d’abord; ne jamais écraser directement.
  - Sauvegarder les originaux en `.old.tsx` lors du swap.
  - Pour les pages parents ([banking.tsx](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/app/banking.tsx:0:0-0:0), [bookings.tsx](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/app/bookings.tsx:0:0-0:0), [delivery.tsx](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/app/delivery.tsx:0:0-0:0), [public-services.tsx](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/app/public-services.tsx:0:0-0:0)), utiliser un wrapper DS (Section/Stack + liens enfants).
- **[scripts]** Scripts PowerShell:
  - [scripts/swap-to-migrated.ps1](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/scripts/swap-to-migrated.ps1:0:0-0:0) pour le swap (backup → replace).
  - [scripts/deploy-migrated-pages.ps1](cci:7://file:///c:/Users/satis/Desktop/Workspace/Mossombi/scripts/deploy-migrated-pages.ps1:0:0-0:0) pour déployer (demande confirmation).
- **[sécurité]**
  - Ne jamais exécuter automatiquement de commandes destructives (swap, deploy).
  - Toujours demander confirmation avant toute action qui modifie des fichiers.
- **[commandes]**
  - Ne jamais utiliser `cd`; spécifier `cwd` si nécessaire.
  - Préférer lister/ouvrir fichiers avant d’éditer.
- **[modifs de code]**
  - Imports en haut des fichiers.
  - Respecter les règles pour `replace_file_content` (context 3 lignes avant/après, pas d’imports au milieu).
- **[limitations]**
  - Éviter de créer des fichiers non demandés qui encombrent l’arborescence.
  - Utiliser `components/molecules/index.ts` / `components/templates/index.ts` pour les exports barrel.
- **[cartes]** Utiliser `components/molecules/MapView.tsx` (Leaflet+WebView+Nominatim) pour les écrans à carte.
- **[steppers]** Utiliser `components/molecules/Stepper.tsx` pour les processus multi-étapes (delivery/taxi/gas/moving).