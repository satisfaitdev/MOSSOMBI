#!/usr/bin/env node
/**
 * 🔧 Détecteur et Correcteur de Double Padding
 * 
 * Détecte les pages où LAYOUT.scrollViewContent ajoute du padding horizontal,
 * mais où les sections internes ont aussi du padding, causant un double padding.
 * 
 * Usage: node scripts/fix-double-padding.js [--dry-run] [--fix]
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '..', 'app');
const DRY_RUN = process.argv.includes('--dry-run');
const AUTO_FIX = process.argv.includes('--fix');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const stats = {
  filesScanned: 0,
  filesWithDoublePadding: 0,
  patternsFound: [],
  filesFixed: 0,
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Détecte les patterns de double padding
 */
function detectDoublePadding(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  // Pattern 1: <View style={{ padding: SPACING.lg }}> après ScrollView avec LAYOUT
  const pattern1 = /<View style=\{\{\s*padding:\s*SPACING\.lg\s*\}\}>/g;
  
  // Pattern 2: <View style={{ paddingHorizontal: SPACING.lg }}>
  const pattern2 = /<View style=\{\{\s*paddingHorizontal:\s*SPACING\.lg\s*\}\}>/g;
  
  // Pattern 3: style={{ padding: SPACING.lg }}
  const pattern3 = /style=\{\{\s*padding:\s*SPACING\.lg\s*\}\}/g;
  
  // Vérifier si le fichier utilise LAYOUT.scrollViewContent
  const hasLayoutScrollView = content.includes('LAYOUT.scrollViewContent');
  
  if (!hasLayoutScrollView) {
    return issues; // Pas de problème si pas de LAYOUT
  }
  
  lines.forEach((line, index) => {
    if (pattern1.test(line)) {
      issues.push({
        line: index + 1,
        type: 'padding: SPACING.lg',
        content: line.trim(),
        severity: 'high',
      });
    }
    
    if (pattern2.test(line)) {
      issues.push({
        line: index + 1,
        type: 'paddingHorizontal: SPACING.lg',
        content: line.trim(),
        severity: 'high',
      });
    }
    
    // Détecter aussi dans les commentaires de section
    if (line.includes('padding: SPACING.lg') && (
        line.includes('{/* Barre de recherche') ||
        line.includes('{/* Section') ||
        line.includes('{/* Sélecteur') ||
        line.includes('{/* Filtres')
    )) {
      issues.push({
        line: index + 1,
        type: 'Section avec padding',
        content: line.trim(),
        severity: 'medium',
      });
    }
  });
  
  return issues;
}

/**
 * Corrige automatiquement les double paddings
 */
function fixDoublePadding(content) {
  let fixed = content;
  let changeCount = 0;
  
  // Fix 1: Remplacer <View style={{ padding: SPACING.lg }}> par <View>
  const pattern1Before = /<View style=\{\{\s*padding:\s*SPACING\.lg\s*\}\}>/g;
  const pattern1After = '<View>';
  if (pattern1Before.test(content)) {
    fixed = fixed.replace(pattern1Before, pattern1After);
    changeCount++;
  }
  
  // Fix 2: Remplacer <View style={{ paddingHorizontal: SPACING.lg }}> par <View>
  const pattern2Before = /<View style=\{\{\s*paddingHorizontal:\s*SPACING\.lg\s*\}\}>/g;
  const pattern2After = '<View>';
  if (pattern2Before.test(content)) {
    fixed = fixed.replace(pattern2Before, pattern2After);
    changeCount++;
  }
  
  // Fix 3: Supprimer padding: SPACING.lg des styles inline (plus conservateur)
  // Seulement si c'est le seul style
  const pattern3Before = /style=\{\{\s*padding:\s*SPACING\.lg\s*\}\}/g;
  if (pattern3Before.test(content)) {
    fixed = fixed.replace(pattern3Before, '');
    changeCount++;
  }
  
  return { fixed, changeCount };
}

/**
 * Analyse un fichier
 */
function analyzeFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  
  stats.filesScanned++;
  
  const issues = detectDoublePadding(content, filePath);
  
  if (issues.length > 0) {
    stats.filesWithDoublePadding++;
    stats.patternsFound.push({
      file: relativePath,
      issues: issues,
    });
    
    log(`\n⚠️  ${relativePath}`, 'yellow');
    issues.forEach(issue => {
      const icon = issue.severity === 'high' ? '🔴' : '🟡';
      log(`  ${icon} Ligne ${issue.line}: ${issue.type}`, issue.severity === 'high' ? 'red' : 'yellow');
      log(`     ${issue.content}`, 'cyan');
    });
    
    // Auto-fix si demandé
    if (AUTO_FIX && !DRY_RUN) {
      const { fixed, changeCount } = fixDoublePadding(content);
      if (changeCount > 0) {
        fs.writeFileSync(filePath, fixed, 'utf8');
        stats.filesFixed++;
        log(`  ✅ ${changeCount} correction(s) appliquée(s)`, 'green');
      }
    }
  }
}

/**
 * Parcourt récursivement
 */
function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDirectory(filePath);
      }
    } else if (file.endsWith('.tsx')) {
      analyzeFile(filePath);
    }
  });
}

/**
 * Rapport final
 */
function printReport() {
  console.log('\n' + '='.repeat(70));
  log('📊 RAPPORT DE DÉTECTION DES DOUBLE PADDINGS', 'blue');
  console.log('='.repeat(70));
  
  log(`\n📁 Fichiers analysés: ${stats.filesScanned}`, 'cyan');
  log(`⚠️  Fichiers avec double padding: ${stats.filesWithDoublePadding}`, 'yellow');
  
  if (AUTO_FIX && !DRY_RUN) {
    log(`✅ Fichiers corrigés: ${stats.filesFixed}`, 'green');
  }
  
  if (stats.filesWithDoublePadding > 0) {
    console.log('\n' + '='.repeat(70));
    log('📋 RÉSUMÉ DES FICHIERS AFFECTÉS:', 'blue');
    console.log('='.repeat(70));
    
    stats.patternsFound.forEach(item => {
      log(`\n• ${item.file}`, 'yellow');
      log(`  ${item.issues.length} problème(s) détecté(s)`, 'cyan');
    });
    
    if (!AUTO_FIX) {
      console.log('\n' + '='.repeat(70));
      log('💡 SOLUTION:', 'blue');
      console.log('='.repeat(70));
      log('\nPour corriger automatiquement:', 'cyan');
      log('  node scripts/fix-double-padding.js --fix\n', 'green');
      log('Pour voir ce qui serait corrigé:', 'cyan');
      log('  node scripts/fix-double-padding.js --dry-run --fix\n', 'green');
    }
  } else {
    log('\n✅ Aucun double padding détecté !', 'green');
  }
  
  console.log('\n' + '='.repeat(70));
}

/**
 * Main
 */
function main() {
  log('🔍 Détection des double paddings...\n', 'blue');
  
  if (DRY_RUN) {
    log('🔍 MODE DRY-RUN: Simulation sans modification\n', 'yellow');
  }
  
  walkDirectory(APP_DIR);
  printReport();
}

main();
