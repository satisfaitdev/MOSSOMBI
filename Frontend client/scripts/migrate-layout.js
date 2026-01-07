#!/usr/bin/env node
/**
 * 🚀 Script de Migration Automatique du Système LAYOUT
 * 
 * Ce script migre automatiquement toutes les pages TSX vers le nouveau système LAYOUT centralisé.
 * 
 * Modifications appliquées:
 * 1. Ajout de l'import LAYOUT si manquant
 * 2. Remplacement de contentContainerStyle={{ paddingBottom: SPACING.xl }} par LAYOUT.scrollViewContent
 * 3. Remplacement de padding: SPACING.lg par LAYOUT.section (optionnel, détecté intelligemment)
 * 
 * Usage: node scripts/migrate-layout.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const APP_DIR = path.join(__dirname, '..', 'app');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Statistiques
const stats = {
  filesScanned: 0,
  filesMigrated: 0,
  importsAdded: 0,
  scrollViewsFixed: 0,
  sectionsFixed: 0,
  errors: [],
};

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Vérifie si le fichier contient déjà LAYOUT dans ses imports
 */
function hasLayoutImport(content) {
  const importRegex = /import\s+{[^}]*LAYOUT[^}]*}\s+from\s+['"]@\/constants\/colors['"]/;
  return importRegex.test(content);
}

/**
 * Ajoute LAYOUT à l'import existant de constants/colors
 */
function addLayoutToImport(content) {
  // Chercher l'import existant
  const importRegex = /import\s+{([^}]*)}\s+from\s+['"]@\/constants\/colors['"]/;
  const match = content.match(importRegex);
  
  if (!match) {
    log('  ⚠️  Aucun import de @/constants/colors trouvé', 'yellow');
    return content;
  }
  
  const currentImports = match[1].trim();
  
  // Vérifier si LAYOUT est déjà présent
  if (currentImports.includes('LAYOUT')) {
    return content;
  }
  
  // Ajouter LAYOUT à la liste des imports
  const newImports = currentImports
    .split(',')
    .map(imp => imp.trim())
    .filter(imp => imp)
    .concat('LAYOUT')
    .sort()
    .join(', ');
  
  const newImportStatement = `import { ${newImports} } from '@/constants/colors'`;
  
  stats.importsAdded++;
  log('  ✅ Import LAYOUT ajouté', 'green');
  
  return content.replace(importRegex, newImportStatement);
}

/**
 * Remplace les contentContainerStyle avec padding par LAYOUT.scrollViewContent
 */
function fixScrollViewStyles(content) {
  let modified = content;
  let changesMade = 0;
  
  // Pattern 1: contentContainerStyle={{ paddingBottom: SPACING.xl }}
  const pattern1 = /contentContainerStyle=\{\{\s*paddingBottom:\s*SPACING\.xl\s*\}\}/g;
  if (pattern1.test(content)) {
    modified = modified.replace(pattern1, 'contentContainerStyle={LAYOUT.scrollViewContent}');
    changesMade++;
  }
  
  // Pattern 2: contentContainerStyle={{ paddingBottom: SPACING.xl, ... }}
  const pattern2 = /contentContainerStyle=\{\{\s*paddingBottom:\s*SPACING\.(xl|xxl)[,\s}]/g;
  const matches = [...content.matchAll(pattern2)];
  if (matches.length > 0) {
    log('  ⚠️  ScrollView avec props multiples détecté - migration manuelle recommandée', 'yellow');
  }
  
  if (changesMade > 0) {
    stats.scrollViewsFixed += changesMade;
    log(`  ✅ ${changesMade} ScrollView(s) migré(s)`, 'green');
  }
  
  return modified;
}

/**
 * Remplace les View avec padding redondant par LAYOUT.section
 * (Plus conservateur - seulement les cas évidents)
 */
function fixSectionStyles(content) {
  let modified = content;
  let changesMade = 0;
  
  // Pattern: <View style={{ paddingHorizontal: SPACING.lg }}>
  // Uniquement si c'est un conteneur de section évident
  const pattern = /<View style=\{\{\s*paddingHorizontal:\s*SPACING\.lg\s*\}\}>/g;
  const matches = [...content.matchAll(pattern)];
  
  // On ne remplace QUE si c'est dans le contexte d'une section (après un commentaire de section)
  matches.forEach(match => {
    const beforeContext = content.substring(Math.max(0, match.index - 200), match.index);
    if (beforeContext.includes('/* Résultats */') || 
        beforeContext.includes('{/* Section') ||
        beforeContext.includes('{/* Liste')) {
      changesMade++;
    }
  });
  
  if (changesMade > 0) {
    stats.sectionsFixed += changesMade;
    log(`  ℹ️  ${changesMade} section(s) potentielle(s) détectée(s) - vérification manuelle recommandée`, 'cyan');
  }
  
  return modified;
}

/**
 * Migre un fichier TSX
 */
function migrateFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fileModified = false;
    
    if (VERBOSE) {
      log(`\n📄 Analyse: ${relativePath}`, 'blue');
    }
    
    // Étape 1: Vérifier et ajouter l'import LAYOUT
    if (!hasLayoutImport(content)) {
      if (content.includes("from '@/constants/colors'")) {
        content = addLayoutToImport(content);
        fileModified = true;
      }
    }
    
    // Étape 2: Migrer les ScrollView
    const beforeScrollView = content;
    content = fixScrollViewStyles(content);
    if (content !== beforeScrollView) {
      fileModified = true;
    }
    
    // Étape 3: Détecter les sections (sans modifier automatiquement)
    fixSectionStyles(content);
    
    // Sauvegarder si modifié
    if (fileModified) {
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, content, 'utf8');
        log(`✅ Migré: ${relativePath}`, 'green');
      } else {
        log(`🔍 [DRY-RUN] Serait migré: ${relativePath}`, 'cyan');
      }
      stats.filesMigrated++;
    } else if (VERBOSE) {
      log(`  ⏭️  Déjà à jour`, 'gray');
    }
    
  } catch (error) {
    log(`❌ Erreur: ${relativePath}`, 'red');
    stats.errors.push({ file: relativePath, error: error.message });
  }
}

