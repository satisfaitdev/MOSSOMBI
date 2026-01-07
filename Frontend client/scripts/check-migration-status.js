#!/usr/bin/env node
/**
 * 📊 Vérificateur de Progression de Migration LAYOUT
 * 
 * Analyse rapidement combien de pages sont déjà migrées vs restantes
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '..', 'app');

const stats = {
  total: 0,
  migrated: 0,
  notMigrated: 0,
  files: {
    migrated: [],
    notMigrated: [],
  }
};

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  
  stats.total++;
  
  // Vérifier si le fichier utilise LAYOUT
  const hasLayoutImport = content.includes('LAYOUT') && content.includes("from '@/constants/colors'");
  const usesLayoutScrollView = content.includes('LAYOUT.scrollViewContent');
  
  if (hasLayoutImport || usesLayoutScrollView) {
    stats.migrated++;
    stats.files.migrated.push(relativePath);
  } else {
    stats.notMigrated++;
    stats.files.notMigrated.push(relativePath);
  }
}

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
      checkFile(filePath);
    }
  });
}

function printProgressBar(current, total) {
  const percentage = (current / total * 100).toFixed(1);
  const barLength = 40;
  const filled = Math.round(barLength * current / total);
  const empty = barLength - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${bar} ${percentage}%`;
}

function main() {
  console.log('📊 Analyse de la progression de migration LAYOUT\n');
  
  walkDirectory(APP_DIR);
  
  console.log('═'.repeat(60));
  console.log('📈 PROGRESSION DE MIGRATION');
  console.log('═'.repeat(60));
  console.log(`\n${printProgressBar(stats.migrated, stats.total)}`);
  console.log(`\n✅ Pages migrées: ${stats.migrated}/${stats.total}`);
  console.log(`⏳ Pages restantes: ${stats.notMigrated}/${stats.total}\n`);
  
  if (stats.notMigrated > 0) {
    console.log('🔴 Pages à migrer:');
    stats.files.notMigrated.slice(0, 10).forEach(file => {
      console.log(`  - ${file}`);
    });
    if (stats.files.notMigrated.length > 10) {
      console.log(`  ... et ${stats.files.notMigrated.length - 10} autres\n`);
    }
  } else {
    console.log('🎉 Toutes les pages sont migrées !\n');
  }
  
  console.log('═'.repeat(60));
}

main();