/**
 * Parcourt récursivement un dossier et migre tous les fichiers .tsx
 */
function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorer node_modules et autres dossiers système
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDirectory(filePath);
      }
    } else if (file.endsWith('.tsx')) {
      stats.filesScanned++;
      migrateFile(filePath);
    }
  });
}

/**
 * Affiche un rapport final
 */
function printReport() {
  console.log('\n' + '='.repeat(60));
  log('📊 RAPPORT DE MIGRATION', 'blue');
  console.log('='.repeat(60));
  
  log(`\n📁 Fichiers analysés: ${stats.filesScanned}`, 'cyan');
  log(`✅ Fichiers migrés: ${stats.filesMigrated}`, 'green');
  log(`📦 Imports LAYOUT ajoutés: ${stats.importsAdded}`, 'green');
  log(`🔄 ScrollViews migrés: ${stats.scrollViewsFixed}`, 'green');
  log(`📐 Sections détectées: ${stats.sectionsFixed}`, 'cyan');
  
  if (stats.errors.length > 0) {
    log(`\n❌ Erreurs (${stats.errors.length}):`, 'red');
    stats.errors.forEach(err => {
      log(`  - ${err.file}: ${err.error}`, 'red');
    });
  }
  
  const successRate = stats.filesScanned > 0 
    ? ((stats.filesMigrated / stats.filesScanned) * 100).toFixed(1)
    : 0;
  
  console.log('\n' + '='.repeat(60));
  log(`📈 Taux de migration: ${successRate}%`, successRate > 90 ? 'green' : 'yellow');
  console.log('='.repeat(60));
  
  if (DRY_RUN) {
    log('\n⚠️  MODE DRY-RUN: Aucun fichier n\'a été modifié', 'yellow');
    log('Exécutez sans --dry-run pour appliquer les changements', 'yellow');
  } else {
    log('\n✅ Migration terminée !', 'green');
    log('\n📝 Prochaines étapes:', 'blue');
    log('  1. Vérifier les changements avec: git diff', 'cyan');
    log('  2. Tester l\'application', 'cyan');
    log('  3. Corriger manuellement les sections si nécessaire', 'cyan');
  }
}

// Point d'entrée principal
function main() {
  log('🚀 Début de la migration automatique du système LAYOUT\n', 'blue');
  
  if (DRY_RUN) {
    log('🔍 MODE DRY-RUN activé (aucune modification ne sera faite)\n', 'yellow');
  }
  
  if (!fs.existsSync(APP_DIR)) {
    log(`❌ Erreur: Le dossier ${APP_DIR} n'existe pas`, 'red');
    process.exit(1);
  }
  
  walkDirectory(APP_DIR);
  printReport();
}

// Exécuter
main();
